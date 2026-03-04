mod commands;
mod licensing;
mod server;
mod state;

use tauri::Manager;
use licensing::types::LicenseState;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::health::check_server_health,
            commands::health::check_license_server_health,
            commands::license::get_license_status,
            commands::license::activate_license,
            commands::license::deactivate_license,
            commands::trial::start_trial,
            commands::trial::get_trial_status,
            commands::trial::deactivate_trial,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            licensing::anti_debug::check_debugger();

            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).ok();

            let license_state = licensing::activation::check_license_on_startup(&app_data_dir);
            log::info!("License state on startup: {:?}", license_state);

            if let Some(state) = app_handle.try_state::<AppState>() {
                *state.license_state.lock().unwrap() = license_state.clone();
            }

            match &license_state {
                LicenseState::Valid { .. } | LicenseState::Trial { .. } => {
                    let handle = app_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        match server::start_server(handle).await {
                            Ok(_) => log::info!("Server sidecar started successfully"),
                            Err(e) => log::error!("Failed to start server sidecar: {}", e),
                        }
                    });
                }
                _ => {
                    log::info!("No valid license — server not started. Waiting for activation.");
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                server::kill_sidecar_if_running(window.app_handle(), "window close requested");
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::ExitRequested { .. } => {
            server::kill_sidecar_if_running(app_handle, "app exit requested");
        }
        tauri::RunEvent::Exit => {
            server::kill_sidecar_if_running(app_handle, "app exit");
        }
        _ => {}
    });
}
