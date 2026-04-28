import { Context, Data, Effect } from "effect";

import type { NewSerie, Serie } from "../domain/serie.js";

export const SerieRepositoryErrorReason = {
  SAVE_FAILED: "SAVE_FAILED",
  CONNECTION_UNAVAILABLE: "CONNECTION_UNAVAILABLE",
  SCHEMA_MISSING: "SCHEMA_MISSING",
  UNKNOWN: "UNKNOWN",
} as const;

export type SerieRepositoryErrorReason =
  (typeof SerieRepositoryErrorReason)[keyof typeof SerieRepositoryErrorReason];

export class SerieRepositoryError extends Data.TaggedError(
  "SerieRepositoryError",
)<{
  message: string;
  reason: SerieRepositoryErrorReason;
}> {}

export class SerieRepository extends Context.Tag("SerieRepo")<
  SerieRepository,
  {
    save: (newSerie: NewSerie) => Effect.Effect<Serie, SerieRepositoryError>;
  }
>() {}
