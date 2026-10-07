# PersonalKanban

A self-hostable kanban board built as a TypeScript showcase. The goal is one set of types that flows from
the database to the browser, with no hand-written duplicates.

> Status: **milestone 1 (skeleton)**. A `hello.greet` procedure is callable from the React app through
> tRPC, with input and output types inferred end to end.

## Layout

| Path              | Purpose                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `packages/shared` | zod schemas and the types inferred from them. The single source of truth.                   |
| `packages/core`   | Plain TypeScript service layer and domain errors. No HTTP or tRPC knowledge.                |
| `apps/api`        | Fastify server. The tRPC adapter is a thin layer over `core` (REST arrives in milestone 5). |
| `apps/web`        | React, Vite and TanStack Query. Talks to the API through the inferred `AppRouter` type.     |

Workspace packages are consumed as TypeScript source (`exports` points at `src/index.ts`), so there is no
build step between packages.

## Getting started

Requires Node 22+ and pnpm 10.

```sh
pnpm install
cp .env.example .env
pnpm dev            # API on :3000, web on :5173 (Vite proxies /trpc to the API)
```

Checks (the same ones CI runs): `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`.

## Type-design notes

- **Strict base config.** `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes` and `noImplicitOverride`. Each package extends it.
- **Types come from zod, not the other way round.** `GreetInput` is `z.infer<typeof GreetInputSchema>`,
  so runtime validation and compile-time types cannot drift apart.
- **Branded `UserId`.** `z.string().brand<'UserId'>()` makes a plain string unassignable where a user id
  is required, so ids can only be created by parsing.
- **Exhaustive error mapping.** `DomainError` subclasses carry a literal `code`. `toTRPCCode` switches
  on it and ends in `assertNever`, so adding a new error type fails compilation until it is mapped.
- **Type-only API entry.** The web app imports only `type { AppRouter }`, so no server code reaches the
  browser bundle. `apps/api/src/index.ts` is deliberately free of Node and Fastify imports.
- **TypeScript 6.0.** TypeScript 7.0 is out, but `typescript-eslint` does not yet support it
  (peer range `<6.1.0`), so the repo pins `~6.0.3`.

## License

MIT
