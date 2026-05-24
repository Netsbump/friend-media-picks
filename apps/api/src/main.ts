import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";

import { SerieRepositoryLive } from "./infrastructure/serie.repository.drizzle.js";
import { withHttpErrors } from "./http/errors/http-error-handler.js";
import { DbClientLive } from "./infrastructure/database/db.service.js";
import { EnvConfigLive } from "./infrastructure/config/env.service.js";
import { createSerieHandler, getSerieHandler } from "./http/serie.handler.js";
import { SerieServiceLive } from "./application/serie.service.live.js";

const port = Number(process.env.API_PORT ?? 3000);

const createSerieRoute = withHttpErrors(
  Effect.gen(function* () {
    const startedAt = Date.now();
    yield* Effect.logInfo("[HTTP] POST /series start");
    const request = yield* HttpServerRequest.HttpServerRequest;
    const body = yield* request.json;

    const serie = yield* createSerieHandler(body);

    yield* Effect.logInfo(`[HTTP] POST /series success durationMs=${Date.now() - startedAt}`);

    return yield* HttpServerResponse.json(serie, { status: 201 });
  }),
);

const getSerieRoute = withHttpErrors(
  Effect.gen(function* () {
    const startedAt = Date.now();
    const params = yield* HttpRouter.params;
    const id = params.id;

    yield* Effect.logInfo(`[HTTP] GET /series/:id start id=${id ?? "missing"}`);

    if (!id) {
      yield* Effect.logInfo(
        `[HTTP] GET /series/:id bad-request durationMs=${Date.now() - startedAt}`,
      );
      return yield* HttpServerResponse.json({ error: "Missing id path param" }, { status: 400 });
    }

    const serie = yield* getSerieHandler(id);

    yield* Effect.logInfo(
      `[HTTP] GET /series/:id success id=${id} durationMs=${Date.now() - startedAt}`,
    );

    return yield* HttpServerResponse.json(serie, { status: 200 });
  }),
);

const DbLive = Layer.provide(DbClientLive, EnvConfigLive);
const SerieLive = Layer.provide(SerieRepositoryLive, DbLive);
const SerieServiceAppLive = Layer.provide(SerieServiceLive, SerieLive);
const AppLive = SerieServiceAppLive;

const bootLogs = Effect.gen(function* () {
  yield* Effect.logInfo(`[BOOT] Starting API on port ${port}`);
  yield* Effect.logInfo("[BOOT] App layer graph configured");
  yield* Effect.logInfo("[BOOT] DB and repository layers initialize lazily on first use");
});

const app = HttpRouter.empty.pipe(
  HttpRouter.get("/health", HttpServerResponse.json({ status: "ok" })),
  HttpRouter.get("/", HttpServerResponse.text("Friend Media Picks API")),
  HttpRouter.get("/series/:id", getSerieRoute),
  HttpRouter.post("/series", createSerieRoute),
  Effect.provide(AppLive),
);

const serverLayer = HttpServer.serve(app).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port })),
);

NodeRuntime.runMain(bootLogs.pipe(Effect.andThen(Layer.launch(serverLayer))));
