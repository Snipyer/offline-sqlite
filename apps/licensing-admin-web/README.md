# licensing-admin-web

Standalone React Router admin console for license management.

## Environment

Set the admin API base URL:

```bash
VITE_LICENSING_ADMIN_API_URL=https://your-admin-api.example.com
```

Optional for local development (when using `ADMIN_DEV_API_KEY` in the admin worker):

```bash
VITE_LICENSING_ADMIN_API_KEY=your-local-admin-dev-api-key
```

If omitted, the app falls back to `window.location.origin`.

## Commands

```bash
bun run --filter licensing-admin-web dev
bun run --filter licensing-admin-web build
bun run --filter licensing-admin-web check-types
```

## Auth

This app is expected to run behind Cloudflare Access.
The admin API requires a valid Access identity header (`cf-access-authenticated-user-email`).
