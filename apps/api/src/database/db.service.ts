import { Context, Effect, Layer } from "effect";
import type { SqlError } from "@effect/sql/SqlError";
import { makeDrizzleDb, makePgClientLayer, type Database } from "./db.client.js";
import { EnvConfig } from "../runtime/env.service.js";
import type { EnvError } from "../runtime/env.config.js";

export type DbClientShape = {
  db: Database;
};

export class DbClient extends Context.Tag("DbClient")<DbClient, DbClientShape>() {}

export const DbClientLive: Layer.Layer<DbClient, SqlError | EnvError, EnvConfig> =
  Layer.unwrapEffect(
    Effect.gen(function* () {
      const { env } = yield* EnvConfig;
      yield* Effect.logInfo(
        `[STARTUP] Creating DB client for ${env.postgres.host}:${env.postgres.port}`,
      );

      const pgClientLayer = makePgClientLayer(env.databaseUrl);

      yield* Effect.logInfo("[STARTUP] Effect Postgres client layer created");

      return Layer.effect(
        DbClient,
        Effect.gen(function* () {
          const db = yield* makeDrizzleDb();
          yield* Effect.logInfo("[STARTUP] Drizzle DB client ready");

          return { db };
        }),
      ).pipe(Layer.provide(pgClientLayer));
    }),
  );
