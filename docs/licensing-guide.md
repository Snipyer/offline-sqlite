# Licensing System — Flow & Testing Guide

## Overview

The licensing system protects the Tauri desktop app with Ed25519-signed license keys, hardware fingerprinting, online activation, a 7-day trial, and anti-debugging measures. It has three main pieces:

| Component             | Location                            | Purpose                                                        |
| --------------------- | ----------------------------------- | -------------------------------------------------------------- |
| Rust licensing module | `apps/web/src-tauri/src/licensing/` | Validates keys offline, manages trial, encrypts stored license |
| Licensing server      | `packages/licensing-server/`        | Handles online activation, deactivation, admin                 |
| Frontend UI           | `apps/web/src/features/licensing/`  | Activation screen, trial banner, expired screen                |

---

## How It Works (End-to-End Flow)

```
┌──────────────────────────────────────────────────────────────────┐
│                       APP STARTUP                                │
│                                                                  │
│  1. Tauri launches → anti-debug check (production only)          │
│  2. Read encrypted license.dat from disk                         │
│  3. Determine LicenseState:                                      │
│       Valid   → start sidecar, show app                          │
│       Trial   → start sidecar, show app + trial banner           │
│       Expired / TrialExpired → show expired screen               │
│       None / Invalid → show activation screen                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     ACTIVATION FLOW                              │
│                                                                  │
│  1. User enters LKEY-... in the activation screen                │
│  2. Rust verifies Ed25519 signature locally (catches typos fast) │
│  3. Rust generates hardware fingerprint (CPU, OS ID, hostname,   │
│     disk serial, MAC → SHA-256 combined hash)                    │
│  4. POST to licensing server /api/activate with:                 │
│       { license_key, fingerprint, fingerprint_signals,           │
│         app_version, os }                                        │
│  5. Server checks: key valid? license not revoked? not expired?  │
│     not activated on another machine?                            │
│  6. Server creates activation record, signs an activation token  │
│  7. Rust verifies the activation token, encrypts and saves to    │
│     license.dat using AES-256-GCM (key = HKDF(fingerprint))     │
│  8. App restarts into valid state                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       TRIAL FLOW                                 │
│                                                                  │
│  1. User clicks "Start 7-Day Free Trial"                         │
│  2. Rust creates a TrialToken with start/end/last_seen dates     │
│  3. Token is encrypted and saved to license.dat                  │
│  4. Each startup: check trial_end, detect clock rollback         │
│     (last_seen > now → expired immediately)                      │
│  5. After 7 days → TrialExpired state → must activate            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Make sure you have:

- **Bun** installed
- **Rust / Cargo** installed (for the Tauri side)
- The monorepo dependencies installed (`bun install` at the root)

---

## Step-by-Step Testing

### 1. Generate the Ed25519 Keypair

This creates the private key (for signing) and public key (embedded in the Tauri binary).

```bash
bun run scripts/generate-keypair.ts
```

Output:

```
✓ Ed25519 keypair generated
  Private key: keys/license_priv.key  (32 bytes) — DO NOT COMMIT
  Public  key: apps/web/src-tauri/keys/license_pub.key  (32 bytes)
```

> **NOTE:** If you already ran this before, running it again will **overwrite** the keys.  
> Any previously generated license keys will become invalid.

---

### 2. Generate a License Key

Create a signed license key for testing:

```bash
# Perpetual license
bun run scripts/generate-license.ts --email dr@clinic.com --plan perpetual

# Subscription license (expires on a specific date)
bun run scripts/generate-license.ts --email dr@clinic.com --plan subscription --expires 2027-02-25

# With optional params
bun run scripts/generate-license.ts \
  --email dr@clinic.com \
  --plan perpetual \
  --seats 2 \
  --max-transfers 5 \
  --features module-a,module-b
```

Output:

```
✓ License key generated

Payload:
{
  "id": "lic_a1b2c3d4",
  "email": "dr@clinic.com",
  "plan": "perpetual",
  "seats": 1,
  "created_at": "2026-02-25T12:00:00.000Z",
  "expires_at": null,
  "features": ["all"],
  "max_transfers": 3
}

License Key:
LKEY-eyJpZCI6Im....<long string>
```

**Save this `LKEY-...` string — you'll paste it into the activation screen.**

---

### 3. Start the Licensing Server

The licensing server is a standalone Hono API that handles activation requests.

```bash
cd packages/licensing-server
bun run dev
```

This starts the server on **http://localhost:4000**. Verify it's running:

```bash
curl http://localhost:4000
# → License Server OK
```

The server uses a local SQLite file (`license.db`) created automatically in the working directory.

---

### 4. Seed the License into the Server DB

The licensing server checks that a license exists in its database before activating. You need to insert the license record. Use the admin API:

```bash
# Replace the values with your generated license key's payload
curl -X POST http://localhost:4000/api/admin/licenses \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lic_a1b2c3d4",
    "email": "dr@clinic.com",
    "plan": "perpetual",
    "key_payload": "LKEY-eyJpZCI6Im....",
    "created_at": "2026-02-25T12:00:00.000Z",
    "expires_at": null,
    "max_transfers": 3
  }'
```

> **Alternative:** Directly insert into `license.db` using any SQLite tool:
>
> ```sql
> INSERT INTO licenses (id, email, plan, key_payload, created_at, max_transfers)
> VALUES ('lic_a1b2c3d4', 'dr@clinic.com', 'perpetual',
>         'LKEY-eyJpZCI6Im....', '2026-02-25T12:00:00.000Z', 3);
> ```

Verify the license is in the DB:

```bash
curl http://localhost:4000/api/admin/licenses
```

---

### 5. Configure the Tauri App Licensing API URL (Dev vs Production)

The Rust activation module reads `LICENSE_SERVER_URL` (runtime first, then compile-time).

- Development: set `apps/web/.env`:

```dotenv
LICENSE_SERVER_URL=http://localhost:4000
```

- Production build: set `apps/web/.env.production` to your deployed public worker URL, for example:

```dotenv
LICENSE_SERVER_URL=https://offline-sqlite-licensing-public-production.<your-subdomain>.workers.dev
```

`src-tauri/build.rs` loads `.env` for all builds and additionally loads `.env.production` for release builds.

Then build/run the Tauri app:

```bash
bun run desktop:dev
```

---

### 6. Test the Activation Flow

1. The app starts and shows the **Activation Screen** (since no `license.dat` exists yet).
2. Paste your `LKEY-...` key into the input field.
3. Click **Activate**.
4. The app contacts `http://localhost:4000/api/activate`, the server validates and returns a signed activation token.
5. The Rust module saves the encrypted `license.dat`.
6. The app transitions to the main dashboard.

---

### 7. Test the Trial Flow

1. Start the app fresh (delete `license.dat` if it exists — see [Resetting State](#resetting-state)).
2. On the Activation Screen, click **Start 7-Day Free Trial**.
3. The app shows the main dashboard with a **trial banner** at the top.
4. The banner shows "Trial: X days remaining".

---

### 8. Test Deactivation

Deactivation removes the local `license.dat` and notifies the server:

- This is triggered via the `deactivate_license` Tauri command.
- After deactivation, the app returns to the Activation Screen.
- On the server side, the activation record is marked `is_active = false`.

---

## API Reference (Licensing Server)

### Public Endpoints

| Method | Path              | Body                                                                    | Description                             |
| ------ | ----------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| `POST` | `/api/activate`   | `{ license_key, fingerprint, fingerprint_signals?, app_version?, os? }` | Activate a license on a machine         |
| `POST` | `/api/deactivate` | `{ license_id, fingerprint }`                                           | Deactivate a license from a machine     |
| `POST` | `/api/validate`   | `{ license_id, fingerprint }`                                           | Refresh/validate an existing activation |

### Admin Endpoints

| Method | Path                             | Description                                 |
| ------ | -------------------------------- | ------------------------------------------- |
| `GET`  | `/api/admin/licenses`            | List all licenses                           |
| `GET`  | `/api/admin/licenses/:id`        | Get license details + activations           |
| `POST` | `/api/admin/licenses/:id/revoke` | Revoke a license (deactivates all machines) |
| `POST` | `/api/admin/licenses/:id/reset`  | Reset all activations (support use-case)    |

### Example: Test Activation with curl

```bash
curl -X POST http://localhost:4000/api/activate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "LKEY-eyJpZCI6Im....",
    "fingerprint": "abc123fakefingerprint",
    "fingerprint_signals": ["sig1", "sig2"],
    "app_version": "0.1.0",
    "os": "linux"
  }'
```

Expected response:

```json
{
	"activation_token": "<base64url(payload)>.<base64url(sig)>",
	"license": {
		"plan": "perpetual",
		"features": ["all"],
		"expires_at": null
	},
	"activated_at": "2026-02-25T12:00:00.000Z"
}
```

### Example: Test Deactivation with curl

```bash
curl -X POST http://localhost:4000/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "license_id": "lic_a1b2c3d4",
    "fingerprint": "abc123fakefingerprint"
  }'
```

### Example: Revoke a License

```bash
curl -X POST http://localhost:4000/api/admin/licenses/lic_a1b2c3d4/revoke
```

---

## Database Schema

The licensing server uses three tables in `license.db`:

### `licenses`

| Column          | Type    | Notes                         |
| --------------- | ------- | ----------------------------- |
| `id`            | TEXT PK | e.g. `lic_a1b2c3d4`           |
| `email`         | TEXT    | Customer email                |
| `plan`          | TEXT    | `perpetual` or `subscription` |
| `key_payload`   | TEXT    | The full `LKEY-...` string    |
| `created_at`    | TEXT    | ISO 8601                      |
| `expires_at`    | TEXT    | null for perpetual            |
| `max_transfers` | INTEGER | Default 3                     |
| `is_revoked`    | INTEGER | 0 or 1                        |

### `activations`

| Column                | Type    | Notes                                  |
| --------------------- | ------- | -------------------------------------- |
| `id`                  | TEXT PK | e.g. `act_abc123`                      |
| `license_id`          | TEXT FK | References `licenses.id`               |
| `fingerprint`         | TEXT    | Machine fingerprint hash               |
| `fingerprint_signals` | TEXT    | JSON array of individual signal hashes |
| `activated_at`        | TEXT    | ISO 8601                               |
| `deactivated_at`      | TEXT    | null if active                         |
| `app_version`         | TEXT    | App version at activation time         |
| `os`                  | TEXT    | Operating system                       |
| `is_active`           | INTEGER | 0 or 1                                 |

### `trial_records`

| Column        | Type    | Notes                     |
| ------------- | ------- | ------------------------- |
| `fingerprint` | TEXT PK | Machine fingerprint       |
| `started_at`  | TEXT    | ISO 8601                  |
| `expires_at`  | TEXT    | ISO 8601 (start + 7 days) |

---

## Resetting State

### Delete local license (start fresh on the client)

The `license.dat` file is stored in the Tauri app data directory:

- **Linux:** `~/.local/share/com.offline-sqlite.app/license.dat`
- **macOS:** `~/Library/Application Support/com.offline-sqlite.app/license.dat`
- **Windows:** `%APPDATA%\com.offline-sqlite.app\license.dat`

```bash
# Linux example
rm -f ~/.local/share/com.offline-sqlite.app/license.dat
```

### Reset the licensing server DB

```bash
rm packages/licensing-server/license.db
```

The tables are auto-created on the next server start.

### Regenerate keys (invalidates ALL existing license keys)

```bash
bun run scripts/generate-keypair.ts
```

---

## File Map

```
scripts/
├── generate-keypair.ts          # One-time keypair generation
└── generate-license.ts          # CLI to create signed license keys

keys/
└── license_priv.key             # Private key (git-ignored, NEVER commit)

apps/web/src-tauri/
├── keys/
│   └── license_pub.key          # Public key (embedded in Tauri binary)
└── src/licensing/
    ├── mod.rs                   # Module declarations
    ├── types.rs                 # LicenseState, StoredLicense, etc.
    ├── validation.rs            # Ed25519 signature verification
    ├── fingerprint.rs           # Hardware fingerprinting
    ├── storage.rs               # AES-256-GCM encrypted license.dat
    ├── trial.rs                 # 7-day trial logic
    ├── activation.rs            # Online activation/deactivation
    └── anti_debug.rs            # Debugger detection

apps/web/src/features/licensing/
├── types.ts                     # Frontend TypeScript types
├── hooks/
│   └── use-license.ts           # React hook wrapping Tauri commands
└── components/
    ├── activation-screen.tsx    # Full activation UI
    ├── trial-banner.tsx         # "X days remaining" banner
    └── trial-expired.tsx        # Expired trial UI

packages/licensing-server/
├── src/
│   ├── index.ts                 # Hono server entry (port 4000)
│   ├── db/
│   │   ├── schema.ts            # Drizzle table definitions
│   │   └── index.ts             # bun:sqlite init + auto-create
│   ├── crypto/
│   │   └── sign.ts              # Ed25519 sign/verify helpers
│   └── routes/
│       ├── activate.ts          # POST /api/activate
│       ├── deactivate.ts        # POST /api/deactivate
│       ├── validate.ts          # POST /api/validate
│       └── admin.ts             # Admin CRUD
└── license.db                   # SQLite DB (auto-created, git-ignored)
```

---

## Security Notes

- The **private key** (`keys/license_priv.key`) must NEVER be committed to git. It's in `.gitignore`.
- The **public key** is embedded in the Tauri binary at compile time via `include_bytes!()`.
- The `license.dat` file is encrypted with AES-256-GCM. The encryption key is derived from the machine's hardware fingerprint via HKDF, so it can't be copied to another machine.
- The sidecar server is protected by a launch token — it will refuse to start if not launched by the Tauri shell.
- In production builds, Vite strips `console.*` calls, disables sourcemaps, and applies terser mangling.
- Anti-debug checks run on both the Rust side (detecting attached debuggers) and JS side (detecting DevTools).
