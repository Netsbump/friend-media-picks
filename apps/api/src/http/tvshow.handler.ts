import { Effect } from "effect";
import * as Schema from "effect/Schema";
import { TvShowService } from "../application/tvshow.service.js";
import type { TvShow } from "../domain/tvshow.js";
import { SchemaValidationError } from "./errors/schema-validation-error.js";

const personSchema = Schema.Struct({
  firstName: Schema.String,
  lastName: Schema.String,
});

const genreSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
});

const createTvShowSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  episodes: Schema.Number,
  releaseAt: Schema.DateFromString,
  directors: Schema.Array(personSchema),
  writers: Schema.Array(personSchema),
  stars: Schema.Array(personSchema),
  genres: Schema.Array(genreSchema),
});

const idSchema = Schema.Struct({
  id: Schema.String,
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
  const decodedInput = Schema.decodeUnknown(idSchema)({ id });

  return decodedInput.pipe(
    Effect.mapError((error) => {
      return new SchemaValidationError({
        details: error.message,
      });
    }),
  );
};

const mapToClientShape = (tvShow: TvShow): TvShow => tvShow;

export const createTvShowHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedTvShow = yield* decodeCreateTvShowRequest(input);

    const tvShowService = yield* TvShowService;

    const tvShow = yield* tvShowService.create(parsedTvShow);

    return mapToClientShape(tvShow);
  });

export const getTvShowHandler = (id: string) =>
  Effect.gen(function* () {
    const parsedId = yield* decodeTvShowIdParam(id);

    const tvShowService = yield* TvShowService;

    const tvShow = yield* tvShowService.getOne(parsedId.id);

    return mapToClientShape(tvShow);
  });

export const getTvShowsHandler = () =>
  Effect.gen(function* () {
    const tvShowService = yield* TvShowService;

    return yield* tvShowService.getAll();
  });
