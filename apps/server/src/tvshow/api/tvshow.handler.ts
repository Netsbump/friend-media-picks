import { Data, Effect } from "effect";
import * as Schema from "effect/Schema";
import { TvShowCatalog } from "../application/tvshow.catalog.js";
import { toApiError } from "./api.errors.js";
import { CreateTvShowInput, TvShowIdPathParams } from "./tvshow.api.schemas.js";
import { toTvShowApiResponse, toTvShowsApiResponse } from "./tvshow.mappers.js";

export class SchemaValidationError extends Data.TaggedError("SchemaValidationError")<{
  details: string;
}> {}

const decodeCreateTvShowRequest = (
  input: unknown,
): Effect.Effect<CreateTvShowInput, SchemaValidationError> =>
  Schema.decodeUnknown(CreateTvShowInput)(input).pipe(
    Effect.mapError((error) => new SchemaValidationError({ details: error.message })),
  );

const decodeTvShowIdParam = (
  id: string,
): Effect.Effect<TvShowIdPathParams, SchemaValidationError> =>
  Schema.decodeUnknown(TvShowIdPathParams)({ id }).pipe(
    Effect.mapError((error) => new SchemaValidationError({ details: error.message })),
  );

export const createTvShowHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedTvShow = yield* decodeCreateTvShowRequest(input);

    const tvShowCatalog = yield* TvShowCatalog;

    const tvShow = yield* tvShowCatalog.add(parsedTvShow);

    return toTvShowApiResponse(tvShow);
  }).pipe(Effect.mapError(toApiError));

export const getTvShowHandler = (id: string) =>
  Effect.gen(function* () {
    const parsedId = yield* decodeTvShowIdParam(id);

    const tvShowCatalog = yield* TvShowCatalog;

    const tvShow = yield* tvShowCatalog.getById(parsedId.id);

    return toTvShowApiResponse(tvShow);
  }).pipe(Effect.mapError(toApiError));

export const getTvShowsHandler = () =>
  Effect.gen(function* () {
    const tvShowCatalog = yield* TvShowCatalog;

    const tvShows = yield* tvShowCatalog.list();

    return toTvShowsApiResponse(tvShows);
  }).pipe(Effect.mapError(toApiError));
