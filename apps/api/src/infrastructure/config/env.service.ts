import { Context, Effect, Layer } from "effect";
import { loadEnv, type Env, type EnvError } from "./env.config.js";

export type EnvConfigShape = {
  env: Env;
};

export class EnvConfig extends Context.Tag("EnvConfig")<EnvConfig, EnvConfigShape>() {}

export const EnvConfigLive: Layer.Layer<EnvConfig, EnvError> = Layer.effect(
  EnvConfig,
  loadEnv.pipe(
    Effect.tap(() => Effect.logInfo("[BOOT] Env config loaded")),
    Effect.map((env) => ({ env })),
  ),
);
