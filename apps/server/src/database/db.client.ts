import * as PgDrizzle from "drizzle-orm/effect-postgres";
import * as PgClient from "@effect/sql-pg/PgClient";
import type * as Effect from "effect/Effect";
import { Redacted } from "effect";
import { types } from "pg";
import type { DbSchema } from "./db.schema.js";

export type Database = Effect.Effect.Success<
  ReturnType<typeof PgDrizzle.makeWithDefaults<DbSchema>>
>;

const DRIZZLE_RAW_PG_TYPE_IDS = Object.values({
  timestamptz: 1184,
  timestamp: 1114,
  date: 1082,
  interval: 1186,
  numericArray: 1231,
  timestampArray: 1115,
  timestamptzArray: 1185,
  intervalArray: 1187,
  dateArray: 1182,
});

export const makePgClientLayer = (connectionString: string) =>
  PgClient.layer({
    url: Redacted.make(connectionString),
    types: {
      getTypeParser: (
        typeId: Parameters<typeof types.getTypeParser>[0],
        format?: Parameters<typeof types.getTypeParser>[1],
      ) => {
        if (DRIZZLE_RAW_PG_TYPE_IDS.includes(typeId)) {
          return (value: string) => value;
        }

        return types.getTypeParser(typeId, format);
      },
    },
  });

export const makeDrizzleDb = () => PgDrizzle.makeWithDefaults<DbSchema>();
