import { Effect } from "effect";

/**
 * Logs the main startup preparation steps before the API server is launched.
 */
export const makeStartupLogs = (port: number) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`[STARTUP] Preparing API runtime for port ${port}`);
    yield* Effect.logInfo("[STARTUP] App dependency graph configured");
    yield* Effect.logInfo("[STARTUP] DB and repository layers will initialize lazily on first use");
  });
