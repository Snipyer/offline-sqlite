use ed25519_dalek::{Signature, Verifier, VerifyingKey};

use super::types::LicensePayload;

/// The Ed25519 public key (32 bytes), embedded at compile time.
const LICENSE_PUBLIC_KEY: &[u8; 32] = include_bytes!("../../keys/license_pub.key");

/// Verify the signature on a `LKEY-<payload>.<signature>` string and return the
/// deserialized payload on success.
pub fn verify_license_key(key_str: &str) -> Result<LicensePayload, String> {
    let stripped = key_str
        .strip_prefix("LKEY-")
        .ok_or_else(|| "Invalid license key format: missing LKEY- prefix".to_string())?;

    let parts: Vec<&str> = stripped.splitn(2, '.').collect();
    if parts.len() != 2 {
        return Err("Invalid license key format: missing signature".to_string());
    }

    let payload_bytes = base64_url_decode(parts[0])?;
    let sig_bytes = base64_url_decode(parts[1])?;

    let public_key = VerifyingKey::from_bytes(LICENSE_PUBLIC_KEY)
        .map_err(|e| format!("Embedded public key is invalid: {e}"))?;

    let signature = Signature::from_slice(&sig_bytes)
        .map_err(|e| format!("Invalid signature bytes: {e}"))?;

    public_key
        .verify(&payload_bytes, &signature)
        .map_err(|_| "License key signature verification failed".to_string())?;

    let payload: LicensePayload =
        serde_json::from_slice(&payload_bytes).map_err(|e| format!("Malformed license payload: {e}"))?;

    // For subscriptions, check expiry
    if let Some(ref exp) = payload.expires_at {
        let expires = chrono::DateTime::parse_from_rfc3339(exp)
            .map_err(|e| format!("Invalid expires_at: {e}"))?;
        if expires < chrono::Utc::now() {
            return Err("License key has expired".to_string());
        }
    }

    Ok(payload)
}

/// Verify a signed activation token blob returned by the license server.
/// The server signs with the same Ed25519 private key.
pub fn verify_activation_blob(signed_blob: &str) -> Result<super::types::ActivationToken, String> {
    let parts: Vec<&str> = signed_blob.splitn(2, '.').collect();
    if parts.len() != 2 {
        return Err("Invalid activation blob format".to_string());
    }

    let payload_bytes = base64_url_decode(parts[0])?;
    let sig_bytes = base64_url_decode(parts[1])?;

    let public_key = VerifyingKey::from_bytes(LICENSE_PUBLIC_KEY)
        .map_err(|e| format!("Embedded public key is invalid: {e}"))?;

    let signature = Signature::from_slice(&sig_bytes)
        .map_err(|e| format!("Invalid signature bytes: {e}"))?;

    public_key
        .verify(&payload_bytes, &signature)
        .map_err(|_| "Activation token signature verification failed".to_string())?;

    let token: super::types::ActivationToken =
        serde_json::from_slice(&payload_bytes).map_err(|e| format!("Malformed activation token: {e}"))?;

    Ok(token)
}

// ── base64url helpers ───────────────────────────────────
fn base64_url_decode(input: &str) -> Result<Vec<u8>, String> {
    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;
    URL_SAFE_NO_PAD
        .decode(input)
        .map_err(|e| format!("Base64 decode error: {e}"))
}
