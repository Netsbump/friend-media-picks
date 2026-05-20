import { resolve } from "node:path";
import dotenv from "dotenv";
import { Data, Effect } from "effect";
import * as Schema from "effect/Schema";

// Resolve API environment file path.
const apiEnvPath = resolve(process.cwd(), ".env");

// Define an explicit typed error for environment loading/validation failures.
export class EnvError extends Data.TaggedError("EnvError")<{
  message: string;
}> {}

// Validate and normalize environment variables used by the API.
const envSchema = Schema.Struct({
  NODE_ENV: Schema.Literal("development", "test", "production"),
  DB_USER: Schema.String,
  DB_PASSWORD: Schema.String,
  DB_NAME: Schema.String,
  DB_HOST: Schema.String,
  DB_PORT: Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
});

// Load API-local variables used by the running API process.
const loadDotenv = Effect.sync(() => {
  dotenv.config({ path: apiEnvPath, override: true, quiet: true });
});

// Decode process.env and map parsing failures to a typed EnvError.
const parseEnv = () =>
  Schema.decodeUnknown(envSchema)(process.env).pipe(
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
  const parsed = yield* parseEnv();

  const databaseUrl = `postgres://${parsed.DB_USER}:${parsed.DB_PASSWORD}@${parsed.DB_HOST}:${parsed.DB_PORT}/${parsed.DB_NAME}`;

  return {
    nodeEnv: parsed.NODE_ENV,
    postgres: {
      user: parsed.DB_USER,
      password: parsed.DB_PASSWORD,
      db: parsed.DB_NAME,
      host: parsed.DB_HOST,
      port: parsed.DB_PORT,
    },
    databaseUrl,
  } as const;
});

export type Env = Effect.Effect.Success<typeof loadEnv>;
