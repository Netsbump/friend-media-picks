import type { Effect } from "effect";
import { Context } from "effect";
import type { DomainError, NewSerieInput, Serie } from "../domain/serie.js";
import type { SerieRepositoryError } from "./serie.repository.js";

export class SerieService extends Context.Tag("SerieService")<
  SerieService,
  {
    create: (
      input: NewSerieInput,
    ) => Effect.Effect<Serie, DomainError | SerieRepositoryError, never>;
    getById: (id: string) => Effect.Effect<Serie, SerieRepositoryError, never>;
  }
>() {}
