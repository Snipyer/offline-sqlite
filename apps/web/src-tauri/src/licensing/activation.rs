use super::fingerprint;
use super::storage;
use super::types::{ActivationResult, LicenseState, StoredLicense};
use super::validation;
use std::path::PathBuf;

/// The URL of the license activation server. Override with `LICENSE_SERVER_URL`
/// env var at compile time for production.
fn license_server_url() -> String {
    option_env!("LICENSE_SERVER_URL")
        .unwrap_or("http://localhost:8787")
        .to_string()
}

/// Activate a license key. Validates signature locally first, then contacts the
/// license server for online activation.
pub async fn activate_license(
    key: String,
    app_data_dir: &PathBuf,
) -> Result<ActivationResult, String> {
    // Step 1: local signature verification
    let payload = validation::verify_license_key(&key)?;

    // Step 2: generate hardware fingerprint
    let (fp, fp_signals) = fingerprint::generate_fingerprint();

    // Step 3: contact license server
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "license_key": key,
        "fingerprint": fp,
        "fingerprint_signals": fp_signals,
        "app_version": env!("CARGO_PKG_VERSION"),
        "os": std::env::consts::OS,
    });

    let response = client
        .post(format!("{}/api/activate", license_server_url()))
        .json(&body)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("Network error during activation: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Activation failed ({status}): {text}"));
    }

    #[derive(serde::Deserialize)]
    struct ServerResponse {
        activation_token: String, // signed blob
        #[allow(dead_code)]
        activated_at: String,
    }

    let resp: ServerResponse = response
        .json()
        .await
        .map_err(|e| format!("Invalid server response: {e}"))?;

    // Step 4: verify the activation token locally
    let token = validation::verify_activation_blob(&resp.activation_token)?;

    // Step 5: persist
    let stored = StoredLicense::Activation {
        token: token.clone(),
        signed_blob: resp.activation_token,
    };
    storage::save_license(app_data_dir, &stored)?;

    Ok(ActivationResult {
        success: true,
        message: "License activated successfully".to_string(),
        license_state: LicenseState::Valid {
            plan: payload.plan.clone(),
            features: payload.features.clone(),
            expires_at: payload.expires_at.clone(),
        },
    })
}

/// Deactivate the current license and (optionally) notify the server.
pub async fn deactivate_license(app_data_dir: &PathBuf) -> Result<(), String> {
    // Try to read the current license to send the deactivation request
    if let Ok(stored) = storage::load_license(app_data_dir) {
        if let StoredLicense::Activation { token, .. } = stored {
            let (fp, _) = fingerprint::generate_fingerprint();
            let client = reqwest::Client::new();
            let body = serde_json::json!({
                "license_id": token.license_id,
                "fingerprint": fp,
            });

            // Best-effort: don't fail if the server is unreachable
            let _ = client
                .post(format!("{}/api/deactivate", license_server_url()))
                .json(&body)
                .timeout(std::time::Duration::from_secs(10))
                .send()
                .await;
        }
    }

    storage::delete_license(app_data_dir)?;
    Ok(())
}

/// Check the locally-stored license on startup (offline, no network).
pub fn check_license_on_startup(app_data_dir: &PathBuf) -> LicenseState {
    if !storage::license_exists(app_data_dir) {
        return LicenseState::None;
    }

    match storage::load_license(app_data_dir) {
        Err(_) => LicenseState::Invalid,
        Ok(stored) => match stored {
            StoredLicense::Activation { token, signed_blob } => {
                // Re-verify the signed blob
                if validation::verify_activation_blob(&signed_blob).is_err() {
                    return LicenseState::Invalid;
                }

                // Verify fingerprint matches
                let (current_fp, _) = fingerprint::generate_fingerprint();
                if token.fingerprint != current_fp {
                    return LicenseState::Invalid;
                }

                // Check expiry for subscriptions
                if let Some(ref exp) = token.expires_at {
                    if let Ok(expires) = chrono::DateTime::parse_from_rfc3339(exp) {
                        if expires < chrono::Utc::now() {
                            return LicenseState::Expired;
                        }
                    }
                }

                LicenseState::Valid {
                    plan: token.plan.clone(),
                    features: token.features.clone(),
                    expires_at: token.expires_at.clone(),
                }
            }
            StoredLicense::Trial(trial_token) => {
                let now = chrono::Utc::now();

                // Clock rollback detection
                if let Ok(last_seen) = chrono::DateTime::parse_from_rfc3339(&trial_token.last_seen) {
                    if now < last_seen.with_timezone(&chrono::Utc) {
                        return LicenseState::TrialExpired;
                    }
                }

                if let Ok(trial_end) = chrono::DateTime::parse_from_rfc3339(&trial_token.trial_end) {
                    let remaining = (trial_end.with_timezone(&chrono::Utc) - now).num_days();
                    if remaining > 0 {
                        return LicenseState::Trial {
                            days_remaining: remaining,
                        };
                    }
                }

                LicenseState::TrialExpired
            }
        },
    }
}
