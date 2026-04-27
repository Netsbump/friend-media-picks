import type { Kyselify } from "drizzle-orm/kysely";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { env } from "../../../config/env.config.js";
import { series } from "./schema.js";

export type Database = {
  series: Kyselify<typeof series>;
};

export const makeDb = (connectionString = env.databaseUrl) => {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Postgres client");
  }

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
      }),
    }),
  });
};
