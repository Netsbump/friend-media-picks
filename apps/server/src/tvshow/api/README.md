# TV Show API

This folder contains the HTTP/API boundary for the TV show feature.

The API contract is declared with Effect `HttpApi`. Runtime handlers are attached with `HttpApiBuilder`, and the same contract is used to expose OpenAPI and Scalar documentation.

## Files

| File                    | Role                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `tvshow.api.ts`         | Public API contract: endpoint names, methods, paths, payload schemas, success responses, error responses, OpenAPI metadata. |
| `tvshow.api.schemas.ts` | Request, response, and path schemas used by the API contract and handlers.                                                  |
| `tvshow.api.live.ts`    | Runtime wiring between the API contract and handler functions.                                                              |
| `tvshow.handler.ts`     | HTTP-facing feature handlers. They prepare input and call the application service.                                          |
| `tvshow.mappers.ts`     | Maps domain entities to API response objects.                                                                               |
| `api.errors.ts`         | Maps internal failures to public typed HTTP API errors.                                                                     |

## Contract And Live

`tvshow.api.ts` is the HTTP interface for this feature. It describes what the API exposes, but it does not run the feature logic itself.

`tvshow.api.live.ts` is the runtime implementation of that interface. It tells Effect which handler function should run for each declared endpoint.

This follows the same idea as the rest of the codebase: define the contract first, then provide a live implementation.

## HttpApi Inputs

Effect `HttpApi` separates the different parts of an HTTP request:

| Input       | Meaning                        | Example                               |
| ----------- | ------------------------------ | ------------------------------------- |
| `payload`   | Request body                   | `POST /tvshows` with a JSON body      |
| `path`      | Path parameters from the route | `/tvshows/:id` gives `{ id }`         |
| `urlParams` | Query string parameters        | `/tvshows?page=1`                     |
| `headers`   | HTTP headers                   | `authorization`, `content-type`, etc. |

In this API:

- `CreateTvShowRequest` is used as the `payload` schema for `POST /tvshows`.
- `TvShowIdPathParams` is used as the `path` schema for `GET /tvshows/:id`.

## Startup Wiring

`main.ts` builds the server by combining the API contract, endpoint implementations, OpenAPI, Scalar, and application dependencies.

```mermaid
flowchart TD
  Main[main.ts]
  ApiContract[tvshow.api.ts<br/>friendMediaPicksApi]
  ApiLive[tvshow.api.live.ts<br/>healthApiLive + tvShowsApiLive]
  AppLive[runtime/app.layer.ts<br/>application dependencies]
  OpenApi[HttpApiBuilder.middlewareOpenApi<br/>GET /openapi.json]
  Scalar[HttpApiScalar.layerCdn<br/>GET /docs]
  Server[HttpApiBuilder.serve]
  Node[Node HTTP server]

  Main --> ApiContract
  Main --> ApiLive
  Main --> AppLive
  Main --> OpenApi
  Main --> Scalar
  ApiContract --> Server
  ApiLive --> Server
  AppLive --> Server
  OpenApi --> Server
  Scalar --> Server
  Server --> Node
```

## Successful Read Request

Example: `GET /tvshows`.

```mermaid
sequenceDiagram
  participant Client
  participant Server as HttpApiBuilder
  participant Live as tvshow.api.live.ts
  participant Handler as tvshow.handler.ts
  participant Catalog as TvShowCatalog
  participant Repo as Repository
  participant Mapper as tvshow.mappers.ts

  Client->>Server: GET /tvshows
  Server->>Live: call getTvShows endpoint
  Live->>Handler: getTvShowsHandler()
  Handler->>Catalog: list()
  Catalog->>Repo: find all TV shows
  Repo-->>Catalog: domain TV shows
  Catalog-->>Handler: domain TV shows
  Handler->>Mapper: toTvShowsApiResponse(...)
  Mapper-->>Handler: API response objects
  Handler-->>Live: TV show response array
  Live-->>Server: success value
  Server-->>Client: 200 application/json
```

## Successful Create Request

Example: `POST /tvshows`.

```mermaid
sequenceDiagram
  participant Client
  participant Server as HttpApiBuilder
  participant Schema as tvshow.api.schemas.ts
  participant Live as tvshow.api.live.ts
  participant Handler as tvshow.handler.ts
  participant Catalog as TvShowCatalog
  participant Repo as Repository
  participant Mapper as tvshow.mappers.ts

  Client->>Server: POST /tvshows with JSON body
  Server->>Schema: decode CreateTvShowRequest
  Schema-->>Server: typed payload
  Server->>Live: call createTvShow endpoint
  Live->>Handler: createTvShowHandler(payload)
  Handler->>Handler: decode releaseAt as Date
  Handler->>Catalog: add(parsed input)
  Catalog->>Repo: save TV show
  Repo-->>Catalog: saved domain TV show
  Catalog-->>Handler: domain TV show
  Handler->>Mapper: toTvShowApiResponse(...)
  Mapper-->>Handler: API response object
  Handler-->>Live: created TV show
  Live-->>Server: success value
  Server-->>Client: 201 application/json
```

## Error Request

Errors stay as typed Effect failures until `HttpApiBuilder` encodes them as HTTP responses.

```mermaid
sequenceDiagram
  participant Client
  participant Server as HttpApiBuilder
  participant Live as tvshow.api.live.ts
  participant Handler as tvshow.handler.ts
  participant Service as Catalog / Repository / Domain
  participant Errors as api.errors.ts

  Client->>Server: HTTP request
  Server->>Live: call endpoint implementation
  Live->>Handler: call handler
  Handler->>Service: call application logic
  Service-->>Handler: fails with internal error
  Handler-->>Live: Effect failure
  Live->>Errors: mapToPublicApiError(error)
  Errors-->>Live: typed public API error
  Live-->>Server: BadRequest / NotFound / Domain / Internal error
  Server-->>Client: encoded HTTP error response
```

Public API errors are declared in `tvshow.api.ts` with `.addError(...)`, so `HttpApiBuilder` knows their status code and response shape.

## Documentation Request

`/docs` serves Scalar. Scalar reads the generated OpenAPI document from `/openapi.json`.

```mermaid
sequenceDiagram
  participant Browser
  participant Server as HttpApiBuilder
  participant Scalar as HttpApiScalar
  participant OpenAPI as middlewareOpenApi
  participant Contract as tvshow.api.ts

  Browser->>Server: GET /docs
  Server->>Scalar: serve Scalar HTML
  Scalar-->>Browser: documentation UI
  Browser->>Server: GET /openapi.json
  Server->>OpenAPI: generate spec
  OpenAPI->>Contract: read API contract + schemas + errors
  Contract-->>OpenAPI: API description
  OpenAPI-->>Browser: OpenAPI JSON
```
