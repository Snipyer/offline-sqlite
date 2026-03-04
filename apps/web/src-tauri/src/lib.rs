use dotenv::dotenv;
use std::env;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

mod licensing;

use licensing::types::{ActivationResult, LicenseState, TrialInfo};

struct AppState {
    sidecar_child: Mutex<Option<tauri_plugin_shell::process::CommandChild>>,
    license_state: Mutex<LicenseState>,
}

// ── Tauri commands ──────────────────────────────────────

#[tauri::command]
async fn check_server_health() -> Result<bool, String> {
    match reqwest::get("http://127.0.0.1:3000/").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn check_license_server_health(license_server_url: String) -> Result<bool, String> {
    let health_url = format!("{}/health", license_server_url);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let platform = std::env::consts::OS;
    let app_version = env!("CARGO_PKG_VERSION");

    let response = client
        .head(&health_url)
        .header("X-Client-Platform", platform)
        .header("X-Client-Version", app_version)
        .header("X-Client-Type", "desktop-app")
        .send()
        .await;

    match response {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(e) => {
            log::error!("License server health check failed: {}", e);
            Ok(false)
        }
    }
}

#[tauri::command]
fn get_license_status(state: tauri::State<'_, AppState>) -> Result<LicenseState, String> {
    let guard = state.license_state.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[tauri::command]
async fn activate_license(
    key: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<ActivationResult, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    let result = licensing::activation::activate_license(key, &app_data_dir).await?;

    // Update in-memory state
    if result.success {
        let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
        *guard = result.license_state.clone();

        // Start the sidecar now that we have a valid license
        let app_clone = app.clone();
        tauri::async_runtime::spawn(async move {
            match start_server(app_clone).await {
                Ok(_) => log::info!("Server sidecar started after activation"),
                Err(e) => log::error!("Failed to start server after activation: {}", e),
            }
        });
    }

    Ok(result)
}

#[tauri::command]
async fn deactivate_license(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    licensing::activation::deactivate_license(&app_data_dir).await?;

    let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
    *guard = LicenseState::None;

    Ok(())
}

#[tauri::command]
fn start_trial(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<TrialInfo, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    let info = licensing::trial::start_trial(&app_data_dir)?;

    // Update in-memory state
    let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
    *guard = LicenseState::Trial {
        days_remaining: info.days_remaining,
    };

    // Start sidecar for trial
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        match start_server(app_clone).await {
            Ok(_) => log::info!("Server sidecar started for trial"),
            Err(e) => log::error!("Failed to start server for trial: {}", e),
        }
    });

    Ok(info)
}

#[tauri::command]
fn get_trial_status(app: tauri::AppHandle) -> Result<TrialInfo, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    licensing::trial::get_trial_status(&app_data_dir)
}

#[tauri::command]
fn deactivate_trial(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    licensing::trial::deactivate_trial(&app_data_dir)?;

    let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
    *guard = LicenseState::None;

    Ok(())
}

// ── App entry point ─────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .manage(AppState {
            sidecar_child: Mutex::new(None),
            license_state: Mutex::new(LicenseState::None),
        })
        .invoke_handler(tauri::generate_handler![
            check_server_health,
            check_license_server_health,
            get_license_status,
            activate_license,
            deactivate_license,
            start_trial,
            get_trial_status,
            deactivate_trial,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            // ── Anti-debug check (no-op in debug builds) ──
            licensing::anti_debug::check_debugger();

            // ── License check before starting server ──
            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).ok();

            let license_state = licensing::activation::check_license_on_startup(&app_data_dir);
            log::info!("License state on startup: {:?}", license_state);

            // Store the state for the frontend to query
            if let Some(state) = app_handle.try_state::<AppState>() {
                *state.license_state.lock().unwrap() = license_state.clone();
            }

            match &license_state {
                LicenseState::Valid { .. } | LicenseState::Trial { .. } => {
                    // Start sidecar server
                    let handle = app_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        match start_server(handle).await {
                            Ok(_) => log::info!("Server sidecar started successfully"),
                            Err(e) => log::error!("Failed to start server sidecar: {}", e),
                        }
                    });
                }
                _ => {
                    // Don't start the server — frontend will show activation screen
                    log::info!("No valid license — server not started. Waiting for activation.");
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                kill_sidecar_if_running(window.app_handle(), "window close requested");
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::ExitRequested { .. } => {
            kill_sidecar_if_running(app_handle, "app exit requested");
        }
        tauri::RunEvent::Exit => {
            kill_sidecar_if_running(app_handle, "app exit");
        }
        _ => {}
    });
}

fn kill_sidecar_if_running(app_handle: &tauri::AppHandle, reason: &str) {
    if let Some(state) = app_handle.try_state::<AppState>() {
        if let Ok(mut child_guard) = state.sidecar_child.lock() {
            if let Some(child) = child_guard.take() {
                log::info!("Killing server sidecar process ({})", reason);
                let _ = child.kill();
            }
        }
    }
}

/// Check if we're running from the source directory (development) or as a bundled app
fn is_running_from_source() -> bool {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    // Check if the Cargo.toml exists in the expected location
    // If it doesn't exist, we're running a bundled app
    manifest_dir.join("Cargo.toml").exists()
}

async fn start_server(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<AppState>() {
        let child_guard = state.sidecar_child.lock().map_err(|e| e.to_string())?;
        if child_guard.is_some() {
            log::info!("Server sidecar already running. Skipping spawn.");
            return Ok(());
        }
    }

    let is_debug_build = cfg!(debug_assertions);
    let from_source = is_running_from_source();

    // When running from source in debug mode: use source directory for database
    // When running as a bundled app (debug or release): use app_data_dir with migrations
    let is_dev = is_debug_build && from_source;

    // Only load .env files when running from source
    // In bundled apps, env vars must be set at compile time or in system environment
    let env_vars = if is_dev {
        load_dotenv_files()
    } else {
        EnvVars::from_env().map_err(|e| {
            log::error!("Environment variable not set: {}", e);
            format!("Environment variable not set: {}", e)
        })?
    };

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create data directory: {}", e))?;

    log::info!("App data dir: {:?}", app_data_dir);

    let env_mode = if is_dev { "development" } else { "production" };

    log::info!("env: {}", env_mode);

    // When running from source: use absolute path to project root local.db
    // When running as bundled app: use app_data_dir for database and migrations,
    // seeded from bundled resources.
    let (database_url, migrations_path) = if is_dev {
        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        // src-tauri is at apps/web/src-tauri, so go up 3 levels to reach project root
        let project_root = manifest_dir.join("..").join("..").join("..");
        let db_path = project_root
            .canonicalize()
            .unwrap_or(project_root.clone())
            .join("local.db");
        log::info!("Development mode: using database at {:?}", db_path);
        (db_path.display().to_string(), None)
    } else {
        let db_path = app_data_dir.join("local.db");
        let resource_dir = app
            .path()
            .resource_dir()
            .map_err(|e| format!("Failed to get resource dir: {}", e))?;
        let app_migrations = app_data_dir.join("migrations");

        log::info!("Resource dir: {:?}", resource_dir);
        let bundled_migrations = resolve_bundled_migrations_dir(&resource_dir).ok_or_else(|| {
            format!(
                "Could not find bundled migrations in resource dir {:?}. Tried server-data/migrations and migrations",
                resource_dir
            )
        })?;

        log::info!(
            "Syncing bundled migrations from {:?} to {:?}",
            bundled_migrations,
            app_migrations
        );
        copy_dir_all(&bundled_migrations, &app_migrations)
            .map_err(|e| format!("Failed to copy migrations to app data dir: {}", e))?;

        if is_debug_build {
            log::info!("Debug bundled mode: using database at {:?}", db_path);
        } else {
            log::info!("Production mode: using database at {:?}", db_path);
        }
        log::info!("Migrations path: {:?}", app_migrations);
        (db_path.display().to_string(), Some(app_migrations))
    };

    log::info!("DATABASE_URL: {}", database_url);

    let mut sidecar = app
        .shell()
        .sidecar("server")
        .map_err(|e| e.to_string())?
        .env("BETTER_AUTH_SECRET", &env_vars.better_auth_secret)
        .env("BETTER_AUTH_URL", &env_vars.better_auth_url)
        .env("CORS_ORIGIN", &env_vars.cors_origin)
        .env("DATABASE_URL", &database_url)
        .env("NODE_ENV", &env_mode)
        .env("TAURI_ENVIRONMENT", "true");

    // ── Sidecar launch token (anti-extraction) ──
    {
        use sha2::{Digest, Sha256};
        let launch_token = hex::encode(rand::random::<[u8; 32]>());
        let embedded_secret = "offline-sqlite-sidecar-secret-v1";
        let mut hasher = Sha256::new();
        hasher.update(format!("{}{}", launch_token, embedded_secret));
        let launch_hash = hex::encode(hasher.finalize());
        sidecar = sidecar
            .env("__TAURI_LAUNCH_TOKEN__", &launch_token)
            .env("__TAURI_LAUNCH_HASH__", &launch_hash);
    }

    // Only set migrations folder in production
    if let Some(migrations) = migrations_path {
        sidecar = sidecar.env("MIGRATIONS_FOLDER", migrations);
    }

    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    if let Some(state) = app.try_state::<AppState>() {
        *state.sidecar_child.lock().unwrap() = Some(child);
    }

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let line_str = String::from_utf8_lossy(&line);
                    log::info!("[Server] {}", line_str.trim());
                }
                CommandEvent::Stderr(line) => {
                    let line_str = String::from_utf8_lossy(&line);
                    log::error!("[Server Error] {}", line_str.trim());
                }
                CommandEvent::Error(error) => {
                    log::error!("[Server Process Error] {}", error);
                }
                CommandEvent::Terminated(payload) => {
                    log::warn!("[Server] Process terminated with code: {:?}", payload.code);
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

struct EnvVars {
    better_auth_secret: String,
    better_auth_url: String,
    cors_origin: String,
}

const BETTER_AUTH_SECRET_CT: Option<&'static str> = option_env!("BETTER_AUTH_SECRET");
const BETTER_AUTH_URL_CT: Option<&'static str> = option_env!("BETTER_AUTH_URL");
const CORS_ORIGIN_CT: Option<&'static str> = option_env!("CORS_ORIGIN");

impl EnvVars {
    fn from_env() -> Result<Self, String> {
        Ok(Self {
            better_auth_secret: get_env_or_compile_time(
                "BETTER_AUTH_SECRET",
                BETTER_AUTH_SECRET_CT,
            )?,
            better_auth_url: get_env_or_compile_time("BETTER_AUTH_URL", BETTER_AUTH_URL_CT)?,
            cors_origin: get_env_or_compile_time("CORS_ORIGIN", CORS_ORIGIN_CT)?,
        })
    }
}

fn load_dotenv_files() -> EnvVars {
    dotenv().ok();

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let web_env = manifest_dir.join(".env");
    let server_env = manifest_dir
        .join("..")
        .join("..")
        .join("server")
        .join(".env");

    if web_env.exists() {
        log::info!("Loading .env from: {:?}", web_env);
        let _ = dotenv::from_path(&web_env);
    }

    if server_env.exists() {
        log::info!("Loading .env from: {:?}", server_env);
        let _ = dotenv::from_path(&server_env);
    }

    // After loading .env files, read from environment
    EnvVars {
        better_auth_secret: get_env_or_compile_time("BETTER_AUTH_SECRET", BETTER_AUTH_SECRET_CT)
            .expect("BETTER_AUTH_SECRET environment variable must be set"),
        better_auth_url: get_env_or_compile_time("BETTER_AUTH_URL", BETTER_AUTH_URL_CT)
            .expect("BETTER_AUTH_URL environment variable must be set"),
        cors_origin: get_env_or_compile_time("CORS_ORIGIN", CORS_ORIGIN_CT)
            .expect("CORS_ORIGIN environment variable must be set"),
    }
}

fn get_env_or_compile_time(
    key: &str,
    compile_time: Option<&'static str>,
) -> Result<String, String> {
    if let Ok(value) = env::var(key) {
        return Ok(value);
    }

    if let Some(value) = compile_time {
        return Ok(value.to_string());
    }

    Err(format!("{key} not set"))
}

fn resolve_bundled_migrations_dir(resource_dir: &Path) -> Option<PathBuf> {
    let candidates = [
        resource_dir.join("server-data").join("migrations"),
        resource_dir.join("migrations"),
    ];

    for candidate in candidates {
        if candidate.exists() {
            return Some(candidate);
        }
    }

    None
}

fn copy_dir_all(
    src: impl AsRef<std::path::Path>,
    dst: impl AsRef<std::path::Path>,
) -> std::io::Result<()> {
    std::fs::create_dir_all(&dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}
