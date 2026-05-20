import { Context, Effect, Layer } from "effect";
import { createDrizzleDbClient, type ConnectionStringError, type Database } from "./db.client.js";
import { EnvConfig } from "../config/env.service.js";
import type { EnvError } from "../config/env.config.js";

export type DbClientShape = {
  db: Database;
};

export class DbClient extends Context.Tag("DbClient")<DbClient, DbClientShape>() {}

export const DbClientLive: Layer.Layer<DbClient, ConnectionStringError | EnvError, EnvConfig> =
  Layer.effect(
    DbClient,
    Effect.gen(function* () {
      const { env } = yield* EnvConfig;
      const db = yield* createDrizzleDbClient(env.databaseUrl);

      return { db };
    }),
  );
