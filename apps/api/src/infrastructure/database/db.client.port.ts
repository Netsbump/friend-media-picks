import { Context, Effect, Layer } from "effect";
import type { Kysely } from "kysely";
import { ConnectionStringError, makeDb, type Database } from "./kysely.js";

export type DbClientShape = {
  db: Kysely<Database>;
};

export class DbClient extends Context.Tag("DbClient")<
  DbClient,
  DbClientShape
>() {}

export const DbClientLive: Layer.Layer<DbClient, ConnectionStringError> =
  Layer.effect(DbClient, makeDb().pipe(Effect.map((db) => ({ db }))));
