import type { Effect } from "effect";
import { Context } from "effect";
import type { NewTvShowInput, TvShow } from "../domain/tvshow.js";
import type { DomainError } from "../domain/shared/type.js";
import type { RepositoryError } from "./repository.error.js";

export class TvShowCatalog extends Context.Tag("TvShowCatalog")<
  TvShowCatalog,
  {
    add: (input: NewTvShowInput) => Effect.Effect<TvShow, DomainError | RepositoryError>;
    getById: (id: string) => Effect.Effect<TvShow, RepositoryError>;
    list: () => Effect.Effect<TvShow[], RepositoryError>;
  }
>() {}
