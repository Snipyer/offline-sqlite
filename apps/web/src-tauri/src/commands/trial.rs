use tauri::{Manager, State};
use crate::licensing::types::{LicenseState, TrialInfo};
use crate::state::AppState;
use crate::server as server_module;

#[tauri::command]
pub fn start_trial(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<TrialInfo, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    let info = crate::licensing::trial::start_trial(&app_data_dir)?;

    let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
    *guard = LicenseState::Trial {
        days_remaining: info.days_remaining,
    };

    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        match server_module::start_server(app_clone).await {
            Ok(_) => log::info!("Server sidecar started for trial"),
            Err(e) => log::error!("Failed to start server for trial: {}", e),
        }
    });

    Ok(info)
}

#[tauri::command]
pub fn get_trial_status(app: tauri::AppHandle) -> Result<TrialInfo, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    crate::licensing::trial::get_trial_status(&app_data_dir)
}

#[tauri::command]
pub fn deactivate_trial(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    crate::licensing::trial::deactivate_trial(&app_data_dir)?;

    let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
    *guard = LicenseState::None;

    Ok(())
}
