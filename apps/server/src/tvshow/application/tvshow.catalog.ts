import type { Effect } from "effect";
import { Context } from "effect";
import type { TvShow, TvShowCreation } from "../domain/tvshow.js";
import type { DomainError } from "../domain/type.js";
import type { RepositoryError } from "./repository.error.js";

export class TvShowCatalog extends Context.Tag("TvShowCatalog")<
  TvShowCatalog,
  {
    // RepositoryError doit pas apparaitre coté applicatif -> doit etre mappé côté infra
    add: (input: TvShowCreation) => Effect.Effect<TvShow, DomainError | RepositoryError>;
    getById: (id: string) => Effect.Effect<TvShow, RepositoryError>;
    list: () => Effect.Effect<TvShow[], RepositoryError>;
  }
>() {}
