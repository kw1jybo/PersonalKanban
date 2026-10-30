# Environment

Everything needed to build, run and test PersonalKanban. The tables below are generated from the code
(`package.json` files, `.nvmrc`, `.env.example`, `apps/api/src/env.ts`, the CI workflow), so they cannot
quietly drift. CI fails if this file is stale or if a dependency or variable has no documented purpose.

## Setup

1. Install the Node version from `.nvmrc` (see Toolchain below).
2. Enable pnpm at the pinned version: `corepack enable`. Corepack reads `packageManager` and installs that pnpm.
3. `pnpm install`
4. `cp .env.example .env`
5. `pnpm dev` starts the API and the web app.

`pnpm-lock.yaml` holds the exact resolved versions. The ranges below are what the code declares.

## Keeping this file in sync

- Add or change a dependency, environment variable or CI action, then run `pnpm env-doc` to regenerate the tables.
- New dependencies and variables need a one-line purpose in `docs/dependency-notes.json`. `pnpm env-doc:check`
  fails until they have one, and also fails if a note outlives the thing it describes.
- A variable read in `apps/api/src/env.ts` must be set in `.env.example`.
- Only the part between the markers is generated. Edit the rest by hand.

## Requirements

<!-- BEGIN GENERATED: scripts/env-doc.mjs -->

### Toolchain

| Tool | Required | Pinned in |
| --- | --- | --- |
| Node.js | >=22.12.0 (`.nvmrc`: 22) | `package.json` engines, `.nvmrc` |
| pnpm | 10.28.0 | `package.json` packageManager |
| TypeScript | ~6.0.3 | `package.json` devDependencies |

### Runtime dependencies

| Package | Range | Used by | Purpose |
| --- | --- | --- | --- |
| `@tanstack/react-query` | ^5.104.1 | apps/web | Server-state cache for the web app; the tRPC client is built on it. |
| `@trpc/client` | ^11.19.0 | apps/web | Browser-side tRPC client. |
| `@trpc/server` | ^11.19.0 | apps/api, apps/web | tRPC router and procedures on the API. The web app uses it for types only. |
| `@trpc/tanstack-react-query` | ^11.19.0 | apps/web | tRPC integration that exposes procedures as TanStack Query options. |
| `fastify` | ^5.12.5 | apps/api | HTTP server for the API. |
| `react` | ^19.3.0 | apps/web | UI library for the web app. |
| `react-dom` | ^19.3.0 | apps/web | React renderer for the browser. |
| `zod` | ^4.6.5 | apps/api, packages/shared | Runtime schemas; the TypeScript types are inferred from them. |

### Development dependencies

| Package | Range | Used by | Purpose |
| --- | --- | --- | --- |
| `@eslint/js` | ^10.0.1 | root | ESLint's recommended base rules. |
| `@types/node` | ^22.20.5 | apps/api | Node.js type definitions for the API. |
| `@types/react` | ^19.3.0 | apps/web | React type definitions. |
| `@types/react-dom` | ^19.3.0 | apps/web | React DOM type definitions. |
| `@vitejs/plugin-react` | ^6.1.2 | apps/web | React support (JSX transform, fast refresh) for Vite. |
| `eslint` | ^10.12.0 | root | Linter, run with strict type-checked typescript-eslint rules. |
| `eslint-config-prettier` | ^10.1.8 | root | Turns off ESLint rules that conflict with Prettier. |
| `eslint-plugin-react-hooks` | ^7.1.1 | root | Enforces the rules of hooks in the web app. |
| `globals` | ^17.13.0 | root | Global-variable sets (node, browser) for ESLint. |
| `prettier` | ^3.9.9 | root | Code formatter. |
| `tsx` | ^4.23.15 | apps/api | Runs the TypeScript API directly, with watch mode for development. |
| `typescript` | ~6.0.3 | root | Compiler used for type checking only (noEmit). Pinned below 6.1 because typescript-eslint does not yet support 7.0. |
| `typescript-eslint` | ^8.71.1 | root | TypeScript parser and rules for ESLint. |
| `vite` | ^8.3.3 | apps/web | Dev server and bundler for the web app. |
| `vitest` | ^5.0.3 | apps/api, packages/core, packages/shared | Test runner for the API and the packages. |

### Environment variables

| Variable | Default | Status | Purpose |
| --- | --- | --- | --- |
| `HOST` | `127.0.0.1` | in use | Interface the API binds to. |
| `PORT` | `3000` | in use | Port the API listens on. Vite proxies /trpc to it. |
| `LOG_LEVEL` | `info` | in use | Fastify log level: fatal, error, warn, info, debug, trace or silent. |
| `DATABASE_URL` | `"file:./dev.db"` | planned | Database connection string: SQLite locally, Postgres in production. Arrives with the persistence milestone. |

### CI

Runner: `ubuntu-latest`. Node comes from `.nvmrc`; pnpm from `packageManager`.

- `actions/checkout@v7`
- `pnpm/action-setup@v6`
- `actions/setup-node@v7`

<!-- END GENERATED -->
