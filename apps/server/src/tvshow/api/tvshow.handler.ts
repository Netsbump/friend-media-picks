import { Data, Effect } from "effect";
import * as Schema from "effect/Schema";
import { TvShowCatalog } from "../application/tvshow.catalog.js";
import { GenreInput, PersonInput, TvShowIdPathParams } from "./tvshow.api.schemas.js";
import { toTvShowApiResponse, toTvShowsApiResponse } from "./tvshow.mappers.js";

export class SchemaValidationError extends Data.TaggedError("SchemaValidationError")<{
  details: string;
}> {}

const createTvShowSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  episodes: Schema.Number,
  releaseAt: Schema.DateFromString,
  directors: Schema.Array(PersonInput),
  writers: Schema.Array(PersonInput),
  stars: Schema.Array(PersonInput),
  genres: Schema.Array(GenreInput),
});

const decodeCreateTvShowRequest = (input: unknown) => {
  const decodedInput = Schema.decodeUnknown(createTvShowSchema)(input);

  return decodedInput.pipe(
    Effect.mapError((error) => {
      return new SchemaValidationError({
        details: error.message,
      });
    }),
  );
};

const decodeTvShowIdParam = (id: string) => {
  const decodedInput = Schema.decodeUnknown(TvShowIdPathParams)({ id });

  return decodedInput.pipe(
    Effect.mapError((error) => {
      return new SchemaValidationError({
        details: error.message,
      });
    }),
  );
};

export const createTvShowHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedTvShow = yield* decodeCreateTvShowRequest(input);

    const tvShowCatalog = yield* TvShowCatalog;

    const tvShow = yield* tvShowCatalog.add(parsedTvShow);

    return toTvShowApiResponse(tvShow);
  });

export const getTvShowHandler = (id: string) =>
  Effect.gen(function* () {
    const parsedId = yield* decodeTvShowIdParam(id);

    const tvShowCatalog = yield* TvShowCatalog;

    const tvShow = yield* tvShowCatalog.getById(parsedId.id);

    return toTvShowApiResponse(tvShow);
  });

export const getTvShowsHandler = () =>
  Effect.gen(function* () {
    const tvShowCatalog = yield* TvShowCatalog;

    const tvShows = yield* tvShowCatalog.list();

    return toTvShowsApiResponse(tvShows);
  });
