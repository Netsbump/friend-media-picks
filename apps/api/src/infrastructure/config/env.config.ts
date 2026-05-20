import { resolve } from "node:path";
import dotenv from "dotenv";
import { Data, Effect } from "effect";
import * as Schema from "effect/Schema";

// Resolve environment files for workspace-level defaults and API-level overrides.
const rootEnvPath = resolve(process.cwd(), "../../.env");
const apiEnvPath = resolve(process.cwd(), ".env");

// Define an explicit typed error for environment loading/validation failures.
export class EnvError extends Data.TaggedError("EnvError")<{
  message: string;
}> {}

// Validate and normalize environment variables used by the API.
const envSchema = Schema.Struct({
  NODE_ENV: Schema.optionalWith(Schema.Literal("development", "production"), {
    default: () => "development",
  }),
  POSTGRES_USER: Schema.optionalWith(Schema.String, { default: () => "postgres" }),
  POSTGRES_PASSWORD: Schema.optionalWith(Schema.String, { default: () => "postgres" }),
  POSTGRES_DB: Schema.optionalWith(Schema.String, { default: () => "friend_media_picks" }),
  POSTGRES_HOST: Schema.optionalWith(Schema.String, { default: () => "localhost" }),
  POSTGRES_PORT: Schema.optionalWith(
    Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
    { default: () => 5435 },
  ),
  DATABASE_URL: Schema.optional(Schema.String),
});

// Load root variables first, then allow API-local values to override them.
const loadDotenv = Effect.sync(() => {
  dotenv.config({ path: rootEnvPath, override: false, quiet: true });
  dotenv.config({ path: apiEnvPath, override: true, quiet: true });
});

// Decode process.env and map parsing failures to a typed EnvError.
const parseEnv = Schema.decodeUnknown(envSchema)(process.env).pipe(
  Effect.mapError(
    (cause) =>
      new EnvError({
        message: `Invalid environment configuration: ${cause.message}`,
      }),
  ),
);

// Build a normalized immutable config object from validated inputs.
export const loadEnv = Effect.gen(function* () {
  yield* loadDotenv;
  const parsed = yield* parseEnv;

  const databaseUrl =
    parsed.DATABASE_URL ??
    `postgres://${parsed.POSTGRES_USER}:${parsed.POSTGRES_PASSWORD}@${parsed.POSTGRES_HOST}:${parsed.POSTGRES_PORT}/${parsed.POSTGRES_DB}`;

  return {
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
});

export type Env = Effect.Effect.Success<typeof loadEnv>;
