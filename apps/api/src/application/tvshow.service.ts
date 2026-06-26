import type { Effect } from "effect";
import { Context } from "effect";
import type { NewTvShowInput, TvShow } from "../domain/tvshow.js";
import type { DomainError } from "../domain/shared/type.js";
import type { RepositoryError } from "./repository.error.js";

export class TvShowService extends Context.Tag("TvShowService")<
  TvShowService,
  {
    create: (input: NewTvShowInput) => Effect.Effect<TvShow, DomainError | RepositoryError>;
    getOne: (id: string) => Effect.Effect<TvShow, RepositoryError>;
    getAll: () => Effect.Effect<TvShow[], RepositoryError>;
  }
>() {}
