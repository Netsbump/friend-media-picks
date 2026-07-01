import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import type * as SqlClient from "@effect/sql/SqlClient";
import type { SqlError } from "@effect/sql/SqlError";
import { Effect, Layer } from "effect";
import { makePgClientLayer } from "./database.client.js";
import { EnvConfig } from "../runtime/env.service.js";
import type { EnvError } from "../runtime/env.config.js";

export const DatabaseLive: Layer.Layer<
  SqlClient.SqlClient | PgDrizzle.PgDrizzle,
  SqlError | EnvError,
  EnvConfig
> = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { env } = yield* EnvConfig;
    yield* Effect.logInfo(
      `[STARTUP] Creating DB client for ${env.postgres.host}:${env.postgres.port}`,
    );

    const pgClientLayer = makePgClientLayer(env.databaseUrl);
    const pgDrizzleLayer = PgDrizzle.layer.pipe(Layer.provide(pgClientLayer));

    yield* Effect.logInfo("[STARTUP] Effect Postgres client layer created");
    yield* Effect.logInfo("[STARTUP] Drizzle DB client layer created");

    return Layer.mergeAll(pgClientLayer, pgDrizzleLayer);
  }),
);
