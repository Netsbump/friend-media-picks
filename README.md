# Friend Media Picks

Backend learning project built with Effect TS, exploring a functional programming approach with feature-based organization and clear separation of concerns.

## Tech Stack

- TypeScript
- Effect TS (`effect`, `@effect/platform`, `@effect/platform-node`)
- PostgreSQL
- Drizzle
- pnpm workspace

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker + Docker Compose

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Start PostgreSQL:

```bash
pnpm docker:up
```

3. Generate and apply database migrations:

```bash
pnpm --filter @friend-media-picks/server db:generate
pnpm --filter @friend-media-picks/server db:migrate
```

4. Start the server:

```bash
pnpm dev
```

## API Documentation

Start the server first and then interactive Scalar documentation is available at:

```txt
http://localhost:3000/docs
```

The generated OpenAPI document is available at:

```txt
http://localhost:3000/openapi.json
```

The OpenAPI document is generated from the Effect `HttpApi` contract declared in the server API layer.

## Useful Commands

- Start server in dev: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Start Docker services: `pnpm docker:up`
- Stop Docker services: `pnpm docker:down`
- DB migration generate: `pnpm --filter @friend-media-picks/server db:generate`
- DB migrate: `pnpm --filter @friend-media-picks/server db:migrate`
- DB Studio: `pnpm --filter @friend-media-picks/server db:studio`

## Vendored Sources for Agents

This repository vendors the Effect source code in `repos/effect` to improve coding-agent output quality.

- `repos/effect` is part of this repository (git subtree), so it is present after a normal clone.
- Update subtree when needed: `git subtree pull --prefix=repos/effect https://github.com/Effect-TS/effect.git main --squash`

Rules are documented in `AGENTS.md`.

## Troubleshooting

- If you get `SCHEMA_MISSING` or a missing table relation error like `relation "tv_shows" does not exist`, run:

```bash
pnpm --filter @friend-media-picks/server db:migrate
```

- If DB connection fails, check PostgreSQL is running and your `.env` values.

## Learning Notes

Additional learning documentation is available in `apps/docs/`:

- `apps/docs/README.md`: FP + Effect TS learning notes (French)
