# Friend Media Picks

Backend learning project built with Effect TS and a Clean Architecture style, while keeping the codebase lightweight and avoiding unnecessary OOP boilerplate.

## Tech Stack

- TypeScript
- Effect TS (`effect`, `@effect/platform`, `@effect/platform-node`)
- PostgreSQL
- Kysely (query builder)
- Drizzle Kit (schema + migrations)
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
pnpm --filter @friend-media-picks/api db:generate
pnpm --filter @friend-media-picks/api db:migrate
```

4. Start the API:

```bash
pnpm dev
```

## Validate the API

Health check:

```bash
curl -i http://localhost:3000/health
```

Create a serie:

```bash
curl -X POST http://localhost:3000/series \
  -H "content-type: application/json" \
  -d '{"title":"Dark","description":"Sci-fi","seasons":3,"producer":"Netflix","releaseAt":"2017-12-01"}'
```

## Useful Commands

- Start API in dev: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Start Docker services: `pnpm docker:up`
- Stop Docker services: `pnpm docker:down`
- DB migration generate: `pnpm --filter @friend-media-picks/api db:generate`
- DB migrate: `pnpm --filter @friend-media-picks/api db:migrate`
- DB Studio: `pnpm --filter @friend-media-picks/api db:studio`

## Troubleshooting

- If you get `SCHEMA_MISSING` or `relation "series" does not exist`, run:

```bash
pnpm --filter @friend-media-picks/api db:migrate
```

- If DB connection fails, check PostgreSQL is running and your `.env` values.

## Learning Notes

Additional learning documentation is available in `apps/documentations/`:

- `apps/documentations/README.md`: FP + Effect TS learning notes (French)
- `apps/documentations/TODO.md`: implementation roadmap

Note: architecture visualization/generation in Markdown is planned and tracked in the TODO file.
