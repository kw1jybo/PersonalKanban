# Files

A guide to what each file in the repository is for. The project is a pnpm workspace with two apps and two
packages. See `README.md` for the overall design and `docs/ENVIRONMENT.md` for tooling and dependencies. `docs/FLOW.md` follows one request through the pieces.

## How the pieces fit

```
apps/web  --(type-only import of AppRouter)-->  apps/api  -->  packages/core  -->  packages/shared
 browser                                          server        plain logic         schemas and types
```

- `packages/shared` defines the data shapes once, as zod schemas, and infers the TypeScript types from them.
- `packages/core` holds the logic and domain errors. It knows nothing about HTTP.
- `apps/api` exposes `core` over the network with Fastify and tRPC.
- `apps/web` is the React app. It imports only the _type_ of the API's router, so nothing server-side
  reaches the browser.

Each package has an `index.ts` that is its public entry point (the `exports` field in its `package.json`
points at it). Other packages may import only what `index.ts` re-exports.

## Root

| File                       | Purpose                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `package.json`             | Root manifest: scripts (`dev`, `lint`, `test`, `env-doc`...) and shared dev tools |
| `pnpm-workspace.yaml`      | Declares `apps/*` and `packages/*` as one workspace                               |
| `pnpm-lock.yaml`           | Exact resolved dependency versions. Generated; never edit by hand                 |
| `tsconfig.base.json`       | Strict TypeScript settings that every package extends                             |
| `eslint.config.js`         | Lint rules, including the ban on `any` and the exhaustive-switch check            |
| `.prettierrc.json`         | Formatter settings                                                                |
| `.prettierignore`          | Files the formatter skips (lockfile, the generated environment doc)               |
| `.nvmrc`                   | The Node version to use                                                           |
| `.env.example`             | Template for your local `.env` (`HOST`, `PORT`, `LOG_LEVEL`)                      |
| `.gitignore`               | Files git ignores (`node_modules`, `.env`, local databases...)                    |
| `LICENSE`                  | MIT license                                                                       |
| `README.md`                | Project overview, layout and type-design notes                                    |
| `CLAUDE.md`                | Instructions for Claude working in this repo: commands, rules, workflow           |
| `.github/workflows/ci.yml` | The checks GitHub runs on every push and pull request                             |

## docs and scripts

| File                         | Purpose                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `docs/ENVIRONMENT.md`        | Toolchain, dependencies, environment variables and CI actions. Tables are generated     |
| `docs/dependency-notes.json` | One-line purpose for each dependency and variable; read by the generator                |
| `docs/FILES.md`              | This file                                                                               |
| `docs/FLOW.md`               | How one request travels from the browser through the API, `core` and `shared` and back  |
| `scripts/env-doc.mjs`        | Regenerates `docs/ENVIRONMENT.md` (`pnpm env-doc`) and checks it (`pnpm env-doc:check`) |

## packages/shared

| File                   | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `package.json`         | Package manifest                                                    |
| `tsconfig.json`        | Extends the base config                                             |
| `src/index.ts`         | Public entry point; re-exports the schemas, types and `assertNever` |
| `src/schemas/hello.ts` | Zod schemas and inferred types for the `greet` input and output     |
| `src/schemas/user.ts`  | The branded `UserId` type                                           |
| `src/assert-never.ts`  | Helper that makes a `switch` fail to compile when a case is missing |
| `src/schemas.test.ts`  | Tests for the schemas                                               |

## packages/core

| File                | Purpose                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| `package.json`      | Package manifest                                                                        |
| `tsconfig.json`     | Extends the base config                                                                 |
| `src/index.ts`      | Public entry point                                                                      |
| `src/hello.ts`      | The `greet` function; takes a clock so tests can control time                           |
| `src/errors.ts`     | `DomainError` and its subclasses (`NotFoundError`, `ForbiddenError`, `ValidationError`) |
| `src/hello.test.ts` | Tests for `greet`                                                                       |

## apps/api

| File                     | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `package.json`           | Package manifest and the `dev`, `start` and `test` scripts                  |
| `tsconfig.json`          | Extends the base config; includes `src` and Node types                      |
| `src/main.ts`            | Starts the server: reads the environment, builds the server, listens        |
| `src/env.ts`             | Validates `HOST`, `PORT` and `LOG_LEVEL` with zod                           |
| `src/server.ts`          | Builds the Fastify app: a `/health` route and tRPC mounted at `/trpc`       |
| `src/router.ts`          | Defines the `hello.greet` procedure and exports the `AppRouter` type        |
| `src/trpc.ts`            | tRPC setup, plus middleware that converts domain errors to tRPC error codes |
| `src/context.ts`         | The type of per-request data (`userId`, always undefined until auth exists) |
| `src/fastify-context.ts` | Creates that context for each request                                       |
| `src/errors.ts`          | Maps each `DomainError` code to a tRPC code, ending in `assertNever`        |
| `src/index.ts`           | Type-only export of `AppRouter`, which the web app imports                  |
| `src/errors.test.ts`     | Tests for the error mapping                                                 |
| `src/server.test.ts`     | Tests for the server                                                        |

Note: `packages/core/src/errors.ts` defines the error classes; `apps/api/src/errors.ts` converts them to
transport codes. They are different files with different jobs.

## apps/web

| File             | Purpose                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| `package.json`   | Package manifest and the `dev`, `build` and `typecheck` scripts                     |
| `tsconfig.json`  | Extends the base config; adds DOM types and JSX; includes `src` and the Vite config |
| `index.html`     | The page shell; loads `src/main.tsx`                                                |
| `vite.config.ts` | Dev server settings, including the `/trpc` proxy to the API on port 3000            |
| `src/main.tsx`   | Starts React and sets up the query and tRPC providers                               |
| `src/trpc.ts`    | Creates the typed tRPC client from `AppRouter`                                      |
| `src/App.tsx`    | The only screen so far: a form that calls `hello.greet`                             |

## Keeping this file current

This file is written by hand. When you add, rename or delete a file, update the matching table.
