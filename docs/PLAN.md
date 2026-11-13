# Plan: the kanban board

What the app will do, the data objects it needs, and the order to build it in. Decisions the owner has made
are marked **Decided**. Everything else is a proposed default that can change. See `docs/FLOW.md` for how a
request travels through the code today.

## Scope

- One user, one board. Login arrives in a later milestone (the request context already carries a `userId`).
- A board is four fixed columns, one per state. Columns are not user-defined.
- Items can be moved freely between any states. There are no transition rules.
- Items can be **archived** (hidden from the board, shown on a separate Archive page) and **deleted**.

## Decisions

| Topic                 | Decision                                                                          | Status   |
| --------------------- | --------------------------------------------------------------------------------- | -------- |
| States                | `backlog`, `todo`, `in_progress`, `done`                                          | Decided  |
| Moving items          | Free movement between any states                                                  | Decided  |
| Columns               | Fixed, one per state                                                              | Decided  |
| Archive               | Not on the main board. Lives on its own page or tab                               | Decided  |
| Delete                | A real delete exists, separate from archive                                       | Decided  |
| Users                 | One user for now                                                                  | Decided  |
| Archived is a...      | Flag (`archivedAt`), not a fifth state, so an item keeps its state while archived | Proposed |
| Where delete is       | From the Archive page only, so a stray click cannot destroy an active item        | Proposed |
| Order inside a column | An integer `position`; a move names the target state and index                    | Proposed |
| Archived items        | Read-only. Only restore and delete work on them                                   | Proposed |

## Data objects (`packages/shared`)

Every type is inferred from a zod schema, as in the rest of the project.

| Schema                | Shape                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorkItemIdSchema`    | A branded string, like `UserId`, so only parsed ids are accepted                                                                                                        |
| `WorkItemStateSchema` | `z.enum(['backlog', 'todo', 'in_progress', 'done'])`, a union of those four strings                                                                                     |
| `WorkItemSchema`      | `id`, `title` (1-120 chars), `notes` (up to 5000, default empty), `state`, `position` (integer, 0 or more), `createdAt`, `updatedAt`, `archivedAt` (ISO date or `null`) |
| `CreateWorkItemInput` | `title`, optional `notes`, optional `state` (default `backlog`)                                                                                                         |
| `UpdateWorkItemInput` | `id`, optional `title`, optional `notes`                                                                                                                                |
| `MoveWorkItemInput`   | `id`, target `state`, target `index` in that column                                                                                                                     |
| `WorkItemIdInput`     | `{ id }`, shared by archive, restore and delete                                                                                                                         |
| `BoardSchema`         | One list of items per state, each ordered by `position`                                                                                                                 |

TypeScript's `enum` keyword is not used. A zod enum gives the runtime check, the type and exhaustive
`switch` checking (with `assertNever`) from one definition.

## Logic (`packages/core`)

`core` stays free of HTTP and of any database. It depends on three things passed in, the same idea as the
`Clock` parameter on `greet()`:

- a `WorkItemRepository` interface (sketch below),
- a `Clock`, so timestamps are testable,
- an `IdGenerator`, so ids are testable.

```ts
interface WorkItemRepository {
  list(options: { archived: boolean }): Promise<WorkItem[]>;
  get(id: WorkItemId): Promise<WorkItem | undefined>;
  save(item: WorkItem): Promise<void>; // insert or update
  saveMany(items: WorkItem[]): Promise<void>; // renumbering after a move
  delete(id: WorkItemId): Promise<void>;
}
```

| Function          | What it does                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `getBoard`        | Active (non-archived) items grouped by state and ordered by `position` |
| `listArchived`    | Archived items                                                         |
| `createWorkItem`  | New item at the end of its column                                      |
| `updateWorkItem`  | Change title or notes, set `updatedAt`                                 |
| `moveWorkItem`    | Change state and position, renumbering the affected columns            |
| `archiveWorkItem` | Set `archivedAt`; the item keeps its state                             |
| `restoreWorkItem` | Clear `archivedAt`; the item returns to the end of its previous column |
| `deleteWorkItem`  | Remove the item permanently                                            |

An `InMemoryWorkItemRepository` lives in `core` for tests and for the first working version of the app.

Errors reuse `NotFoundError` and `ValidationError`. Editing or moving an archived item needs one new domain
error, `ConflictError`, which `apps/api/src/errors.ts` must map to tRPC's `CONFLICT`. The exhaustive switch
will refuse to compile until it does.

## API (`apps/api`)

A `workItem` router beside `hello`. Each procedure uses the shared schemas for `.input()` and `.output()`.

| Procedure           | Kind     | Calls             |
| ------------------- | -------- | ----------------- |
| `workItem.board`    | query    | `getBoard`        |
| `workItem.archived` | query    | `listArchived`    |
| `workItem.create`   | mutation | `createWorkItem`  |
| `workItem.update`   | mutation | `updateWorkItem`  |
| `workItem.move`     | mutation | `moveWorkItem`    |
| `workItem.archive`  | mutation | `archiveWorkItem` |
| `workItem.restore`  | mutation | `restoreWorkItem` |
| `workItem.delete`   | mutation | `deleteWorkItem`  |

## UI (`apps/web`)

- **Board page:** four columns, one card per item showing the title, with a form to add an item and controls
  to edit, move and archive.
- **Archive page:** the archived items, each with Restore and Delete.
- The two pages start as tabs held in component state. A router can come later if each page needs its own URL.
- Moving starts with a simple control (a select or buttons). Drag and drop is a separate, later step.
- Changes use TanStack Query mutations, then refresh the board.

## Order of work

Thin end-to-end slices, with the real database last, so the app is usable early and the types and flow
(the learning goal) come before the plumbing.

### Milestone 2: the board, on an in-memory store

| Slice | What                                                                               | Done when                                                   |
| ----- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 2a    | Schemas in `shared` with tests                                                     | The schemas accept and reject the right data                |
| 2b    | Repository interface, in-memory version, `getBoard` and `createWorkItem` in `core` | Tests create items and read them back grouped by state      |
| 2c    | `workItem.board` and `workItem.create`; four columns and an add form in `web`      | You can add an item in the browser and see it in a column   |
| 2d    | `update` and `move` through all layers                                             | You can edit an item and move it between states and places  |
| 2e    | `archive`, `restore`, `delete`, `archived`; the Archive tab                        | Archiving removes it from the board; restore brings it back |
| 2f    | Drag and drop (optional)                                                           | Cards can be dragged between columns                        |

Data lives in memory in this milestone, so it resets when the API restarts.

### Milestone 3: persistence

- A SQLite implementation of `WorkItemRepository`, with migrations, behind the same interface.
- `DATABASE_URL` (already reserved in `.env.example`) selects the database. Postgres for production later.
- The repository tests run against both the in-memory and SQLite versions.
- Choosing the database library is deferred to here. The open question is how the table definitions relate
  to the shared schemas, so the "one type from database to browser" goal holds. Candidates are Drizzle
  (table types, plus zod schema generation) and Kysely. The repository interface keeps the choice contained.
- Dependency and environment changes follow the rules in `docs/ENVIRONMENT.md`.

Later milestones are unchanged: authentication (milestone 4) and a REST layer (milestone 5).

## Open questions

- **Position strategy.** Integer positions mean a move renumbers the items in the affected columns. That is
  simple and fine for one user. Fractional ordering avoids renumbering and may suit drag and drop better.
- **Delete from the board.** Proposed: only from the Archive page. Changing it affects the UI only.
- **Restore target.** Proposed: back to the end of the column the item was in when archived.
