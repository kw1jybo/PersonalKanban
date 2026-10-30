# PersonalKanban

A self-hostable kanban board built to learn and showcase end-to-end TypeScript: one set of types from the
database to the browser, with no hand-written duplicates. See `README.md` for layout and type-design notes.

These rules extend the shared rules in `C:\Code\CLAUDE.md`.

## Commands

Requires the Node and pnpm versions in `docs/ENVIRONMENT.md`.

| Command              | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `pnpm dev`           | API on :3000, web on :5173 (Vite proxies `/trpc` to the API) |
| `pnpm typecheck`     | `tsc --noEmit` in every workspace                            |
| `pnpm lint`          | ESLint with strict type-checked rules                        |
| `pnpm format:check`  | Prettier check (`pnpm format` to fix)                        |
| `pnpm test`          | Vitest in every workspace                                    |
| `pnpm env-doc`       | Regenerate the tables in `docs/ENVIRONMENT.md`               |
| `pnpm env-doc:check` | Fail if `docs/ENVIRONMENT.md` is stale or undocumented       |

CI runs typecheck, lint, format:check, env-doc:check and test. Run them all before declaring work done.

## Architecture rules

- **`packages/shared` is the single source of truth for types.** Define a zod schema and infer the type
  with `z.infer`. Never hand-write a type that duplicates a schema.
- **`packages/core` knows nothing about HTTP or tRPC.** Plain TypeScript services and `DomainError`
  subclasses only.
- **`apps/api` is a thin adapter over `core`.** Map domain errors to transport codes through the
  exhaustive switch ending in `assertNever`, so a new error type fails compilation until it is mapped.
- **`apps/web` imports only `type { AppRouter }` from the API.** No server code may reach the browser
  bundle. Keep `apps/api/src/index.ts` free of Node and Fastify imports.
- **Workspace packages are consumed as TypeScript source** (`exports` points at `src/index.ts`). There is
  no build step between packages.
- **The tsconfig is deliberately strict** (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`). Do not loosen it to make code compile; fix the code.
- **No `any`.** ESLint enforces `no-explicit-any` as an error.

## Dependencies and environment

`docs/ENVIRONMENT.md` documents the toolchain, every dependency, every environment variable and the CI
actions. Its tables are generated, and CI checks them.

When you add, remove or change a dependency, an environment variable, the Node or pnpm version, or a CI
action:

1. Add a one-line purpose to `docs/dependency-notes.json` (or remove the stale one).
2. Run `pnpm env-doc` and commit the regenerated `docs/ENVIRONMENT.md`.
3. Any variable read in `apps/api/src/env.ts` must also be set in `.env.example`.

Do not hand-edit between the `BEGIN GENERATED` and `END GENERATED` markers.

TypeScript is pinned to `~6.0.3` because `typescript-eslint` does not yet support 7.0. Do not bump it
until that peer range allows it.

## Branching

`master` is the trunk branch. Do feature work on a branch and merge through a pull request.

## Mutation Testing Branch Isolation

**This rule applies to ALL repositories under `C:\Code` with NO EXCEPTIONS.**

If any work involves running a mutation testing tool (Stryker or equivalent), that work MUST be done on a branch that will not affect `master` or the current working branch:

- **If you are on `master`**: create a new branch for the mutation work before running Stryker.
- **If you are on a feature branch**: branch off that feature branch, do the mutation work on that subbranch, then merge the subbranch back when complete.

Never run Stryker on `master` or on a branch intended to accumulate feature work. A machine reboot, crash, or interrupted run must not leave the working branch in a dirty or inconsistent state.

**New repository rule:** Every new repository created under `C:\Code` must include a `CLAUDE.md` file at its root containing this Mutation Testing Branch Isolation rule. Creating a repo without it is not acceptable.
