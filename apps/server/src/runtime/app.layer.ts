import { Layer } from "effect";
import { DbClientLive } from "../database/db.service.js";
import { TvShowRepositoryLive } from "../tvshow/infrastructure/tvshow.repository.drizzle.js";
import { EnvConfigLive } from "./env.service.js";
import { TvShowCatalogLive } from "../tvshow/application/tvshow.catalog.live.js";

/**
 * Builds the production dependency graph for the API.
 *
 * This is the application's dependency injection boundary: it wires runtime
 * configuration, database access, repositories, and application services into
 * the Layer provided to the HTTP API at startup.
 */
export const makeAppLive = () => {
  const DbLive = Layer.provide(DbClientLive, EnvConfigLive);

  const TvShowLive = Layer.provide(TvShowRepositoryLive, DbLive);
  const TvShowCatalogAppLive = Layer.provide(TvShowCatalogLive, TvShowLive);

  return TvShowCatalogAppLive;
};
