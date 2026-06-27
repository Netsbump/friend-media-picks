import { Context, Effect, Layer } from "effect";
import type { SqlError } from "@effect/sql/SqlError";
import { createDrizzleDbClient, type Database } from "./db.client.js";
import { EnvConfig } from "../config/env.service.js";
import type { EnvError } from "../config/env.config.js";

export type DbClientShape = {
  db: Database;
};

export class DbClient extends Context.Tag("DbClient")<DbClient, DbClientShape>() {}

export const DbClientLive: Layer.Layer<DbClient, SqlError | EnvError, EnvConfig> = Layer.effect(
  DbClient,
  Effect.gen(function* () {
    const { env } = yield* EnvConfig;
    yield* Effect.logInfo(
      `[BOOT] Creating DB client for ${env.postgres.host}:${env.postgres.port}`,
    );
    const db = yield* createDrizzleDbClient(env.databaseUrl);
    yield* Effect.logInfo("[BOOT] Drizzle DB client ready");

    return { db };
  }),
);
