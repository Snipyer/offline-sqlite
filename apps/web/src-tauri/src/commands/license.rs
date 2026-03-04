use tauri::{Manager, State};
use crate::licensing::types::{ActivationResult, LicenseState};
use crate::state::AppState;
use crate::server as server_module;

#[tauri::command]
pub fn get_license_status(state: State<'_, AppState>) -> Result<LicenseState, String> {
    let guard = state.license_state.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[tauri::command]
pub async fn activate_license(
    key: String,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<ActivationResult, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    let result = crate::licensing::activation::activate_license(key, &app_data_dir).await?;

    if result.success {
        let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
        *guard = result.license_state.clone();

        let app_clone = app.clone();
        tauri::async_runtime::spawn(async move {
            match server_module::start_server(app_clone).await {
                Ok(_) => log::info!("Server sidecar started after activation"),
                Err(e) => log::error!("Failed to start server after activation: {}", e),
            }
        });
    }

    Ok(result)
}

#[tauri::command]
pub async fn deactivate_license(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;

    crate::licensing::activation::deactivate_license(&app_data_dir).await?;

    let mut guard = state.license_state.lock().map_err(|e| e.to_string())?;
    *guard = LicenseState::None;

    Ok(())
}
