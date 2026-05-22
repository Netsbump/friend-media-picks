import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";

import { SerieRepositoryLive } from "./infrastructure/serie.repository.drizzle.js";
import { withHttpErrors } from "./http/errors/http-error-handler.js";
import { DbClientLive } from "./infrastructure/database/db.service.js";
import { EnvConfigLive } from "./infrastructure/config/env.service.js";
import { createSerieHandler } from "./http/create-serie.handler.js";

const port = Number(process.env.API_PORT ?? 3000);

const createSerieRoute = withHttpErrors(
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const body = yield* request.json;

    const serie = yield* createSerieHandler(body);

    return yield* HttpServerResponse.json(serie, { status: 201 });
  }),
);

const DbLive = Layer.provide(DbClientLive, EnvConfigLive);
const SerieLive = Layer.provide(SerieRepositoryLive, DbLive);
const AppLive = SerieLive;

const bootLogs = Effect.gen(function* () {
  yield* Effect.logInfo(`[BOOT] Starting API on port ${port}`);
  yield* Effect.logInfo("[BOOT] App layer graph configured");
  yield* Effect.logInfo("[BOOT] DB and repository layers initialize lazily on first use");
});

const app = HttpRouter.empty.pipe(
  HttpRouter.get("/health", HttpServerResponse.json({ status: "ok" })),
  HttpRouter.get("/", HttpServerResponse.text("Friend Media Picks API")),
  HttpRouter.post("/series", createSerieRoute),
  Effect.provide(AppLive),
);

const serverLayer = HttpServer.serve(app).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port })),
);

NodeRuntime.runMain(bootLogs.pipe(Effect.andThen(Layer.launch(serverLayer))));
