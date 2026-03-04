use crate::licensing::types::LicenseState;
use std::sync::Mutex;

pub struct AppState {
    pub sidecar_child: Mutex<Option<tauri_plugin_shell::process::CommandChild>>,
    pub license_state: Mutex<LicenseState>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            sidecar_child: Mutex::new(None),
            license_state: Mutex::new(LicenseState::None),
        }
    }
}
