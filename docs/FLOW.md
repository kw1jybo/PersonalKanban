# How a request flows through the code

This follows one click of the **Greet** button from the browser to the server and back, and shows which file
does what at each step. For a per-file reference see `docs/FILES.md`.

## The four pieces

| Folder            | Job                                                            | C# equivalent             |
| ----------------- | -------------------------------------------------------------- | ------------------------- |
| `packages/shared` | The **shape** of the data and its validation rules. No logic.  | A Contracts / DTO project |
| `packages/core`   | The **logic**. Plain functions; knows nothing about HTTP.      | Domain / service layer    |
| `apps/api`        | Receives HTTP requests, validates them, calls `core`, replies. | Controller / minimal API  |
| `apps/web`        | The React page in the browser.                                 | The frontend              |

Dependencies point one way: `web` and `api` use `shared`; `api` uses `core`; `core` uses `shared`. `shared`
uses nothing in the repo. `web` never imports server code. It imports only the _type_ of the API's router.

Two files are both called `hello.ts`, and they do different jobs:

- `packages/shared/src/schemas/hello.ts` is the **shape**: "a greet request has a `name`".
- `packages/core/src/hello.ts` is the **logic**: "given a name, build the message".

## The request, step by step

```
 BROWSER                                              SERVER
 -------                                              ------
 apps/web/src/App.tsx
   user types "Ada", clicks Greet
   GreetInputSchema.safeParse(...)   <-- same schema as the server uses (packages/shared)
        |
 apps/web/src/trpc.ts + main.tsx
   tRPC client sends   GET /trpc/hello.greet?input={"name":"Ada"}
        |
 Vite dev server (apps/web/vite.config.ts)
   proxies /trpc  -->  http://127.0.0.1:3000
        |
        v
                                         apps/api/src/server.ts
                                           Fastify receives the request, hands /trpc to tRPC
                                                |
                                         apps/api/src/router.ts   (procedure hello.greet)
                                           1. .input(GreetInputSchema)    <-- packages/shared
                                              validates the request; applies defaults
                                           2. calls greet(ctx.userId, input)  --> packages/core
                                                |                              (apps/api/src/context.ts supplies ctx)
                                           3. .output(GreetOutputSchema)  <-- packages/shared
                                              checks the reply has the promised shape
        <-------------------------------------+
 App.tsx
   useQuery returns the data; the page shows  "Hello, Ada!"
```

A concrete example of the data at each stage:

| Stage                               | Value                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Browser sends                       | `{ name: "Ada" }`                                                         |
| After `GreetInputSchema` parses it  | `{ name: "Ada" }` (trimmed, 1-50 characters, otherwise rejected)          |
| `greet()` returns                   | `{ message: "Hello, Ada!", greetedAt: "2026-...", authenticated: false }` |
| After `GreetOutputSchema` checks it | Same value, confirmed to match the shape                                  |
| Browser receives                    | The same object, with its type known automatically                        |

`packages/shared` is consulted at both doors, going in and going out. It never does any work itself.

### Who is "authenticated"?

`apps/api/src/fastify-context.ts` builds the per-request context. It currently always sets `userId` to
`undefined`, because authentication arrives in a later milestone. So `authenticated` is `false` for now.

## Two kinds of safety: compile time and run time

The same schema protects you twice, in different ways.

|                | When                    | What it checks                                | Tool                     |
| -------------- | ----------------------- | --------------------------------------------- | ------------------------ |
| **Types**      | While you write / build | Your code uses the data correctly             | `tsc` (`pnpm typecheck`) |
| **Validation** | While the app runs      | Data that arrives over the network is genuine | zod, in `router.ts`      |

Types disappear when the code runs, so they cannot stop a bad request from the network. zod can, and
`z.infer` turns the same schema back into a TypeScript type, so there is one definition for both.

The browser gets its types from `import type { AppRouter }` in `apps/web/src/trpc.ts`. Change a procedure's
input or output on the server and the web code stops compiling until it is updated. No type is written twice.

## Errors

1. `core` throws a `DomainError` subclass (for example `NotFoundError`). It has no idea what HTTP is.
2. The middleware in `apps/api/src/trpc.ts` catches it and asks `toTRPCCode` in `apps/api/src/errors.ts` for
   the matching transport code (`NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`).
3. That function ends in `assertNever`. Add a new error class and the code will not compile until you map it.
4. The browser receives a normal tRPC error, and `useQuery` exposes it as `greeting.error`.

## Adding a field: the order to work in

Using "add an optional `greeting` to the hello feature" as the example. Work from the contract outward and let
the compiler tell you what else needs to change.

1. **`packages/shared`**: add the field to the schema, for example
   `greeting: z.string().trim().min(1).max(20).default('Hello')`.
2. Run `pnpm typecheck`. It fails wherever code builds the type by hand without the new field. In this project
   that is the tests in `packages/core`.
3. **`packages/core`**: use the field in the logic, and update the tests to pass a complete input.
4. **`apps/web`**: add a form control for it. The type of the request already includes the new field.
5. Run `pnpm typecheck`, `pnpm lint` and `pnpm test`.

### Why the default is not applied inside `core`

zod has two types for a schema with a default:

| Type                                     | Written as                         | `greeting` is |
| ---------------------------------------- | ---------------------------------- | ------------- |
| What a caller may send (**input**)       | `z.input<typeof GreetInputSchema>` | optional      |
| What you have after parsing (**output**) | `z.infer<typeof GreetInputSchema>` | required      |

`GreetInput` is the output type, so `core` always receives complete, validated data. The edge (tRPC plus zod)
applies the default once. If `core` accepted the input type it would have to apply the default itself,
duplicating the schema.

## Following a change through the code (the greeting example)

How you find every place a change touches, and why the web app needed only one edit. For any new piece of data,
ask two questions: **where is it defined**, and **who uses it?** Then walk the chain in order.

| Step | Question                | Answer            | File                           |
| ---- | ----------------------- | ----------------- | ------------------------------ |
| 1    | Where is the contract?  | The request shape | `packages/shared/.../hello.ts` |
| 2    | Who builds the message? | `greet()`         | `packages/core/src/hello.ts`   |
| 3    | Who builds the request? | The form          | `apps/web/src/App.tsx`         |

Steps 2 and 3 come from reading the code. The tools find everything else, and each one catches a different kind
of miss:

| Tool                | What it caught for the `greeting` field                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | Two tests in `packages/core` built a `GreetInput` by hand without `greeting` (types, build time)      |
| `pnpm test`         | Three stale expectations: the schema test, the `greet()` message and the HTTP test (values, run time) |
| "never read" errors | Two leftover variables in `App.tsx` that nothing used (`noUnusedLocals` in the strict tsconfig)       |

Types cannot see a wrong value, only a wrong shape, so run both commands after every change.

### Why the web app needed only one edit

`apps/web` never writes down what a greet request looks like. The type is derived from the server:

```
packages/shared/.../hello.ts    GreetInputSchema            the field list
        |
apps/api/src/router.ts          .input(GreetInputSchema)    the procedure is defined with that schema
        |
apps/api/src/index.ts           export type AppRouter       the router's type carries the input shape
        |
apps/web/src/trpc.ts            createTRPCContext<AppRouter>()   the browser imports only that type
        |
apps/web/src/App.tsx            trpc.hello.greet.queryOptions({ name, greeting })
                                                            its parameter type IS the input shape
```

Adding `greeting` to the schema made `queryOptions` accept a `greeting` property with no edit to the web app's
types. Try a wrong key such as `greetingg` and the editor flags it. In a project with a hand-written client you
would update the request type, the response type and every call site. Here those types do not exist. The only
web code that changed was the code that _uses_ the data: the state, the form and the input box. The web app also
imports `GreetInputSchema` from `shared` for its own validation, so the browser-side rules are the same object
as the server's, not a copy.

### Optional fields change nothing downstream

The web edit was optional. With `.default(...)` on the field, the page kept working before any web change: the
API filled in the default for a missing `greeting`. Had the field been required, the compiler would have broken
`App.tsx` until it was fixed, the same way it broke the tests. So changing the contract shows what else must
change, and making a new field optional means nothing else has to change at all.

### Two form patterns the example uses

- **Typed value vs submitted value.** `draft` and `greetingDraft` hold what is in the boxes. `name` and
  `greetingText` hold what was last submitted, and only those feed the query, so a request goes out on Greet and
  not on every keystroke.
- **Empty box means "not provided".** `greetingDraft || undefined` stops an empty box from being sent as `''`,
  which would fail `min(1)` and silently do nothing. The schema then applies its default, so the browser never
  repeats it.

### Mistakes this example surfaced

| Mistake                                  | Symptom                                       | Cause                                                                    |
| ---------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| Message code placed in the schema file   | Red squiggles on `input` in `packages/shared` | The schema describes a shape; `greet()` in `core` builds the text        |
| `` `${input.greeting, input.name}!` ``   | Message was `Ada!` instead of `Hello, Ada!`   | A comma inside one `${ }` keeps only the last value; use one `${ }` each |
| Existing tests expecting only `{ name }` | Failures in `shared` and `api` tests          | The default now appears in parsed data; update the expected values       |

## Running it

`pnpm dev` starts both apps. The web app is at http://localhost:5173 and the API at http://127.0.0.1:3000
(`/health` returns `{ "status": "ok" }`). Edits reload automatically: the API restarts and the browser
refreshes. See `docs/ENVIRONMENT.md` for setup.
