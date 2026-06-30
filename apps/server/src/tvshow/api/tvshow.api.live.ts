import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { TvShowCatalog } from "../application/tvshow.catalog.js";
import { toApiError } from "./api.errors.js";
import { friendMediaPicksApi } from "./tvshow.api.js";
import { toTvShowApiResponse, toTvShowsApiResponse } from "./tvshow.mappers.js";

export const healthApiLive = HttpApiBuilder.group(friendMediaPicksApi, "Health", (handlers) =>
  handlers
    .handle("getRoot", () => Effect.succeed("Friend Media Picks API"))
    .handle("getHealth", () => Effect.succeed({ status: "ok" as const })),
);

export const tvShowsApiLive = HttpApiBuilder.group(friendMediaPicksApi, "TV Shows", (handlers) =>
  handlers
    .handle("getTvShows", () =>
      Effect.gen(function* () {
        const tvShowCatalog = yield* TvShowCatalog;
        const tvShows = yield* tvShowCatalog.list();

        return toTvShowsApiResponse(tvShows);
      }).pipe(Effect.mapError(toApiError)),
    )
    .handle("getTvShowById", ({ path }) =>
      Effect.gen(function* () {
        const tvShowCatalog = yield* TvShowCatalog;
        const tvShow = yield* tvShowCatalog.getById(path.id);

        return toTvShowApiResponse(tvShow);
      }).pipe(Effect.mapError(toApiError)),
    )
    .handle("createTvShow", ({ payload }) =>
      Effect.gen(function* () {
        const tvShowCatalog = yield* TvShowCatalog;
        const tvShow = yield* tvShowCatalog.add(payload);

        return toTvShowApiResponse(tvShow);
      }).pipe(Effect.mapError(toApiError)),
    ),
);
