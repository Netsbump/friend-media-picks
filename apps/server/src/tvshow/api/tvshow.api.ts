import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "@effect/platform";
import {
  BadRequestApiError,
  DomainApiError,
  InternalApiError,
  NotFoundApiError,
} from "./api.errors.js";
import {
  CreatedTvShowApiResponse,
  CreateTvShowInput,
  HealthResponse,
  TvShowIdPathParams,
  TvShowApiResponse,
  TvShowsApiResponse,
} from "./tvshow.api.schemas.js";

const RootResponse = HttpApiSchema.Text().annotations({ description: "API landing text." });

const healthGroup = HttpApiGroup.make("Health")
  .add(HttpApiEndpoint.get("getRoot", "/").addSuccess(RootResponse))
  .add(HttpApiEndpoint.get("getHealth", "/health").addSuccess(HealthResponse));

const tvShowsGroup = HttpApiGroup.make("TV Shows")
  .add(HttpApiEndpoint.get("getTvShows", "/tvshows").addSuccess(TvShowsApiResponse))
  .add(
    HttpApiEndpoint.get("getTvShowById", "/tvshows/:id")
      .setPath(TvShowIdPathParams)
      .addSuccess(TvShowApiResponse),
  )
  .add(
    HttpApiEndpoint.post("createTvShow", "/tvshows")
      .setPayload(CreateTvShowInput)
      .addSuccess(CreatedTvShowApiResponse),
  )
  .addError(BadRequestApiError)
  .addError(NotFoundApiError)
  .addError(DomainApiError)
  .addError(InternalApiError);

export const friendMediaPicksApi = HttpApi.make("friendMediaPicksApi")
  .add(healthGroup)
  .add(tvShowsGroup)
  .annotate(OpenApi.Description, "API for creating and reading friend media picks.")
  .annotate(OpenApi.Servers, [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ])
  .annotate(OpenApi.Override, {
    info: {
      title: "Friend Media Picks API",
      version: "1.0.0",
    },
  });

export type FriendMediaPicksApi = typeof friendMediaPicksApi;
