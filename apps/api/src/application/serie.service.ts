import type { Effect } from "effect";
import { Context } from "effect";
import type { NewSerieInput, Serie } from "../domain/serie.js";
import type { SerieRepositoryError } from "./serie.repository.js";
import type { DomainError } from "../domain/shared/type.js"

export class SerieService extends Context.Tag("SerieService")<
  SerieService,
  {
    create: (
      input: NewSerieInput,
    ) => Effect.Effect<Serie, DomainError | SerieRepositoryError, never>;
    getById: (id: string) => Effect.Effect<Serie, SerieRepositoryError, never>;
  }
>() {}
