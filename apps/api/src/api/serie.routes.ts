import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { createSerieHandler, getSerieHandler } from "./serie.handler.js";
import { catchApiErrors } from "./errors/api-error-handler.js";

const createSerieRoute = Effect.gen(function* () {
  const startedAt = Date.now();
  yield* Effect.logInfo("[HTTP] POST /series start");
  const request = yield* HttpServerRequest.HttpServerRequest;
  const body = yield* request.json;

  const serie = yield* createSerieHandler(body);

  yield* Effect.logInfo(`[HTTP] POST /series success durationMs=${Date.now() - startedAt}`);

  return yield* HttpServerResponse.json(serie, { status: 201 });
}).pipe(catchApiErrors);

const getSerieRoute = Effect.gen(function* () {
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
}).pipe(catchApiErrors);

export const serieRoutes = HttpRouter.empty.pipe(
  HttpRouter.get("/series/:id", getSerieRoute),
  HttpRouter.post("/series", createSerieRoute),
);
