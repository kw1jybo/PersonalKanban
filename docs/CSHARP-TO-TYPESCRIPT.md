# C# to TypeScript

A reference for reading this codebase with C# habits. It maps the pieces this project uses to their C# equivalents.

## The translation table

| C# habit                                 | TypeScript equivalent in this project                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Entity or DTO class                      | A zod schema, with the type inferred by `z.infer`. The data is a plain object         |
| Record `with` expression                 | Object spread: `{ ...item, archivedAt: ... }`                                         |
| Service class with constructor injection | A factory function, `createWorkItemService(deps)`. A class would work too             |
| Interface plus implementing class        | `interface WorkItemRepository` plus `class InMemoryWorkItemRepository implements ...` |
| DI container                             | None. You pass `deps` by hand at the composition root (`apps/api`, from slice 2c)     |
| `Func<T>` or delegate                    | A plain function type: `type Clock = () => Date`                                      |
| Strongly typed ID (`record struct`)      | A branded string, `WorkItemId`, minted through `WorkItemIdSchema.parse`               |
| Exception subclasses                     | `DomainError` subclasses (these are classes, as in C#)                                |
| Unit test class with `[SetUp]`           | `describe` plus `beforeEach`                                                          |

## Two shifts that explain most of it

1. **Think data in, data out.** Most of the code is functions that take a plain object and return a plain object,
   and the types describe those shapes. Objects don't carry behavior. Behavior lives in functions next to them,
   like `getBoard`.
2. **Validation happens at the edges.** In C# the deserializer produces typed objects you can trust. Here, JSON
   enters at the API boundary, zod checks it once, and after that the types are trusted all the way through
   `core`.

## Objects are shapes, not classes

- A `WorkItem` is a description of the shape an object must have. It exists only at compile time. At runtime
  there is only a plain object with those keys.
- Dates are ISO strings, because the item has to survive being turned into JSON on its way to the browser. A
  `Date` doesn't survive that trip.
- A brand such as `WorkItemId` is compile-time only. At runtime it is just a string.
- Plain objects are mutable reference types, like C# classes. That is why the repository copies items on `save`
  and on every read. A shallow `{ ...item }` is a full copy while every field is a string, a number or `null`.
- `toStrictEqual` compares by value, like C# record equality.

## Classes in TypeScript

- Classes support fields, constructors, methods, `extends`, `implements`, `static`, accessors and abstract classes.
- `public`, `private`, `protected` and `readonly` work as in C#. A parameter property such as
  `constructor(private readonly repo: WorkItemRepository) {}` declares and assigns a field in one step.
- Interfaces are structural. A class satisfies an interface if it has the right members, even without
  `implements`. `implements` only asks the compiler to check, and it points the error at the class.
- `private` is compile-time only. Use `#field` for real runtime privacy.
- `this` can go missing. Passing `repo.save` around as a bare function loses `this`. Closures don't have this
  problem.

## What stays the same

Dependency injection, interfaces, repository and service layers, and testing against a contract all carry over.
What changes is the syntax and the default building block: a function and a plain object, not a class.
