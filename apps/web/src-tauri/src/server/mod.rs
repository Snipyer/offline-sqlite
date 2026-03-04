pub mod env;
pub mod filesystem;

use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use sha2::{Digest, Sha256};

use crate::state::AppState;
use self::env::EnvVars;
use self::env::load_dotenv_files;
use self::filesystem::{resolve_bundled_migrations_dir, copy_dir_all};

pub fn is_running_from_source() -> bool {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir.join("Cargo.toml").exists()
}

pub fn kill_sidecar_if_running(app_handle: &tauri::AppHandle, reason: &str) {
    if let Some(state) = app_handle.try_state::<AppState>() {
        if let Ok(mut child_guard) = state.sidecar_child.lock() {
            if let Some(child) = child_guard.take() {
                log::info!("Killing server sidecar process ({})", reason);
                let _ = child.kill();
            }
        }
    }
}

pub async fn start_server(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<AppState>() {
        let child_guard = state.sidecar_child.lock().map_err(|e| e.to_string())?;
        if child_guard.is_some() {
            log::info!("Server sidecar already running. Skipping spawn.");
            return Ok(());
        }
    }

    let is_debug_build = cfg!(debug_assertions);
    let from_source = is_running_from_source();
    let is_dev = is_debug_build && from_source;

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

    let (database_url, migrations_path) = if is_dev {
        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
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

    let launch_token = hex::encode(rand::random::<[u8; 32]>());
    let embedded_secret = "offline-sqlite-sidecar-secret-v1";
    let mut hasher = Sha256::new();
    hasher.update(format!("{}{}", launch_token, embedded_secret));
    let launch_hash = hex::encode(hasher.finalize());
    sidecar = sidecar
        .env("__TAURI_LAUNCH_TOKEN__", &launch_token)
        .env("__TAURI_LAUNCH_HASH__", &launch_hash);

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
