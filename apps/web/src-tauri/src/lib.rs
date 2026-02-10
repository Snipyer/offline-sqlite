use dotenv::dotenv;
use std::env;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

struct AppState {
    sidecar_child: Mutex<Option<tauri_plugin_shell::process::CommandChild>>,
}

#[tauri::command]
async fn check_server_health() -> Result<bool, String> {
    match reqwest::get("http://127.0.0.1:3000/").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(AppState {
            sidecar_child: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![check_server_health])
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match start_server(app_handle.clone()).await {
                    Ok(_) => log::info!("Server sidecar started successfully"),
                    Err(e) => log::error!("Failed to start server sidecar: {}", e),
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(state) = window.app_handle().try_state::<AppState>() {
                    if let Ok(mut child_guard) = state.sidecar_child.lock() {
                        if let Some(child) = child_guard.take() {
                            log::info!("Killing server sidecar process");
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn start_server(app: tauri::AppHandle) -> Result<(), String> {
    let is_dev = cfg!(debug_assertions);
    
    // Only load .env files in development
    // In production, env vars must be set in the system environment
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

    let env_mode = if is_dev { "development" } else { "production" };

    log::info!("env: {}", env_mode);

    // In dev, use absolute path to project root local.db
    // In production, use app_data_dir for the database and copy bundled migrations there
    let (database_url, migrations_path) = if is_dev {
        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        // src-tauri is at apps/web/src-tauri, so go up 3 levels to reach project root
        let project_root = manifest_dir.join("..").join("..").join("..");
        let db_path = project_root.canonicalize().unwrap_or(project_root.clone()).join("local.db");
        log::info!("Development mode: using database at {:?}", db_path);
        (db_path.display().to_string(), None)
    } else {
        let db_path = app_data_dir.join("local.db");
        let resource_dir = app
            .path()
            .resource_dir()
            .map_err(|e| format!("Failed to get resource dir: {}", e))?;
        let bundled_migrations = resource_dir.join("server-data").join("migrations");
        let app_migrations = app_data_dir.join("migrations");

        if bundled_migrations.exists() {
            if !app_migrations.exists() {
                log::info!("Copying migrations from {:?} to {:?}", bundled_migrations, app_migrations);
                copy_dir_all(&bundled_migrations, &app_migrations)
                    .map_err(|e| format!("Failed to copy migrations: {}", e))?;
            } else {
                log::info!("Migrations already present at {:?}", app_migrations);
            }
        }

        log::info!("Production mode: using database at {:?}", db_path);
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
        .env("NODE_ENV", &env_mode);

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
            better_auth_secret: get_env_or_compile_time("BETTER_AUTH_SECRET", BETTER_AUTH_SECRET_CT)?,
            better_auth_url: get_env_or_compile_time("BETTER_AUTH_URL", BETTER_AUTH_URL_CT)?,
            cors_origin: get_env_or_compile_time("CORS_ORIGIN", CORS_ORIGIN_CT)?,
        })
    }
}

fn load_dotenv_files() -> EnvVars {
    dotenv().ok();

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let web_env = manifest_dir.join(".env");
    let server_env = manifest_dir.join("..").join("..").join("server").join(".env");

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

fn get_env_or_compile_time(key: &str, compile_time: Option<&'static str>) -> Result<String, String> {
    if let Ok(value) = env::var(key) {
        return Ok(value);
    }

    if let Some(value) = compile_time {
        return Ok(value.to_string());
    }

    Err(format!("{key} not set"))
}

fn copy_dir_all(src: impl AsRef<std::path::Path>, dst: impl AsRef<std::path::Path>) -> std::io::Result<()> {
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
