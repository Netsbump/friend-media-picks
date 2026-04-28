import { Effect, Layer } from "effect";
import type { NewSerie, Serie } from "../domain/serie.js";
import type { Database } from "./database/kysely.js";
import type { Insertable, Selectable } from "kysely";
import {
  SerieRepository,
  SerieRepositoryError,
  SerieRepositoryErrorReason,
  type SerieRepositoryErrorReason as SerieRepositoryErrorReasonType,
} from "../application/serie.repository.port.js";
import { DbClient } from "./database/db.client.port.js";
import { PgSqlState } from "./database/pg-sqlstate.js";

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

type PgLikeError = {
  code?: string;
  message?: string;
};

const mapDatabaseErrorReason = (
  error: PgLikeError,
): SerieRepositoryErrorReasonType => {
  if (error.code === PgSqlState.UNIQUE_VIOLATION) {
    return SerieRepositoryErrorReason.SAVE_FAILED;
  }

  if (error.code === PgSqlState.UNDEFINED_TABLE) {
    return SerieRepositoryErrorReason.SCHEMA_MISSING;
  }

  const message = error.message ?? "";

  if (/connect|connection|econn|enotfound|timeout|refused/i.test(message)) {
    return SerieRepositoryErrorReason.CONNECTION_UNAVAILABLE;
  }

  if (/insert|constraint|duplicate|violat/i.test(message)) {
    return SerieRepositoryErrorReason.SAVE_FAILED;
  }

  return SerieRepositoryErrorReason.UNKNOWN;
};

export const SerieRepositoryLive = Layer.effect(
  SerieRepository,
  Effect.gen(function* () {
    const { db } = yield* DbClient;

    return {
      save: (newSerie: NewSerie) =>
        Effect.tryPromise({
          try: async () => {
            const row = await db
              .insertInto("series")
              .values(mapNewSerieToInsert(newSerie))
              .returningAll()
              .executeTakeFirstOrThrow();

            return mapRowToSerie(row);
          },
          catch: (e) => {
            const message = e instanceof Error ? e.message : String(e);
            const pgLikeError =
              e && typeof e === "object"
                ? (e as PgLikeError)
                : { message };

            return new SerieRepositoryError({
              message,
              reason: mapDatabaseErrorReason(pgLikeError),
            });
          },
        }),
    };
  }),
);
