import { defineConfig } from "drizzle-kit";

import { env } from "./env.config.js";

export default defineConfig({
  out: "./src/infrastructure/database/migrations",
  schema: "./src/infrastructure/**/*.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.databaseUrl,
  },
  verbose: true,
  strict: true,
});
