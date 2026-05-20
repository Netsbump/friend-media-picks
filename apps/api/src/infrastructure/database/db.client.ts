import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Data, Effect } from "effect";
import type { DbSchema } from "./db.schema.js";

export type Database = ReturnType<typeof drizzle<DbSchema>>;

const CONNECTION_STRING = "CONNECTION_STRING";

export class ConnectionStringError extends Data.TaggedError("ConnectionStringError")<{
  code: typeof CONNECTION_STRING;
  message: string;
}> {}

const validateConnectionString = (
  connectionString: string,
): Effect.Effect<string, ConnectionStringError> =>
  connectionString
    ? Effect.succeed(connectionString)
    : Effect.fail(
        new ConnectionStringError({
          code: CONNECTION_STRING,
          message: "DATABASE_URL is required to create the Postgres Client",
        }),
      );

export const createDrizzleDbClient = (connectionString: string) =>
  Effect.gen(function* () {
    const validConnectionString = yield* validateConnectionString(connectionString);

    const pool = new Pool({
      connectionString: validConnectionString,
    });

    return drizzle<DbSchema>(pool);
  });
