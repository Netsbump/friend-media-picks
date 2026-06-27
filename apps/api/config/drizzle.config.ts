import { defineConfig } from "drizzle-kit";
import { Effect } from "effect";

import { loadEnv } from "../src/config/env.config.js";

// This file is used by Drizzle Kit CLI commands only (generate/migrate/studio).
// Runtime API database wiring is configured in src/database.
const env = Effect.runSync(loadEnv);

export default defineConfig({
  out: "./src/database/migrations",
  schema: "./src/database/schemas/**/*.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.databaseUrl,
  },
  verbose: true,
  strict: true,
});
