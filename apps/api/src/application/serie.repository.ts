import { Context, Data, type Effect } from "effect";
import type { Serie, ValidatedNewSerie } from "../domain/serie.js";

export class SerieRepositoryError extends Data.TaggedError("SerieRepositoryError")<{
  message: string;
}> {}

export class SerieRepository extends Context.Tag("SerieRepository")<
  SerieRepository,
  {
    save: (newSerie: ValidatedNewSerie) => Effect.Effect<Serie, SerieRepositoryError>;
  }
>() {}
