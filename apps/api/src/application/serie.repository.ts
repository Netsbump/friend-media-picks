import { Context, type Effect } from "effect";
import type { Serie, ValidatedNewSerie } from "../domain/serie.js";
import type { RepositoryError } from "./repository.error.js";

export class SerieRepository extends Context.Tag("SerieRepository")<
  SerieRepository,
  {
    findById: (serieId: string) => Effect.Effect<Serie, RepositoryError>;
    save: (newSerie: ValidatedNewSerie) => Effect.Effect<Serie, RepositoryError>;
  }
>() {}
