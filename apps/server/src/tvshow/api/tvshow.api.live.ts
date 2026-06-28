import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { mapToPublicApiError } from "./api.errors.js";
import { friendMediaPicksApi } from "./tvshow.api.js";
import { createTvShowHandler, getTvShowHandler, getTvShowsHandler } from "./tvshow.handler.js";

const withPublicApiError = <A, R>(effect: Effect.Effect<A, unknown, R>) =>
  effect.pipe(Effect.mapError(mapToPublicApiError));

export const healthApiLive = HttpApiBuilder.group(friendMediaPicksApi, "Health", (handlers) =>
  handlers
    .handle("getRoot", () => Effect.succeed("Friend Media Picks API"))
    .handle("getHealth", () => Effect.succeed({ status: "ok" as const })),
);

export const tvShowsApiLive = HttpApiBuilder.group(friendMediaPicksApi, "TV Shows", (handlers) =>
  handlers
    .handle("getTvShows", () => withPublicApiError(getTvShowsHandler()))
    .handle("getTvShowById", ({ path: { id } }) => withPublicApiError(getTvShowHandler(id)))
    .handle("createTvShow", ({ payload }) => withPublicApiError(createTvShowHandler(payload))),
);
