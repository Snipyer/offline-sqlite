#[tauri::command]
pub async fn check_server_health() -> Result<bool, String> {
    match reqwest::get("http://127.0.0.1:3000/").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn check_license_server_health(license_server_url: String) -> Result<bool, String> {
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
