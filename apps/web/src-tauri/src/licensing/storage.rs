use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use hkdf::Hkdf;
use sha2::Sha256;
use std::fs;
use std::path::PathBuf;

use super::fingerprint;
use super::types::StoredLicense;

/// A compile-time embedded secret used together with the hardware fingerprint to
/// derive the encryption key. Change this for your production build.
const EMBEDDED_APP_SECRET: &[u8] = b"offline-sqlite-license-secret-v1";

/// Nonce size for AES-256-GCM (96 bits / 12 bytes).
const NONCE_SIZE: usize = 12;

/// Return the path to the encrypted license file inside `app_data_dir`.
pub fn license_file_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("license.dat")
}

/// Persist a `StoredLicense` as an encrypted blob.
pub fn save_license(app_data_dir: &PathBuf, license: &StoredLicense) -> Result<(), String> {
    let plaintext = serde_json::to_vec(license).map_err(|e| format!("Serialize error: {e}"))?;

    let (fp, _) = fingerprint::generate_fingerprint();
    let key = derive_key(fp.as_bytes());

    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| format!("Cipher init error: {e}"))?;

    // Random nonce
    let nonce_bytes: [u8; NONCE_SIZE] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_ref())
        .map_err(|e| format!("Encryption error: {e}"))?;

    // File format: [12-byte nonce][ciphertext...]
    let mut blob = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    blob.extend_from_slice(&nonce_bytes);
    blob.extend_from_slice(&ciphertext);

    let path = license_file_path(app_data_dir);
    fs::write(&path, &blob).map_err(|e| format!("Write error: {e}"))?;

    Ok(())
}

/// Read and decrypt the license file.
pub fn load_license(app_data_dir: &PathBuf) -> Result<StoredLicense, String> {
    let path = license_file_path(app_data_dir);

    let blob = fs::read(&path).map_err(|e| format!("Read error: {e}"))?;

    if blob.len() < NONCE_SIZE + 1 {
        return Err("License file is too short / corrupt".to_string());
    }

    let (nonce_bytes, ciphertext) = blob.split_at(NONCE_SIZE);
    let nonce = Nonce::from_slice(nonce_bytes);

    let (fp, _) = fingerprint::generate_fingerprint();
    let key = derive_key(fp.as_bytes());

    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| format!("Cipher init error: {e}"))?;

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption failed — license file may be corrupt or from another machine".to_string())?;

    let stored: StoredLicense =
        serde_json::from_slice(&plaintext).map_err(|e| format!("Deserialize error: {e}"))?;

    Ok(stored)
}

/// Check whether a license file exists.
pub fn license_exists(app_data_dir: &PathBuf) -> bool {
    license_file_path(app_data_dir).exists()
}

/// Delete the license file (used during deactivation).
pub fn delete_license(app_data_dir: &PathBuf) -> Result<(), String> {
    let path = license_file_path(app_data_dir);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Delete error: {e}"))?;
    }
    Ok(())
}

// ── key derivation ──────────────────────────────────────
fn derive_key(fingerprint: &[u8]) -> [u8; 32] {
    let hk = Hkdf::<Sha256>::new(Some(fingerprint), EMBEDDED_APP_SECRET);
    let mut okm = [0u8; 32];
    hk.expand(b"license-file-encryption", &mut okm)
        .expect("HKDF expand failed");
    okm
}
