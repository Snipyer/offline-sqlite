# Licensing Cloudflare Deploy Checklist

This checklist applies to:

- `packages/licensing-server` (public + admin workers)
- `apps/licensing-admin-web` (Pages + Functions)

## 1) One-time Cloudflare setup

- Create the D1 database and set its `database_id` in:
    - `packages/licensing-server/wrangler.public.toml`
    - `packages/licensing-server/wrangler.admin.toml`
- Confirm Pages project is `licensing-admin-web`.

## 2) Required deploy-time env

Export these before deploy:

```bash
export LICENSE_PRIVATE_KEY_B64="..."
export LICENSE_PUBLIC_KEY_B64="..."
```

Optional (only if using URL fallback to Access-protected upstream):

```bash
export CF_ACCESS_CLIENT_ID="..."
export CF_ACCESS_CLIENT_SECRET="..."
```

## 3) Deploy (single command)

```bash
bun run cf:deploy:licensing
```

The command does:

1. Type-checks `@offline-sqlite/licensing-server` and `licensing-admin-web`.
2. Pushes production Worker secrets.
3. Pushes optional Pages fallback secrets (if provided).
4. Deploys public worker, then admin worker.
5. Deploys Pages app.

## 4) Post-deploy verification

- Public worker health endpoint returns `200`:
    - `https://<public-worker>/health`
- Admin requests only work through `licensing-admin-web` behind Access.
- `apps/licensing-admin-web/wrangler.toml` has `LICENSING_ADMIN_API` service binding configured.
- Admin worker remains internal-only (`workers_dev = false`).
