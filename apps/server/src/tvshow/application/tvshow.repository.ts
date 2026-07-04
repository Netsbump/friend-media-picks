import type { Effect } from "effect";
import { Context } from "effect";
import type { TvShow, TvShowCreation } from "../domain/tvshow.js";
import type { RepositoryError } from "./repository.error.js";

export class TvShowRepository extends Context.Tag("TvShowRepository")<
  TvShowRepository,
  {
    findById: (tvShowId: string) => Effect.Effect<TvShow, RepositoryError>;
    findAll: () => Effect.Effect<TvShow[], RepositoryError>;
    save: (newTvShow: TvShowCreation) => Effect.Effect<TvShow, RepositoryError>;
  }
>() {}
