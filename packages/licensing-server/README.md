# Licensing APIs (Cloudflare Workers)

This package deploys two Workers:

- Public Licensing API (`src/index.ts`): activate / validate / deactivate (public).
- Admin API (`src/admin-worker.ts`): license management (internal-only in production).

## Production architecture

- The admin Worker is deployed with `workers_dev = false` and no public route.
- `apps/licensing-admin-web` calls it through a Cloudflare Service Binding (`LICENSING_ADMIN_API`).
- Pages Function proxy forwards only `x-admin-user-email` (from Access identity) to admin Worker.
- Admin Worker enforces `ADMIN_ALLOWED_EMAIL` and rejects non-matching identities.

## Setup

1. Create D1 DB:

```bash
bunx wrangler d1 create offline-sqlite-licensing
```

2. Put returned `database_id` in:

- [wrangler.public.toml](./wrangler.public.toml)
- [wrangler.admin.toml](./wrangler.admin.toml)

3. Set Worker secrets:

```bash
# required by public API
bunx wrangler secret put LICENSE_PRIVATE_KEY_B64 --config wrangler.public.toml
bunx wrangler secret put LICENSE_PUBLIC_KEY_B64 --config wrangler.public.toml

# required by admin API
bunx wrangler secret put LICENSE_PUBLIC_KEY_B64 --config wrangler.admin.toml

# optional local-dev fallback for admin API
bunx wrangler secret put ADMIN_DEV_API_KEY --config wrangler.admin.toml
```

4. Run locally:

```bash
bun run --filter @offline-sqlite/licensing-server dev:public
bun run --filter @offline-sqlite/licensing-server dev:admin
```

5. Deploy:

```bash
bun run --filter @offline-sqlite/licensing-server deploy:public
bun run --filter @offline-sqlite/licensing-server deploy:admin
```

## Local admin auth

For local `wrangler dev`, use `.dev.vars`:

```bash
cd packages/licensing-server
cp .dev.vars.example .dev.vars
```

Then call admin endpoints with `x-admin-api-key`:

```bash
curl -H "x-admin-api-key: <your-key>" http://127.0.0.1:8788/api/admin/licenses
```

## Key generation notes

- `LICENSE_PRIVATE_KEY_B64` must be a base64-encoded 32-byte Ed25519 private key.
- `LICENSE_PUBLIC_KEY_B64` must be the matching base64-encoded 32-byte public key.
- Convert existing key file to base64:

```bash
base64 -w 0 keys/license_priv.key
```
