import { Context, Data, Effect } from "effect";

import type { NewSerie, Serie } from "../../domain/serie.js";

class DbError extends Data.TaggedError("DbError")<{
  message: string;
}> {}

export class SerieRepo extends Context.Tag("SerieRepo")<
  SerieRepo,
  {
    save: (newSerie: NewSerie) => Effect.Effect<Serie, DbError>;
  }
>() {}
