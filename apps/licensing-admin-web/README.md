# licensing-admin-web

Standalone React Router admin console for license management.

## Environment

Set the admin API base URL:

```bash
VITE_LICENSING_ADMIN_API_URL=https://your-admin-api.example.com
```

For production, use same-origin proxy mode and leave `VITE_LICENSING_ADMIN_API_URL` empty.
Pages Functions should call the admin Worker through Service Binding `LICENSING_ADMIN_API`.

Set these server-side vars for the Pages Function proxy:

```bash
ADMIN_ALLOWED_EMAIL=admin@example.com
```

Optional fallback (for local dev / emergency):

```bash
LICENSING_ADMIN_API_URL=https://your-admin-api.example.com
```

If using URL fallback against an Access-protected upstream, set these Pages secrets:

```bash
wrangler pages secret put CF_ACCESS_CLIENT_ID --project-name licensing-admin-web
wrangler pages secret put CF_ACCESS_CLIENT_SECRET --project-name licensing-admin-web
```

Optional for local development (when using `ADMIN_DEV_API_KEY` in the admin worker):

```bash
LICENSING_ADMIN_API_KEY=your-local-admin-dev-api-key
```

> **Note:** This variable intentionally does **not** use the `VITE_` prefix to
> prevent Vite from embedding it in production bundles. It is injected into dev
> builds only via the `define` option in `vite.config.ts`.

If omitted, the app falls back to `window.location.origin`.

## Commands

```bash
bun run --filter licensing-admin-web dev
bun run --filter licensing-admin-web build
bun run --filter licensing-admin-web check-types
```

## Auth

This app is expected to run behind Cloudflare Access.
The production flow uses a same-origin proxy at `/api/admin/*`, validates
`cf-access-authenticated-user-email`, and forwards only `x-admin-user-email` to the
internal admin Worker service binding.
