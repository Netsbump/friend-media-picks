import type { Kyselify } from "drizzle-orm/kysely";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { env } from "../../../config/env.config.js";
import { series } from "../serie.schema.js";
import { Data, Effect } from "effect";

export type Database = {
  series: Kyselify<typeof series>;
};

const CONNECTION_STRING = "CONNECTION_STRING";

export class ConnectionStringError extends Data.TaggedError(
  "ConnectionStringError",
)<{
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

export const makeDb = (connectionString = env.databaseUrl) =>
  Effect.gen(function* () {
    const validConnectionString =
      yield* validateConnectionString(connectionString);

    return new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: validConnectionString,
        }),
      }),
    });
  });
