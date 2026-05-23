import { Context, Data, type Effect } from "effect";
import type { Serie, ValidatedNewSerie } from "../domain/serie.js";

export const SerieRepositoryErrorCode = {
  NOT_FOUND: "SERIE_NOT_FOUND",
  DB_FAILURE: "SERIE_DB_FAILURE",
  DB_EMPTY_RESULT: "SERIE_DB_EMPTY_RESULT",
} as const;

export const SerieRepositoryOperation = {
  FIND: "find",
  SAVE: "save",
} as const;

export type SerieRepositoryErrorCode =
  (typeof SerieRepositoryErrorCode)[keyof typeof SerieRepositoryErrorCode];

export type SerieRepositoryOperation =
  (typeof SerieRepositoryOperation)[keyof typeof SerieRepositoryOperation];

export class SerieRepositoryError extends Data.TaggedError("SerieRepositoryError")<{
  code: SerieRepositoryErrorCode;
  message: string;
  details?: {
    operation: SerieRepositoryOperation;
    serieId?: string;
    cause?: string;
  };
}> {}

export class SerieRepository extends Context.Tag("SerieRepository")<
  SerieRepository,
  {
    findById: (serieId: string) => Effect.Effect<Serie, SerieRepositoryError>;
    save: (newSerie: ValidatedNewSerie) => Effect.Effect<Serie, SerieRepositoryError>;
  }
>() {}
