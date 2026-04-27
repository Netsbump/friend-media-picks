import { Context, Data, Effect } from "effect";

import type { NewSerie, Serie } from "../../domain/serie.js";

export type SerieRepositoryErrorReason =
  | "save_failed"
  | "connection_unavailable"
  | "unknown";

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
