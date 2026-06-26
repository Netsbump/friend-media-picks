import { Context, Effect } from "effect";
import type { TvShow, ValidatedTvShow } from "../domain/tvshow.js";
import type { RepositoryError } from "./repository.error.js";

export class TvShowRepository extends Context.Tag("TvShowRepository")<
  TvShowRepository,
  {
    findById: (tvShowId: string) => Effect.Effect<TvShow, RepositoryError>;
    findAll: () => Effect.Effect<TvShow[], RepositoryError>;
    save: (tvShow: ValidatedTvShow) => Effect.Effect<TvShow, RepositoryError>;
  }
>() {}
