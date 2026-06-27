import { HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";

import { SerieRepositoryLive } from "./infrastructure/serie.repository.drizzle.js";
import { TvShowRepositoryLive } from "./infrastructure/tvshow.repository.drizzle.js";
import { DbClientLive } from "./database/db.service.js";
import { EnvConfigLive } from "./runtime/env.service.js";
import { SerieServiceLive } from "./application/serie.service.live.js";
import { TvShowServiceLive } from "./application/tvshow.service.live.js";
import { app } from "./api/app.js";

const port = Number(process.env.API_PORT ?? 3000);

const DbLive = Layer.provide(DbClientLive, EnvConfigLive);
const SerieLive = Layer.provide(SerieRepositoryLive, DbLive);
const SerieServiceAppLive = Layer.provide(SerieServiceLive, SerieLive);
const TvShowLive = Layer.provide(TvShowRepositoryLive, DbLive);
const TvShowServiceAppLive = Layer.provide(TvShowServiceLive, TvShowLive);
const AppLive = Layer.mergeAll(SerieServiceAppLive, TvShowServiceAppLive);

const bootLogs = Effect.gen(function* () {
  yield* Effect.logInfo(`[BOOT] Starting API on port ${port}`);
  yield* Effect.logInfo("[BOOT] App layer graph configured");
  yield* Effect.logInfo("[BOOT] DB and repository layers initialize lazily on first use");
});

const providedApp = app.pipe(Effect.provide(AppLive));

const serverLayer = HttpServer.serve(providedApp).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port })),
);

NodeRuntime.runMain(bootLogs.pipe(Effect.andThen(Layer.launch(serverLayer))));
