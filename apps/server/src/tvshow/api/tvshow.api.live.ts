import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { TvShowCatalog } from "../application/tvshow.catalog.js";
import { toApiError } from "./api.errors.js";
import { friendMediaPicksApi } from "./tvshow.api.js";
import { toTvShowResponse, toTvShowsResponse } from "./tvshow.mappers.js";
import type { TvShowCreation } from "../domain/tvshow.js";
import type { CreateTvShowInput } from "./tvshow.api.schemas.js";

export const healthApiLive = HttpApiBuilder.group(friendMediaPicksApi, "Health", (handlers) =>
  handlers
    .handle("getRoot", () => Effect.succeed("Friend Media Picks API"))
    .handle("getHealth", () => Effect.succeed({ status: "ok" as const })),
);

const toTvShowCreation = (input: CreateTvShowInput): TvShowCreation => input;

export const tvShowsApiLive = HttpApiBuilder.group(friendMediaPicksApi, "TV Shows", (handlers) =>
  handlers
    .handle("getTvShows", () =>
      Effect.gen(function* () {
        const tvShowCatalog = yield* TvShowCatalog;

        const tvShows = yield* tvShowCatalog.list();

        return toTvShowsResponse(tvShows);
      }).pipe(Effect.mapError(toApiError)),
    )
    .handle("getTvShowById", ({ path }) =>
      Effect.gen(function* () {
        const tvShowCatalog = yield* TvShowCatalog;

        const tvShow = yield* tvShowCatalog.getById(path.id);

        return toTvShowResponse(tvShow);
      }).pipe(Effect.mapError(toApiError)),
    )
    .handle("createTvShow", ({ payload }) =>
      Effect.gen(function* () {
        const tvShowCatalog = yield* TvShowCatalog;

        const tvShowCreation = toTvShowCreation(payload);

        const tvShow = yield* tvShowCatalog.add(tvShowCreation);

        return toTvShowResponse(tvShow);
      }).pipe(Effect.mapError(toApiError)),
    ),
);
