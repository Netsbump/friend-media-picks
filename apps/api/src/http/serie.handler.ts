import { Effect } from "effect";
import * as Schema from "effect/Schema";
import { SerieService } from "../application/serie.service.js";
import type { Serie } from "../domain/serie.js";
import { SchemaValidationError } from "./errors/schema-validation-error.js";

const decodeOrValidationError =
  <Output, Input>(schema: Schema.Schema<Output, Input>) =>
  (input: unknown) =>
    Schema.decodeUnknown(schema)(input).pipe(
      Effect.mapError((error) => new SchemaValidationError({ details: error.message })),
    );

const createSerieSchema = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  producer: Schema.String,
  releaseAt: Schema.DateFromString,
});

const decodeCreateSerieRequest = decodeOrValidationError(createSerieSchema);

const mapToClientShape = (serie: Serie): Serie => serie;

export const createSerieHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedSerie = yield* decodeCreateSerieRequest(input);

    const serieService = yield* SerieService;

    const serie = yield* serieService.create(parsedSerie);

    return mapToClientShape(serie);
  });

const getSerieSchema = Schema.Struct({
  id: Schema.String,
});

const decodeSerieIdParam = (id: string) => decodeOrValidationError(getSerieSchema)({ id });

export const getSerieHandler = (id: string) =>
  Effect.gen(function* () {
    const parsedId = yield* decodeSerieIdParam(id);

    const serieService = yield* SerieService;

    const serie = yield* serieService.getById(parsedId.id);

    return mapToClientShape(serie);
  });
