import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { friendMediaPicksApi } from "./tvshow.api.js";
import { createTvShowHandler, getTvShowHandler, getTvShowsHandler } from "./tvshow.handler.js";

export const healthApiLive = HttpApiBuilder.group(friendMediaPicksApi, "Health", (handlers) =>
  handlers
    .handle("getRoot", () => Effect.succeed("Friend Media Picks API"))
    .handle("getHealth", () => Effect.succeed({ status: "ok" as const })),
);

export const tvShowsApiLive = HttpApiBuilder.group(friendMediaPicksApi, "TV Shows", (handlers) =>
  handlers
    .handle("getTvShows", () => getTvShowsHandler())
    .handle("getTvShowById", ({ path: { id } }) => getTvShowHandler(id))
    .handle("createTvShow", ({ payload }) => createTvShowHandler(payload)),
);
