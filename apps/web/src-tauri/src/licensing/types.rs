use serde::{Deserialize, Serialize};

/// Payload embedded inside a signed license key (mirrors the JSON the server creates).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicensePayload {
    pub id: String,
    pub email: String,
    pub plan: LicensePlan,
    pub seats: u32,
    pub created_at: String,
    pub expires_at: Option<String>,
    pub features: Vec<String>,
    pub max_transfers: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicensePlan {
    Perpetual,
    Subscription,
}

/// Token returned by the license server after online activation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationToken {
    pub license_id: String,
    pub fingerprint: String,
    pub plan: LicensePlan,
    pub features: Vec<String>,
    pub activated_at: String,
    pub expires_at: Option<String>,
}

/// Persisted trial information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialToken {
    #[serde(rename = "type")]
    pub token_type: String, // "trial"
    pub fingerprint: String,
    pub trial_start: String,
    pub trial_end: String,
    pub last_seen: String,
}

/// Overall state returned to the frontend / used by the startup gate.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "state")]
pub enum LicenseState {
    #[serde(rename = "valid")]
    Valid {
        plan: LicensePlan,
        features: Vec<String>,
        expires_at: Option<String>,
    },
    #[serde(rename = "trial")]
    Trial { days_remaining: i64 },
    #[serde(rename = "trial_expired")]
    TrialExpired,
    #[serde(rename = "expired")]
    Expired,
    #[serde(rename = "invalid")]
    Invalid,
    #[serde(rename = "none")]
    None,
}

/// Data stored in the encrypted license.dat file.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum StoredLicense {
    #[serde(rename = "activation")]
    Activation {
        token: ActivationToken,
        /// raw signed token blob from the server, for re-verification
        signed_blob: String,
    },
    #[serde(rename = "trial")]
    Trial(TrialToken),
}

/// Result sent back to the frontend via Tauri command.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationResult {
    pub success: bool,
    pub message: String,
    pub license_state: LicenseState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialInfo {
    pub active: bool,
    pub days_remaining: i64,
    pub trial_end: String,
}
