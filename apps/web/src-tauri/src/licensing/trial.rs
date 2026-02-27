use chrono::{Duration, Utc};

use super::fingerprint;
use super::storage;
use super::types::{StoredLicense, TrialInfo, TrialToken};
use std::path::PathBuf;

const TRIAL_DAYS: i64 = 7;

/// Start a new trial. Returns error if one already exists.
pub fn start_trial(app_data_dir: &PathBuf) -> Result<TrialInfo, String> {
    // If a license file already exists, check whether it is a trial
    if storage::license_exists(app_data_dir) {
        if let Ok(stored) = storage::load_license(app_data_dir) {
            match stored {
                StoredLicense::Trial(_) => {
                    return Err("A trial is already active on this machine".to_string());
                }
                StoredLicense::Activation { .. } => {
                    return Err("A license is already activated — no trial needed".to_string());
                }
            }
        }
    }

    let (fp, _) = fingerprint::generate_fingerprint();
    let now = Utc::now();
    let end = now + Duration::days(TRIAL_DAYS);

    let token = TrialToken {
        token_type: "trial".to_string(),
        fingerprint: fp,
        trial_start: now.to_rfc3339(),
        trial_end: end.to_rfc3339(),
        last_seen: now.to_rfc3339(),
    };

    let stored = StoredLicense::Trial(token.clone());
    storage::save_license(app_data_dir, &stored)?;

    Ok(TrialInfo {
        active: true,
        days_remaining: TRIAL_DAYS,
        trial_end: end.to_rfc3339(),
    })
}

/// Check the status of an existing trial. Updates the `last_seen` timestamp for
/// clock-rollback detection.
pub fn get_trial_status(app_data_dir: &PathBuf) -> Result<TrialInfo, String> {
    let stored = storage::load_license(app_data_dir)?;

    let mut token = match stored {
        StoredLicense::Trial(t) => t,
        _ => return Err("No trial found".to_string()),
    };

    let now = Utc::now();

    // Clock rollback detection
    let last_seen = chrono::DateTime::parse_from_rfc3339(&token.last_seen)
        .map_err(|e| format!("Invalid last_seen: {e}"))?
        .with_timezone(&Utc);

    if now < last_seen {
        // Clock was rolled back — invalidate the trial
        return Ok(TrialInfo {
            active: false,
            days_remaining: 0,
            trial_end: token.trial_end.clone(),
        });
    }

    let trial_end = chrono::DateTime::parse_from_rfc3339(&token.trial_end)
        .map_err(|e| format!("Invalid trial_end: {e}"))?
        .with_timezone(&Utc);

    let remaining = (trial_end - now).num_days();

    let active = remaining > 0 && now < trial_end;

    // Update last_seen
    token.last_seen = now.to_rfc3339();
    let updated = StoredLicense::Trial(token.clone());
    storage::save_license(app_data_dir, &updated)?;

    Ok(TrialInfo {
        active,
        days_remaining: remaining.max(0),
        trial_end: token.trial_end,
    })
}

/// Deactivate the current trial by removing the local license/trial token.
pub fn deactivate_trial(app_data_dir: &PathBuf) -> Result<(), String> {
    storage::delete_license(app_data_dir)
}
