# Licensing APIs (Cloudflare Workers)

This package now exposes two workers:

- Public Licensing API (`src/index.ts`): activate / validate / deactivate
- Admin API (`src/admin-worker.ts`): license management endpoints (Cloudflare Access protected)

## Setup

1. Create D1 DB:

```bash
bunx wrangler d1 create offline-sqlite-licensing
```

2. Put returned `database_id` in both:

- [wrangler.public.toml](./wrangler.public.toml)
- [wrangler.admin.toml](./wrangler.admin.toml)

3. Set worker secrets:

```bash
# required by public API
bunx wrangler secret put LICENSE_PRIVATE_KEY_B64 --config wrangler.public.toml

# optional local-dev bypass for admin API when Cloudflare Access is not present
bunx wrangler secret put ADMIN_DEV_API_KEY --config wrangler.admin.toml
```

4. Run locally:

```bash
bun run --filter @offline-sqlite/licensing-server dev:public
bun run --filter @offline-sqlite/licensing-server dev:admin
```

### Local admin auth (`x-admin-api-key`)

For local `wrangler dev`, you can set `ADMIN_DEV_API_KEY` via a `.dev.vars` file:

```bash
cd packages/licensing-server
cp .dev.vars.example .dev.vars
```

For the public worker in local dev, `.dev.vars` must also include `LICENSE_PRIVATE_KEY_B64`.
Generate it from your private key file:

```bash
base64 -w 0 keys/license_priv.key
```

Then call admin endpoints with the same key:

```bash
curl -H "x-admin-api-key: <your-key>" http://127.0.0.1:8788/api/admin/licenses
```

5. Deploy:

```bash
bun run --filter @offline-sqlite/licensing-server deploy:public
bun run --filter @offline-sqlite/licensing-server deploy:admin
```

## Security model

- Public worker exposes only customer licensing endpoints.
- Admin worker expects `cf-access-authenticated-user-email` (Cloudflare Access).
- For local development only, `x-admin-api-key` is accepted if it matches `ADMIN_DEV_API_KEY`.

## Key generation notes

- `LICENSE_PRIVATE_KEY_B64` must be a base64-encoded 32-byte Ed25519 private key.
- This key signs activation payloads and verifies `LKEY-...` license keys.
- Convert existing key file to base64:

```bash
base64 -w 0 keys/license_priv.key
```
