import { Effect } from "effect";
import type { NewSerie, Serie } from "../../domain/serie.js";
import { makeDb, type Database } from "./kysely.js";
import type { Insertable, Selectable } from "kysely";
import {
  SerieRepositoryError,
  type SerieRepositoryErrorReason,
} from "../../application/serie/serie.repo.port.js";

type SerieRow = Selectable<Database["series"]>;
type SerieInsert = Insertable<Database["series"]>;

const mapNewSerieToInsert = (newSerie: NewSerie): SerieInsert => ({
  title: newSerie.title,
  description: newSerie.description,
  seasons: newSerie.seasons,
  producer: newSerie.producer,
  release_at: newSerie.releaseAt,
});

const mapRowToSerie = (row: SerieRow): Serie => ({
  id: row.id,
  title: row.title,
  description: row.description,
  seasons: row.seasons,
  producer: row.producer,
  releaseAt: row.release_at,
});

const mapDatabaseErrorReason = (message: string): SerieRepositoryErrorReason => {
  if (/connect|connection|econn|enotfound|timeout|refused/i.test(message)) {
    return "connection_unavailable";
  }

  if (/insert|constraint|duplicate|violat/i.test(message)) {
    return "save_failed";
  }

  return "unknown";
};

export const SerieRepoLive = {
  save: (newSerie: NewSerie) =>
    Effect.tryPromise({
      try: async () => {
        const db = makeDb();
        const row = await db
          .insertInto("series")
          .values(mapNewSerieToInsert(newSerie))
          .returningAll()
          .executeTakeFirstOrThrow();

        return mapRowToSerie(row);
      },
      catch: (e) => {
        const message = e instanceof Error ? e.message : String(e);

        return new SerieRepositoryError({
          message,
          reason: mapDatabaseErrorReason(message),
        });
      },
    }),
};
