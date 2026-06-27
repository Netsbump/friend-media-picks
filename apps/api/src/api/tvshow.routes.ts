import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { createTvShowHandler, getTvShowHandler, getTvShowsHandler } from "./tvshow.handler.js";
import { catchApiErrors } from "./errors/api-error-handler.js";

const createTvShowRoute = Effect.gen(function* () {
  const startedAt = Date.now();

  yield* Effect.logInfo("[HTTP] POST /tvshows start");

  const request = yield* HttpServerRequest.HttpServerRequest;
  const body = yield* request.json;

  const tvShow = yield* createTvShowHandler(body);

  yield* Effect.logInfo(`[HTTP] POST /tvshows success durationMs=${Date.now() - startedAt}`);

  return yield* HttpServerResponse.json(tvShow, { status: 201 });
}).pipe(catchApiErrors);

const getTvShowRoute = Effect.gen(function* () {
  const startedAt = Date.now();

  const params = yield* HttpRouter.params;

  const id = params.id;

  yield* Effect.logInfo(`[HTTP] GET /tvshows/:id start id=${id ?? "missing"}`);

  if (!id) {
    yield* Effect.logInfo(
      `[HTTP] GET /tvshows/:id bad-request durationMs=${Date.now() - startedAt}`,
    );
    return yield* HttpServerResponse.json({ error: "Missing id path param" }, { status: 400 });
  }

  const tvShow = yield* getTvShowHandler(id);

  yield* Effect.logInfo(
    `[HTTP] GET /tvshows/:id success id=${id} durationMs=${Date.now() - startedAt}`,
  );

  return yield* HttpServerResponse.json(tvShow, { status: 200 });
}).pipe(catchApiErrors);

const getTvShowsRoute = Effect.gen(function* () {
  const startedAt = Date.now();
  yield* Effect.logInfo("[HTTP] GET /tvshows start");

  const tvShows = yield* getTvShowsHandler();

  yield* Effect.logInfo(`[HTTP] GET /tvshows success durationMs=${Date.now() - startedAt}`);

  return yield* HttpServerResponse.json(tvShows, { status: 200 });
}).pipe(catchApiErrors);

export const tvShowRoutes = HttpRouter.empty.pipe(
  HttpRouter.get("/tvshows", getTvShowsRoute),
  HttpRouter.get("/tvshows/:id", getTvShowRoute),
  HttpRouter.post("/tvshows", createTvShowRoute),
);
