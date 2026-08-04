import type { Effect } from "effect";
import { Context } from "effect";
import type { TvShow, TvShowCreation } from "../domain/tvshow.js";
import type { TvShowCatalogError } from "./tvshow.catalog.error.js";

export class TvShowCatalog extends Context.Tag("TvShowCatalog")<
  TvShowCatalog,
  {
    add: (input: TvShowCreation) => Effect.Effect<TvShow, TvShowCatalogError>;
    getById: (id: string) => Effect.Effect<TvShow, TvShowCatalogError>;
    list: () => Effect.Effect<TvShow[], TvShowCatalogError>;
  }
>() {}
