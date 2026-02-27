# App Protection & Licensing Plan

## Overview

This document describes the complete strategy to protect the **offline-sqlite** Tauri desktop app from unauthorized copying, redistribution, and code extraction. The system is **self-built** (no third-party licensing service), supports **offline-first dental clinic** users, and covers Windows, macOS, and Linux.

### Key Decisions

| Decision            | Choice                                                   |
| ------------------- | -------------------------------------------------------- |
| Target OS           | Windows + macOS + Linux                                  |
| Distribution        | Website download + manual delivery + resellers           |
| Connectivity        | Mostly offline — online activation, then offline forever |
| Licensing Model     | Hybrid (perpetual + subscription options)                |
| Activation          | License key + one-time online activation                 |
| Hardware Binding    | Yes — one license = one machine                          |
| Trial               | 7-day time-limited trial                                 |
| Offline Grace       | Unlimited for perpetual; periodic for subscriptions      |
| Code Protection     | JS obfuscation + anti-debugging                          |
| Updates             | Manual re-download                                       |
| Third-Party Service | None — fully self-built                                  |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Tauri Shell (Rust)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  License     │  │  HW Finger-  │  │  Anti-Tamper   │  │
│  │  Validator   │  │  print Gen   │  │  Checks        │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│         └────────────────┼───────────────────┘           │
│                          ▼                               │
│              ┌───────────────────────┐                   │
│              │  License Store        │                   │
│              │  (encrypted file in   │                   │
│              │   app_data_dir)       │                   │
│              └───────────────────────┘                   │
│                          │                               │
│         ┌────────────────┼────────────────┐              │
│         ▼                ▼                ▼              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │  WebView   │  │  Sidecar     │  │  License     │     │
│  │  Frontend  │  │  Server      │  │  Activation  │     │
│  │  (React)   │  │  (Bun/Hono)  │  │  Server (API)│     │
│  └────────────┘  └─────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │ (one-time, online)
                           ▼
                ┌───────────────────────┐
                │  Your License Server  │
                │  (cloud VPS / Hono)   │
                │  - validate keys      │
                │  - bind to HW         │
                │  - issue signed token │
                └───────────────────────┘
```

---

## Step 1: License Key Generation

### 1.1 Key Format

Generate cryptographically signed license keys using **Ed25519** asymmetric signatures. The private key stays on your server; the public key is embedded in the Tauri app.

**License key structure** (base64-encoded JSON):

```json
{
	"id": "lic_a1b2c3d4",
	"email": "dr.smith@clinic.com",
	"plan": "perpetual", // "perpetual" | "subscription"
	"seats": 1,
	"created_at": "2026-02-25T00:00:00Z",
	"expires_at": null, // null for perpetual, ISO date for subscriptions
	"features": ["all"], // feature flags for freemium gating
	"max_transfers": 3 // how many times they can re-activate on a new machine
}
```

**Signed key format** (what the user receives):

```
LKEY-<base64url(json_payload)>.<base64url(ed25519_signature)>
```

Example: `LKEY-eyJpZCI6Imxp....<signature>`

### 1.2 Key Generation (Server-Side)

Use `@noble/ed25519` (pure JS, no native deps) or Rust `ed25519-dalek`:

```typescript
// packages/licensing/src/generate-key.ts
import { sign } from "@noble/ed25519";

export async function generateLicenseKey(payload: LicensePayload, privateKey: Uint8Array): Promise<string> {
	const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));
	const signature = await sign(jsonBytes, privateKey);
	const encodedPayload = base64url(jsonBytes);
	const encodedSig = base64url(signature);
	return `LKEY-${encodedPayload}.${encodedSig}`;
}
```

### 1.3 Key Validation (Client-Side, in Rust)

Embed the **Ed25519 public key** in the Rust binary. Validate by:

1. Splitting the key at `.`
2. Decoding the payload and signature from base64url
3. Verifying the signature with the embedded public key
4. Checking `expires_at` for subscriptions

```rust
// In Tauri Rust code
use ed25519_dalek::{PublicKey, Signature, Verifier};

const LICENSE_PUBLIC_KEY: &[u8; 32] = include_bytes!("../keys/license_pub.key");

fn verify_license(key_str: &str) -> Result<LicensePayload, LicenseError> {
    let parts: Vec<&str> = key_str.strip_prefix("LKEY-")
        .ok_or(LicenseError::InvalidFormat)?
        .split('.')
        .collect();

    let payload_bytes = base64url_decode(parts[0])?;
    let signature_bytes = base64url_decode(parts[1])?;

    let public_key = PublicKey::from_bytes(LICENSE_PUBLIC_KEY)?;
    let signature = Signature::from_bytes(&signature_bytes)?;

    public_key.verify(&payload_bytes, &signature)?;

    let payload: LicensePayload = serde_json::from_slice(&payload_bytes)?;
    Ok(payload)
}
```

**Why Ed25519?**

- The private key (used to generate licenses) never leaves your server
- The public key (embedded in the app) can only verify, not forge licenses
- Even if someone extracts the public key, they can't create valid licenses

---

## Step 2: Hardware Fingerprinting

### 2.1 What to Collect

Generate a **machine fingerprint** from stable hardware identifiers. Combine multiple signals so one component changing doesn't invalidate the fingerprint:

| Signal                    | Linux                 | macOS            | Windows                    |
| ------------------------- | --------------------- | ---------------- | -------------------------- |
| CPU model + core count    | `/proc/cpuinfo`       | `sysctl`         | WMI `Win32_Processor`      |
| motherboard serial        | DMI tables            | `ioreg`          | WMI `Win32_BaseBoard`      |
| disk serial (root volume) | `lsblk` / `/dev/disk` | `diskutil`       | WMI `Win32_DiskDrive`      |
| MAC address (primary NIC) | `ip link` / sysfs     | `networksetup`   | WMI `Win32_NetworkAdapter` |
| OS install ID             | `/etc/machine-id`     | `IOPlatformUUID` | `MachineGuid` registry key |

### 2.2 Fingerprint Algorithm

```rust
use sha2::{Sha256, Digest};

fn generate_fingerprint() -> String {
    let mut hasher = Sha256::new();

    // Collect signals — each function returns Option<String>
    let signals = vec![
        get_cpu_id(),
        get_motherboard_serial(),
        get_disk_serial(),
        get_mac_address(),
        get_os_install_id(),
    ];

    // Use at least 3 of 5 signals (fuzzy matching)
    // Hash them individually, then combine
    for signal in &signals {
        if let Some(s) = signal {
            hasher.update(s.as_bytes());
        }
    }

    // Add a salt from the license ID to prevent rainbow tables
    hasher.update(b"offline-sqlite-v1-salt");

    hex::encode(hasher.finalize())
}
```

### 2.3 Fuzzy Matching

Users may replace a NIC or disk. Use a **threshold** approach:

- Collect all 5 signals, hash each one individually
- Store the 5 individual hashes during activation
- On validation, re-collect and compare — if **3 out of 5** match, accept
- This handles single hardware changes gracefully

---

## Step 3: Online Activation Flow

### 3.1 User Experience

```
┌─────────────────────────────────────────┐
│           Welcome to OfflineSQLite      │
│                                         │
│  Enter your license key:                │
│  ┌─────────────────────────────────┐    │
│  │ LKEY-eyJpZCI6Imxp...           │    │
│  └─────────────────────────────────┘    │
│                                         │
│         [ Activate ]   [ Start Trial ]  │
└─────────────────────────────────────────┘
```

### 3.2 Activation Sequence

```
 User's Machine                          Your License Server
 ──────────────                          ───────────────────
 1. User enters license key
 2. Rust validates signature locally
    (rejects invalid keys immediately)
 3. Generates hardware fingerprint
 4. ─── POST /api/activate ──────────►
    {
      license_key: "LKEY-...",
      fingerprint: "sha256...",
      fingerprint_signals: ["hash1","hash2",...],
      app_version: "1.0.0",
      os: "windows"
    }
                                         5. Verify the key signature
                                         6. Check key not already activated
                                            on a different fingerprint
                                         7. Store fingerprint in DB
                                         8. Generate activation token
                                            (signed JWT or similar)
    ◄─── 200 OK ─────────────────────
    {
      activation_token: "signed...",
      license: { plan, features, expires_at },
      activated_at: "2026-02-25T..."
    }
 9. Store activation token in
    encrypted local file
10. App unlocks fully
```

### 3.3 Activation Token

The activation token is a **signed blob** (Ed25519 signature) containing:

```json
{
	"license_id": "lic_a1b2c3d4",
	"fingerprint": "sha256...",
	"plan": "perpetual",
	"features": ["all"],
	"activated_at": "2026-02-25T00:00:00Z",
	"expires_at": null
}
```

Stored locally at: `{app_data_dir}/license.dat` (encrypted with a key derived from the machine fingerprint + an embedded secret).

### 3.4 License Server Endpoints

Build a small Hono API (can reuse your existing server infrastructure):

| Endpoint                | Method | Purpose                                   |
| ----------------------- | ------ | ----------------------------------------- |
| `POST /api/activate`    | POST   | Activate a license on a machine           |
| `POST /api/deactivate`  | POST   | Release a machine binding (for transfers) |
| `POST /api/validate`    | POST   | Optional: re-validate subscription status |
| `GET  /api/license/:id` | GET    | Admin: check license status               |

### 3.5 Deactivation for Machine Transfers

When a user wants to move to a new machine:

1. On old machine: App calls `POST /api/deactivate` with license key + fingerprint
2. Server removes the fingerprint binding, increments `transfer_count`
3. If `transfer_count < max_transfers`, allow re-activation
4. On new machine: User activates normally

If the old machine is lost/broken, provide an admin tool or support email to manually reset.

---

## Step 4: Offline License Validation (On Every Launch)

### 4.1 Validation Steps (All in Rust, no network needed)

On every app launch, before starting the sidecar server or showing the WebView:

```
1. Read {app_data_dir}/license.dat
2. Decrypt using machine-derived key
3. Verify Ed25519 signature of the activation token
4. Check the embedded fingerprint matches current machine (3/5 fuzzy)
5. For subscriptions: check expires_at > now
   - If expired: show "subscription expired" screen
   - If perpetual: always valid
6. If all checks pass → start sidecar + load WebView
7. If any check fails → show activation screen
```

### 4.2 Local Storage Security

Encrypt `license.dat` with AES-256-GCM:

```rust
// Key derivation
let encryption_key = derive_key(
    machine_fingerprint.as_bytes(),    // hardware-bound
    EMBEDDED_APP_SECRET.as_bytes(),    // compiled into binary
    b"license-file-encryption"         // context
);
```

This means:

- Copying `license.dat` to another machine won't work (different fingerprint → different key → decryption fails)
- Editing the file won't work (AES-GCM detects tampering)
- The embedded secret prevents brute-force if the fingerprint is known

---

## Step 5: Trial System

### 5.1 Trial Flow

```
First Launch (no license.dat found)
         │
         ▼
  ┌──────────────────┐
  │  Enter License   │
  │  ──── or ────    │
  │  Start 7-day    │
  │  Free Trial      │
  └──────┬───────────┘
         │ (clicks "Start Trial")
         ▼
  1. Generate fingerprint
  2. Create trial token (signed, in Rust):
     {
       "type": "trial",
       "fingerprint": "sha256...",
       "trial_start": "2026-02-25T00:00:00Z",
       "trial_end": "2026-03-11T00:00:00Z"
     }
  3. Encrypt and save to license.dat
  4. App runs in trial mode
```

### 5.2 Trial Tamper Protection

- **Clock rollback detection**: On each launch, store `last_seen_timestamp` in the encrypted license file. If `now < last_seen_timestamp`, the user rolled back their clock → show warning or invalidate trial
- **Reinstall protection**: The fingerprint is hardware-based, so uninstalling and reinstalling on the same machine yields the same fingerprint → trial doesn't reset. You can optionally also store a trial marker in a location that survives uninstall (e.g., a registry key on Windows, or a hidden file in the user's home directory)
- **Trial tokens have no network requirement** — they work fully offline

### 5.3 Trial Expiration UX

```
┌──────────────────────────────────────────┐
│        Your trial has expired            │
│                                          │
│  You've used 7 of 7 trial days.        │
│                                          │
│  Enter a license key to continue:        │
│  ┌────────────────────────────────┐      │
│  │                                │      │
│  └────────────────────────────────┘      │
│                                          │
│  [ Activate ]     [ Purchase License ]   │
│                    (opens website)        │
└──────────────────────────────────────────┘
```

---

## Step 6: Anti-Debugging & DevTools Protection

### 6.1 Disable DevTools in Production

In the Tauri Rust code, only enable devtools in debug builds:

```rust
// lib.rs — in the builder setup
let builder = tauri::Builder::default();

#[cfg(not(debug_assertions))]
let builder = builder; // devtools disabled by default in production

#[cfg(debug_assertions)]
let builder = builder.plugin(tauri_plugin_devtools::init());
```

Also, in the Tauri config, ensure `devtools` is disabled for production:

```json
// tauri.conf.json
{
	"app": {
		"security": {
			"dangerousDisableAssetCspModification": false
		}
	}
}
```

### 6.2 JavaScript Anti-Debugging

Add a lightweight anti-debug layer in the frontend (hardened at build time):

```typescript
// anti-debug.ts — imported early in root.tsx (production only)
(function () {
	// Detect DevTools via debugger statement timing
	const threshold = 100;

	setInterval(() => {
		const start = performance.now();
		debugger; // This pauses if DevTools is open
		const duration = performance.now() - start;

		if (duration > threshold) {
			// DevTools detected — blank the page
			document.body.innerHTML = "";
			window.location.href = "about:blank";
		}
	}, 3000);

	// Disable right-click context menu
	document.addEventListener("contextmenu", (e) => e.preventDefault());

	// Disable common keyboard shortcuts for DevTools
	document.addEventListener("keydown", (e) => {
		if (
			e.key === "F12" ||
			(e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
			(e.ctrlKey && e.key === "U")
		) {
			e.preventDefault();
		}
	});
})();
```

> **Note**: This is a deterrent, not bulletproof. Determined attackers can bypass it. But it blocks casual inspection.

### 6.3 Rust-Side Anti-Debugging

Detect if a debugger is attached to the Tauri process:

```rust
#[cfg(target_os = "windows")]
fn is_debugger_present() -> bool {
    extern "system" {
        fn IsDebuggerPresent() -> i32;
    }
    unsafe { IsDebuggerPresent() != 0 }
}

#[cfg(target_os = "linux")]
fn is_debugger_present() -> bool {
    use std::fs;
    if let Ok(status) = fs::read_to_string("/proc/self/status") {
        for line in status.lines() {
            if line.starts_with("TracerPid:") {
                let pid: i32 = line.split(':').nth(1)
                    .unwrap_or("0").trim().parse().unwrap_or(0);
                return pid != 0;
            }
        }
    }
    false
}

#[cfg(target_os = "macos")]
fn is_debugger_present() -> bool {
    // Use sysctl CTL_KERN / KERN_PROC / KERN_PROC_PID
    // Check P_TRACED flag
    use std::process::Command;
    let output = Command::new("sysctl")
        .args(["kern.proc.pid", &std::process::id().to_string()])
        .output();
    // Simplified — implement proper sysctl check
    false
}
```

On detection: log the event, optionally delay app startup (don't crash immediately — that makes it easy to find the check).

---

## Step 7: JavaScript Obfuscation

### 7.1 Build-Time Obfuscation

Use **Vite's built-in minification** (esbuild/terser) plus additional obfuscation:

**Option A: Terser (already in Vite)**

```typescript
// vite.config.ts
export default defineConfig({
	build: {
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true, // remove console.log
				drop_debugger: true, // remove debugger statements
				passes: 2,
			},
			mangle: {
				toplevel: true,
				properties: {
					regex: /^_/, // mangle private properties starting with _
				},
			},
			format: {
				comments: false,
			},
		},
	},
});
```

**Option B: javascript-obfuscator (stronger, via Vite plugin)**

```bash
bun add -D vite-plugin-javascript-obfuscator javascript-obfuscator
```

```typescript
// vite.config.ts
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";

export default defineConfig({
	plugins: [
		// ... other plugins
		obfuscatorPlugin({
			options: {
				compact: true,
				controlFlowFlattening: true,
				controlFlowFlatteningThreshold: 0.5,
				deadCodeInjection: true,
				deadCodeInjectionThreshold: 0.2,
				stringArray: true,
				stringArrayEncoding: ["base64"],
				stringArrayThreshold: 0.75,
				transformObjectKeys: true,
				unicodeEscapeSequence: false,
			},
			apply: "build", // Only obfuscate production builds
		}),
	],
});
```

> **Trade-off**: `javascript-obfuscator` increases bundle size ~2-3x and slightly slows execution. Terser alone is lighter but less protective. **Recommendation**: Use Terser for most builds; use javascript-obfuscator for release builds only.

### 7.2 Source Map Protection

**Never ship source maps in production.**

```typescript
// vite.config.ts
export default defineConfig({
	build: {
		sourcemap: false, // CRITICAL: never ship source maps
	},
});
```

---

## Step 8: Sidecar Server Protection

### 8.1 The Problem

The Bun sidecar binary (the Hono server) is bundled as `binaries/server` in the Tauri app. It's a standalone executable but can be extracted and run independently.

### 8.2 Mitigation Strategies

**A. Environment Variable Gating**

The sidecar should require a secret environment variable that only the Tauri Rust shell provides:

```typescript
// apps/server/src/index.ts
const LAUNCH_TOKEN = process.env.__TAURI_LAUNCH_TOKEN__;
const EXPECTED_HASH = process.env.__TAURI_LAUNCH_HASH__;

if (!LAUNCH_TOKEN || !verifyLaunchToken(LAUNCH_TOKEN, EXPECTED_HASH)) {
	console.error("This server can only run inside the desktop application.");
	process.exit(1);
}
```

On the Rust side:

```rust
// Generate a one-time token per launch
let launch_token = generate_random_token(); // random 64-byte hex
let launch_hash = sha256(format!("{}{}", launch_token, EMBEDDED_SECRET));

sidecar = sidecar
    .env("__TAURI_LAUNCH_TOKEN__", &launch_token)
    .env("__TAURI_LAUNCH_HASH__", &launch_hash);
```

**B. Binary Signing Verification**

On Windows and macOS, code-sign the sidecar binary. The Rust shell can verify the signature before launching it.

**C. Localhost-Only Binding**

The server already binds to `127.0.0.1:3000` — ensure this is hardcoded and cannot be overridden via environment variables.

---

## Step 9: License Server Implementation

### 9.1 Tech Stack

Deploy a small license server (can be a separate Hono app or a route on your existing server):

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL or SQLite (for license records)
- **Hosting**: Any VPS (Hetzner, DigitalOcean, Fly.io)
- **Domain**: `license.yourapp.com`

### 9.2 Database Schema

```sql
CREATE TABLE licenses (
  id TEXT PRIMARY KEY,              -- "lic_a1b2c3d4"
  email TEXT NOT NULL,
  plan TEXT NOT NULL,                -- "perpetual" | "subscription"
  key_payload TEXT NOT NULL,         -- the signed license key
  created_at DATETIME NOT NULL,
  expires_at DATETIME,               -- null for perpetual
  max_transfers INTEGER DEFAULT 3,
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE activations (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL REFERENCES licenses(id),
  fingerprint TEXT NOT NULL,
  fingerprint_signals TEXT,          -- JSON array of individual hashes
  activated_at DATETIME NOT NULL,
  deactivated_at DATETIME,
  app_version TEXT,
  os TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE trial_records (
  fingerprint TEXT PRIMARY KEY,
  started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL
);
```

### 9.3 Admin Dashboard (Optional)

A simple admin page to:

- Generate license keys
- View activations per license
- Revoke licenses
- Manually reset machine bindings (for support)
- View trial usage

---

## Step 10: Integration into Tauri App

### 10.1 New Rust Dependencies

Add to `apps/web/src-tauri/Cargo.toml`:

```toml
[dependencies]
# Cryptography
ed25519-dalek = { version = "2", features = ["std"] }
aes-gcm = "0.10"
sha2 = "0.10"
hkdf = "0.12"
rand = "0.8"
base64 = "0.22"
hex = "0.4"

# Hardware fingerprinting
sysinfo = "0.31"       # cross-platform system info

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Time
chrono = { version = "0.4", features = ["serde"] }
```

### 10.2 New Tauri Commands

Expose these commands to the WebView frontend:

```rust
#[tauri::command]
async fn activate_license(key: String) -> Result<ActivationResult, String> { ... }

#[tauri::command]
async fn deactivate_license() -> Result<(), String> { ... }

#[tauri::command]
fn get_license_status() -> Result<LicenseStatus, String> { ... }

#[tauri::command]
fn start_trial() -> Result<TrialInfo, String> { ... }

#[tauri::command]
fn get_trial_status() -> Result<TrialInfo, String> { ... }
```

### 10.3 App Startup Flow (Modified `lib.rs`)

```rust
pub fn run() {
    tauri::Builder::default()
        // ... existing plugins ...
        .invoke_handler(tauri::generate_handler![
            check_server_health,
            activate_license,
            deactivate_license,
            get_license_status,
            start_trial,
            get_trial_status,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            // ── LICENSE CHECK (before starting server) ──
            let license_status = check_license_on_startup(&app_handle);

            match license_status {
                LicenseState::Valid { .. } => {
                    // Start sidecar server normally
                    tauri::async_runtime::spawn(async move {
                        start_server(app_handle).await.ok();
                    });
                }
                LicenseState::Trial { days_remaining } => {
                    // Start sidecar in trial mode
                    tauri::async_runtime::spawn(async move {
                        start_server(app_handle).await.ok();
                    });
                    // Frontend will show trial banner
                }
                LicenseState::Expired | LicenseState::Invalid | LicenseState::None => {
                    // Don't start the server
                    // WebView will show activation/purchase screen
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 10.4 Frontend License Screen

Create a new React route/component for the license/activation screen:

```
apps/web/src/
  features/
    licensing/
      components/
        activation-screen.tsx    # License key input + activate button
        trial-banner.tsx         # "X days remaining" banner
        trial-expired.tsx        # Expired trial → enter key
      hooks/
        use-license.ts           # Tauri invoke wrappers
      types.ts                   # LicenseStatus, TrialInfo types
```

The activation screen should be shown **before** the main app loads when no valid license exists.

---

## Step 11: Subscription Handling (For Subscription Plans)

For subscription licenses, since users are **mostly offline**:

### 11.1 Strategy: Long Expiry + Opportunistic Validation

- Subscription license keys have `expires_at` set to the end of the billing period
- The activation token includes this expiry date
- On each launch, Rust checks `expires_at > now` locally (offline)
- When the user renews online, they get an updated license key with a new `expires_at`
- **Optional**: If the app detects internet, it can silently call `POST /api/validate` to update the local token with the latest expiry

### 11.2 Renewal UX for Offline Users

When a subscription expires:

```
┌──────────────────────────────────────────┐
│    Your subscription has expired         │
│                                          │
│    Last valid: March 25, 2026            │
│                                          │
│    To renew:                             │
│    1. Visit yourapp.com/renew            │
│    2. Enter your new license key below   │
│                                          │
│    ┌────────────────────────────────┐    │
│    │                                │    │
│    └────────────────────────────────┘    │
│                                          │
│    [ Activate New Key ]                  │
└──────────────────────────────────────────┘
```

---

## Step 12: Build & Release Checklist

### 12.1 Pre-Release Security Checklist

- [ ] **Source maps disabled** in `vite.config.ts` (`sourcemap: false`)
- [ ] **Console logs stripped** via Terser (`drop_console: true`)
- [ ] **DevTools disabled** in production Tauri build
- [ ] **Anti-debug JS** included in production bundle
- [ ] **Ed25519 public key** embedded in Rust binary (not in JS!)
- [ ] **License validation** runs in Rust before WebView loads
- [ ] **Sidecar launch token** generated per-session
- [ ] **App is code-signed** (Windows: Authenticode, macOS: Apple Developer ID)
- [ ] **Tauri updater private key** is not in the repository

### 12.2 Code Signing

Code signing is critical for:

- Preventing tampering after distribution
- Avoiding OS warnings ("unidentified developer")
- Building trust with dental professionals

| Platform | Certificate Source             | Cost         |
| -------- | ------------------------------ | ------------ |
| Windows  | DigiCert, Sectigo, SSL.com     | ~$200-400/yr |
| macOS    | Apple Developer ID             | $99/yr       |
| Linux    | GPG-signed packages (optional) | Free         |

### 12.3 Release Build Command

```bash
# 1. Build the obfuscated frontend
cd apps/web && bun run build

# 2. Build the sidecar server binary
cd apps/server && bun run build

# 3. Build the Tauri app (includes code signing)
cd apps/web && bun run desktop:build
```

---

## Step 13: What This Does NOT Protect Against

Be honest about the limits:

| Attack Vector                       | Protected?  | Notes                                            |
| ----------------------------------- | ----------- | ------------------------------------------------ |
| Casual copying (drag & drop)        | **Yes**     | HW fingerprint binding prevents this             |
| License key sharing                 | **Yes**     | One key = one machine activation                 |
| DevTools inspection                 | **Mostly**  | Disabled + anti-debug, but bypassable            |
| JS source extraction from WebView   | **Partial** | Obfuscated but still JavaScript                  |
| Sidecar binary reverse engineering  | **Partial** | Bun-compiled binary is harder but not impossible |
| Rust binary reverse engineering     | **Hard**    | Compiled Rust is difficult to reverse engineer   |
| Memory dumping / runtime inspection | **No**      | Requires kernel-level protection (out of scope)  |
| Professional cracking groups        | **No**      | No software-only DRM stops determined crackers   |
| Clock manipulation (trial bypass)   | **Mostly**  | Clock rollback detection catches simple attempts |
| VM cloning with same fingerprint    | **Partial** | VMs can have identical HW IDs — add VM detection |

**The goal is not to be uncrackable** — it's to make piracy harder than purchasing for your target audience (dental professionals who value their time).

---

## Step 14: Implementation Order

### Phase 1: Core Licensing (Week 1-2)

1. Generate Ed25519 keypair (store private key securely)
2. Implement license key generation script
3. Implement Rust-side license validation (`ed25519-dalek`)
4. Implement hardware fingerprinting in Rust (`sysinfo`)
5. Implement encrypted local license storage (AES-256-GCM)
6. Build the license activation screen (React)
7. Modify `lib.rs` startup to gate on license check

### Phase 2: License Server (Week 2-3)

8. Build the license server (Hono API)
9. Implement `POST /api/activate` endpoint
10. Implement `POST /api/deactivate` endpoint
11. Build admin dashboard for key generation
12. Deploy license server

### Phase 3: Trial System (Week 3)

13. Implement trial token generation in Rust
14. Implement clock rollback detection
15. Build trial UI components
16. Add reinstall detection (persistent marker)

### Phase 4: Code Protection (Week 3-4)

17. Configure Terser/obfuscator in Vite
18. Add anti-debug JavaScript
19. Add Rust-side debugger detection
20. Implement sidecar launch token system
21. Disable source maps and DevTools

### Phase 5: Hardening & Testing (Week 4)

22. Code-sign the application (Windows + macOS)
23. Test on all three platforms
24. Test edge cases: clock rollback, VM cloning, file copying
25. Test trial → purchase → activation flow
26. Test machine transfer / deactivation flow

---

## File Structure (New Code)

```
apps/web/src-tauri/
  keys/
    license_pub.key              # Ed25519 public key (committed)
  src/
    lib.rs                       # Modified: license check on startup
    licensing/
      mod.rs                     # Module declaration
      activation.rs              # Online activation logic
      fingerprint.rs             # Hardware fingerprinting
      storage.rs                 # Encrypted license.dat read/write
      trial.rs                   # Trial token logic
      types.rs                   # LicensePayload, LicenseState, etc.
      validation.rs              # Ed25519 signature verification
      anti_debug.rs              # Debugger detection

apps/web/src/
  features/
    licensing/
      components/
        activation-screen.tsx
        trial-banner.tsx
        trial-expired.tsx
      hooks/
        use-license.ts
      types.ts

packages/licensing-server/       # New package (or separate repo)
  src/
    index.ts                     # Hono server
    routes/
      activate.ts
      deactivate.ts
      validate.ts
      admin.ts
    db/
      schema.ts                  # License database schema
    crypto/
      keygen.ts                  # Ed25519 key generation
      sign.ts                    # License signing

scripts/
  generate-keypair.ts            # One-time: generate Ed25519 keypair
  generate-license.ts            # CLI tool to create license keys
```

---

## Quick Reference: Threat Model Summary

```
Threat: User copies app folder to another PC
Defence: HW fingerprint mismatch → license.dat decryption fails → activation required

Threat: User shares license key with a friend
Defence: Key already activated on a different fingerprint → server rejects

Threat: User opens DevTools to inspect/modify frontend
Defence: DevTools disabled + anti-debug timing check + obfuscated source

Threat: User extracts sidecar and runs it standalone
Defence: Launch token verification fails → server exits

Threat: User edits license.dat to extend trial/subscription
Defence: AES-GCM authenticated encryption → tamper = decryption failure
         + Ed25519 signature on the payload → can't forge without private key

Threat: User rolls back system clock to extend trial
Defence: last_seen_timestamp check detects backward time jumps

Threat: User reinstalls to reset trial
Defence: Same HW fingerprint → same trial record (optionally + persistent marker)
```
