import { defineConfig } from "drizzle-kit";

import { env } from "./env.config.js";

export default defineConfig({
  out: "./src/infra/database/migrations",
  schema: "./src/infra/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.databaseUrl,
  },
  verbose: true,
  strict: true,
});
