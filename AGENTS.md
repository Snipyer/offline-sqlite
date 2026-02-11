# AGENTS.md

## Do

- use **feature-based architecture** for all new features. each feature gets its own folder containing all relevant code (components, hooks, utils, types, api calls). keep everything related to a feature co-located
- use **Bun** as the runtime and package manager. all commands use `bun`, not `npm` or `yarn`
- use **TailwindCSS v4** for styling in `apps/web`. use utility classes, not inline styles
- use **shadcn/ui** components from `apps/web/src/components/ui/`. check there before building custom UI
- use **React Router v7** with file-based routing (`@react-router/fs-routes`). routes live in `apps/web/src/routes/`
- use **Drizzle ORM** for all database operations. schema lives in `packages/db/src/schema/`
- use **tRPC v11** for API endpoints. define routers in `packages/api/src/routers/`
- use **Zod v4** for all input validation in tRPC procedures
- use **Better Auth** for authentication. config is in `packages/auth/src/index.ts`
- use `@t3-oss/env-core` for environment variables. server env in `packages/env/src/server.ts`, web env in `packages/env/src/web.ts`
- use `@tanstack/react-query` with `@trpc/tanstack-react-query` for data fetching on the client. see `apps/web/src/utils/trpc.ts`
- use **Hono** as the server framework. entry point is `apps/server/src/index.ts`
- use `protectedProcedure` from `packages/api/src/index.ts` for authenticated endpoints
- use `publicProcedure` only for endpoints that genuinely need no auth
- use **i18next** via `@offline-sqlite/i18n` for all user-facing strings. do not hard-code text
- use tabs for indentation (tab width 4) and 110 char print width per `.prettierrc`
- default to small, focused components and files. prefer small diffs over repo-wide rewrites
- use workspace imports like `@offline-sqlite/db`, `@offline-sqlite/api`, `@offline-sqlite/auth`, `@offline-sqlite/env`, `@offline-sqlite/i18n`

## Don't

- do not scatter feature code across unrelated directories. keep all feature-related files (components, hooks, utils, types) together in one feature folder
- do not use `npm`, `yarn`, or `pnpm`. this project uses **Bun**
- do not hard-code colors or design tokens. use TailwindCSS utility classes and shadcn/ui theming
- do not hard-code user-facing strings. use i18n translation keys
- do not install new heavy dependencies without approval
- do not use `div` when a shadcn/ui component already exists (Button, Card, Input, etc.)
- do not fetch directly inside components. use the tRPC client in `apps/web/src/utils/trpc.ts`
- do not import `db` directly in `apps/web`. data access goes through tRPC
- do not create new env variables without adding them to the Zod schema in `packages/env/`
- do not use class-based React components. use functional components with hooks
- do not bypass the monorepo package boundaries. respect the `packages/` → `apps/` dependency flow

## Commands

```bash
# Type check a single package or app
bunx tsc -b apps/server
bunx tsc -b apps/web
bunx tsc -b packages/db

# Type check the whole repo
bun run check-types

# Format a single file
bunx prettier --write path/to/file.tsx

# Dev servers
bun run dev           # all apps
bun run dev:web       # web only (port 5173)
bun run dev:server    # server only (port 3000)

# Desktop (Tauri)
bun run desktop:dev   # dev mode
bun run desktop:build # production build

# Database
bun run db:push       # push schema to db
bun run db:generate   # generate migrations
bun run db:migrate    # run migrations
bun run db:studio     # open Drizzle Studio

# Full build (use sparingly)
bun run build
```

Note: always format and type-check files you edit. use file-scoped or package-scoped commands, not full-repo builds, unless explicitly asked.

## Safety and Permissions

Allowed without prompt:
- read files, list files, search codebase
- type-check a single package
- format a single file with prettier
- run dev servers

Ask first:
- installing new packages (`bun add`)
- deleting files or directories
- modifying `.env` files or secrets
- running full builds or production compiles
- git push, force push, or branch operations
- modifying database migrations or schema pushes
- Tauri / desktop builds

## Project Structure

```
offline-sqlite/
├── apps/
│   ├── server/              # Hono API server (tRPC + Better Auth)
│   │   └── src/index.ts     # server entry point, routes, middleware
│   └── web/                 # React frontend (React Router v7 + Tauri)
│       ├── src/
│       │   ├── root.tsx     # app shell, providers, layout
│       │   ├── routes.ts    # file-based routing config
│       │   ├── routes/      # page components (_index, login, dashboard, todos)
│       │   ├── components/  # shared components (header, forms, ui/)
│       │   │   └── ui/      # shadcn/ui primitives (button, card, input, etc.)
│       │   ├── utils/trpc.ts  # tRPC client setup + React Query config
│       │   ├── lib/         # auth client, utilities
│       │   └── index.css    # global styles + Tailwind
│       └── src-tauri/       # Tauri desktop config and sidecar binaries
├── packages/
│   ├── api/                 # tRPC router definitions + context
│   │   └── src/
│   │       ├── index.ts     # tRPC init, publicProcedure, protectedProcedure
│   │       ├── context.ts   # request context (session from Better Auth)
│   │       └── routers/     # feature routers (todo.ts, index.ts)
│   ├── auth/                # Better Auth configuration
│   │   └── src/index.ts     # auth instance with Drizzle adapter
│   ├── db/                  # Drizzle ORM + SQLite
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── index.ts     # db instance + migration runner
│   │       ├── schema/      # table definitions (auth.ts, todo.ts)
│   │       └── migrations/  # Drizzle migration files
│   ├── env/                 # Type-safe env variables (t3-env)
│   │   └── src/
│   │       ├── server.ts    # server-side env (DATABASE_URL, AUTH secrets, etc.)
│   │       └── web.ts       # client-side env (VITE_SERVER_URL)
│   ├── i18n/                # Internationalization (i18next)
│   │   ├── languages/       # translation JSON files
│   │   └── src/             # i18n config and exports
│   └── config/              # shared TypeScript config
│       └── tsconfig.base.json
├── turbo.json               # Turborepo task pipeline
└── package.json             # workspace root + catalog versions
```

## Good and Bad Examples

- **tRPC router**: follow the pattern in `packages/api/src/routers/todo.ts` — use Zod for input, Drizzle for queries
- **new route page**: follow `apps/web/src/routes/todos.tsx` — use tRPC hooks with React Query for data
- **auth check**: use `protectedProcedure` in tRPC, not manual session checks. see `packages/api/src/index.ts`
- **forms**: use `@tanstack/react-form` for client-side forms. see `apps/web/src/components/sign-in-form.tsx`
- **toast notifications**: use `sonner` via `toast()` from `sonner`. see existing usage in `apps/web/src/utils/trpc.ts`
- **adding a new table**: add schema in `packages/db/src/schema/`, export from `packages/db/src/schema/index.ts`, then run `bun run db:push`
- **env variables**: add to Zod schema in `packages/env/src/server.ts` or `web.ts` first, then use via `env.VARIABLE_NAME`

## API and Auth

- tRPC endpoint: `POST /trpc/*` — use the typed client in `apps/web/src/utils/trpc.ts`
- auth endpoints: `GET|POST /api/auth/*` — handled by Better Auth in `apps/server/src/index.ts`
- auth client: use `authClient` from `apps/web/src/lib/auth-client.ts` for login, signup, session
- CORS origins: configured via `CORS_ORIGIN` env variable (comma-separated), plus Tauri origins

## PR Checklist

- format changed files: `bunx prettier --write <files>`
- type-check: `bun run check-types` or package-scoped `bunx tsc -b <package>`
- all green before commit
- diff is small and focused with a brief summary of what changed and why
- no excessive `console.log` or debug comments left behind
- translation keys added for any new user-facing strings

## When Stuck

- ask a clarifying question or propose a short plan before making speculative changes
- do not push large rewrites without confirmation
- if unsure about the right package boundary, check existing imports in similar files

## Test First Mode

- when adding new features: write or update tests first, then implement until green
- for regressions: add a failing test that reproduces the bug, then fix to green
