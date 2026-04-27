import { resolve } from "node:path";

import { config as loadEnv } from "@dotenvx/dotenvx";
import { z } from "zod";

const rootEnvPath = resolve(process.cwd(), "../../.env");
const apiEnvPath = resolve(process.cwd(), ".env");

loadEnv({
  path: [rootEnvPath, apiEnvPath],
  override: false,
  ignore: ["MISSING_ENV_FILE"],
  quiet: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("postgres"),
  POSTGRES_DB: z.string().default("friend_media_picks"),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_URL: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

const databaseUrl =
  parsed.DATABASE_URL ??
  `postgres://${parsed.POSTGRES_USER}:${parsed.POSTGRES_PASSWORD}@${parsed.POSTGRES_HOST}:${parsed.POSTGRES_PORT}/${parsed.POSTGRES_DB}`;

export const env = {
  nodeEnv: parsed.NODE_ENV,
  postgres: {
    user: parsed.POSTGRES_USER,
    password: parsed.POSTGRES_PASSWORD,
    db: parsed.POSTGRES_DB,
    host: parsed.POSTGRES_HOST,
    port: parsed.POSTGRES_PORT,
  },
  databaseUrl,
} as const;
