#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

require_env() {
	if [[ -z "${!1:-}" ]]; then
		echo "Missing required environment variable: $1" >&2
		exit 1
	fi
}

require_cmd bun
require_cmd bunx

require_env LICENSE_PRIVATE_KEY_B64
require_env LICENSE_PUBLIC_KEY_B64

echo "==> Running type checks"
bun run --filter @offline-sqlite/licensing-server check-types
bun run --filter licensing-admin-web check-types

echo "==> Pushing worker secrets (production)"
(
	cd "$ROOT_DIR/packages/licensing-server"
	printf "%s" "$LICENSE_PRIVATE_KEY_B64" | bunx wrangler secret put LICENSE_PRIVATE_KEY_B64 --config wrangler.public.toml --env production
	printf "%s" "$LICENSE_PUBLIC_KEY_B64" | bunx wrangler secret put LICENSE_PUBLIC_KEY_B64 --config wrangler.public.toml --env production
	printf "%s" "$LICENSE_PUBLIC_KEY_B64" | bunx wrangler secret put LICENSE_PUBLIC_KEY_B64 --config wrangler.admin.toml --env production
)

if [[ -n "${CF_ACCESS_CLIENT_ID:-}" && -n "${CF_ACCESS_CLIENT_SECRET:-}" ]]; then
	echo "==> Setting optional Pages fallback Access service-token secrets"
	(
		cd "$ROOT_DIR/apps/licensing-admin-web"
		printf "%s" "$CF_ACCESS_CLIENT_ID" | bunx wrangler pages secret put CF_ACCESS_CLIENT_ID --project-name licensing-admin-web
		printf "%s" "$CF_ACCESS_CLIENT_SECRET" | bunx wrangler pages secret put CF_ACCESS_CLIENT_SECRET --project-name licensing-admin-web
	)
fi

echo "==> Deploying licensing workers"
bun run --filter @offline-sqlite/licensing-server deploy:public
bun run --filter @offline-sqlite/licensing-server deploy:admin

echo "==> Deploying admin web"
bun run --filter licensing-admin-web deploy

echo "==> Done"
echo "Verify: /health on public worker and admin-web /api/admin/licenses behind Access"