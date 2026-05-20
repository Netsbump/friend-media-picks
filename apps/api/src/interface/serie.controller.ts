import { Data, Effect } from "effect";
import * as Schema from "effect/Schema";

import { createSerieUseCase } from "../application/create-serie.use-case.js";
import type { Serie } from "../domain/serie.js";

const createSerieSchema = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  producer: Schema.String,
  releaseAt: Schema.DateFromString,
});

export class RequestValidationError extends Data.TaggedError("ValidationError")<{
  details: string;
}> {}

const parseCreateSerieInput = (input: unknown) =>
  Schema.decodeUnknown(createSerieSchema)(input).pipe(
    Effect.mapError((error) => new RequestValidationError({ details: error.message })),
  );

const mapToClientShape = (serie: Serie): Serie => serie;

export const createSerieHttpHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedSerie = yield* parseCreateSerieInput(input);

    const serie = yield* createSerieUseCase(parsedSerie);

    return mapToClientShape(serie);
  });
