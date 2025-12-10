[![npm version](https://img.shields.io/npm/v/@itrocks/action-request?logo=npm)](https://www.npmjs.org/package/@itrocks/action-request)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/action-request)](https://www.npmjs.org/package/@itrocks/action-request)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/action-request?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/action-request)
[![issues](https://img.shields.io/github/issues/itrocks-ts/action-request)](https://github.com/itrocks-ts/action-request/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# action-request

Domain-oriented action request with path decoding, business object preloading, and action extracting.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/action-request
```

## Usage

`@itrocks/action-request` sits between your HTTP layer
([`@itrocks/request-response`](https://github.com/itrocks-ts/request-response))
and your domain actions ([`@itrocks/action`](https://github.com/itrocks-ts/action)).

It takes a low‑level `Request` (method, path, headers, body…) and turns it into
an **action‑oriented request** that knows:

- which **route** is targeted (e.g. `'/user'`),
- which **action name** to execute on this route (e.g. `'list'`, `'edit'`, `'delete'`),
- which **format** is expected (`'html'`, `'json'`, …),
- which **object IDs** are referenced in the URL,
- how to **load the corresponding business objects** through
  [`@itrocks/storage`](https://github.com/itrocks-ts/storage).

You rarely build `Request` instances by hand. Instead, your framework adapter
creates one from the raw HTTP request and passes it down to your actions.

### Minimal example with `@itrocks/framework`

The `@itrocks/framework` package already wires everything for you:

```ts
import { run } from '@itrocks/framework'

run()
```

Internally it does (simplified):

```ts
import { Request as ServerRequest } from '@itrocks/request-response'
import { Request as ActionRequest } from '@itrocks/action-request'
import { routes, loadRoutes }      from '@itrocks/route'
import { actionRequestDependsOn }  from '@itrocks/action-request'

await loadRoutes(routes, config.routes)

// Tell action-request how to resolve modules from a route string
actionRequestDependsOn({ getModule: routes.resolve.bind(routes) })

async function execute (serverRequest: ServerRequest) {
  const request = new ActionRequest(serverRequest)

  // request.route, request.action, request.format, request.ids...
  // are now filled based on the URL/path

  const module = routes.resolve(request.route + '/' + request.action)
  // Call the correct action / format method with this request
}
```

In most applications you only interact with `ActionRequest` inside actions,
for example to access IDs or to preload business objects.

### Using `Request` inside an action

```ts
import { Action } from '@itrocks/action'
import type { Request } from '@itrocks/action-request'

class User {
  /* ... */
}

export class ShowUser extends Action<User> {
  async html (request: Request<User>) {
    const [user] = await request.getObjects()
    if (!user) {
      // build an error HtmlResponse here
    }

    // build an HtmlResponse showing this user
  }
}
```

The `Request<User>` instance passed to your action already knows which IDs to
load (from the path) and can give you the corresponding `Entity<User>`
instances via `getObject()` / `getObjects()`.

## API

### `class Request<T extends object = object>`

Wrapper around [`@itrocks/request-response`'s `Request`](https://github.com/itrocks-ts/request-response)
that adds routing and domain‑specific information.

```ts
import type { Request as ServerRequest } from '@itrocks/request-response'
import { Request as ActionRequest }      from '@itrocks/action-request'

const actionRequest = new ActionRequest(serverRequest)
```

#### Constructor

```ts
// new Request(request: ServerRequest)
```

Parameters:

- `request: ServerRequest` – low‑level request coming from
  `@itrocks/request-response`.

On construction, the path is parsed to fill `route`, `action`, `format` and
`ids`, according to the conventions supported by this package.

#### Properties

- `action: string` – Name of the action to call on the resolved module
  (for example `'list'`, `'edit'`, `'delete'`, `'new'`, ...).
- `format: string` – Output format to use; typically matches a method on the
  action (for example `'html'` or `'json'`).
- `ids: string[]` – IDs extracted from the path (for example primary keys of
  the objects to load).
- `request: ServerRequest` – Underlying HTTP‑level request from
  `@itrocks/request-response`.
- `route: string` – Logical route of the request (for example `'/user'`).

#### Methods

##### `getObject(): Promise<Entity<T> | undefined>`

Loads and returns a single business object (wrapped as an
[`Entity<T>`](https://github.com/itrocks-ts/storage)) based on the IDs in the
request and the configured storage.

Returns `undefined` when no object can be found.

Typical usage:

```ts
const user = await request.getObject()
if (!user) {
  // handle "not found" case
}
```

##### `getObjects(): Promise<Entity<T>[]>`

Loads and returns all business objects referenced by the request IDs.

Useful for actions that operate on multiple entities at once (bulk delete,
batch update, export, etc.).

```ts
const users = await request.getObjects()
// process all users
```

##### `parsePath(): Partial<Request<T>>`

Parses the path of the underlying `ServerRequest` and returns a partial
description of the corresponding `Request` fields (route, action, format,
ids…). Normally you do not need to call this directly, as the constructor
invokes it for you.

##### `get type(): Type<T>`

Readonly getter returning the TypeScript/runtime
[`Type<T>`](https://github.com/itrocks-ts/class-type) of the business object
associated with this request.

This type is used by higher‑level libraries (like `@itrocks/framework` and
`@itrocks/action`) to infer stores, templates and other metadata.

### `formats`

The module re‑exports a `formats` object from `./formats`.

Its exact structure is implementation‑specific, but you can rely on it to know
which output formats are supported (for example to build a format switcher in a
UI or to debug available formats).

Example:

```ts
import { formats } from '@itrocks/action-request'

console.log(Object.keys(formats))
// e.g. [ 'html', 'json', ... ]
```

### `actionRequestDependsOn(dependencies)`

```ts
import { actionRequestDependsOn } from '@itrocks/action-request'
import { routes }                 from '@itrocks/route'

actionRequestDependsOn({
  getModule: routes.resolve.bind(routes)
})
```

Configures external dependencies used by `@itrocks/action-request`.

Parameters (partial object):

- `getModule: (route: string) => Function | Type | undefined` – callback used
  to resolve a route string (like `'/user/edit'`) into an actual module,
  function or class. A typical implementation delegates to the global
  `routes.resolve()` from `@itrocks/route`.

You usually call `actionRequestDependsOn` once at application startup (for
example in your framework bootstrap), before constructing any `Request`
instance.

## Typical use cases

- Decode a raw HTTP path (e.g. `/user/list.html/1,2,3`) into a high‑level
  request with `route`, `action`, `format` and `ids`.
- Preload one or several business objects from
  [`@itrocks/storage`](https://github.com/itrocks-ts/storage) before an
  action is executed.
- Share the same action‑oriented `Request` abstraction between multiple
  frameworks or server implementations while keeping routing and storage logic
  in one place.
- Integrate with `@itrocks/framework` and `@itrocks/route` to build fully
  declarative, domain‑driven back‑office or business applications.
