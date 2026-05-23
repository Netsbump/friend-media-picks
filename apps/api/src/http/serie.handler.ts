import { Data, Effect } from "effect";
import * as Schema from "effect/Schema";

import { createSerieUseCase } from "../application/create-serie.use-case.js";
import type { Serie } from "../domain/serie.js";
import { getSerieUseCase } from "../application/get-serie.use-case.js";

export class RequestValidationError extends Data.TaggedError("ValidationError")<{
  details: string;
}> {}

/* --------------------------------------------------------------- */

const createSerieSchema = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  producer: Schema.String,
  releaseAt: Schema.DateFromString,
});

const parseCreateSerieInput = (input: unknown) =>
  Schema.decodeUnknown(createSerieSchema)(input).pipe(
    Effect.mapError((error) => new RequestValidationError({ details: error.message })),
  );

const mapToClientShape = (serie: Serie): Serie => serie;

export const createSerieHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedSerie = yield* parseCreateSerieInput(input);

    const serie = yield* createSerieUseCase(parsedSerie);

    return mapToClientShape(serie);
  });

/* --------------------------------------------------------------- */

const getSerieSchema = Schema.Struct({
  id: Schema.String,
});

const parseGetSerieId = (id: string) =>
  Schema.decodeUnknown(getSerieSchema)({ id }).pipe(
    Effect.mapError((error) => new RequestValidationError({ details: error.message })),
  );

export const getSerieHandler = (id: string) =>
  Effect.gen(function* () {
    const parsedId = yield* parseGetSerieId(id);

    const serie = yield* getSerieUseCase(parsedId.id);

    return mapToClientShape(serie);
  });
