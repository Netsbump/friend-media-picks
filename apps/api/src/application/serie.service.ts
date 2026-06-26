import type { Effect } from "effect";
import { Context } from "effect";
import type { NewSerieInput, Serie } from "../domain/serie.js";
import type { DomainError } from "../domain/shared/type.js";
import type { RepositoryError } from "./repository.error.js";

export class SerieService extends Context.Tag("SerieService")<
  SerieService,
  {
    create: (input: NewSerieInput) => Effect.Effect<Serie, DomainError | RepositoryError, never>;
    getById: (id: string) => Effect.Effect<Serie, RepositoryError, never>;
  }
>() {}
