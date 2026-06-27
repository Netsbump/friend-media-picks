import { Effect, Layer } from "effect";
import { eq } from "drizzle-orm";
import {
  unwrapSeasonCount,
  unwrapSerieTitle,
  type Serie,
  type ValidatedSerie,
} from "../domain/serie.js";
import { DbClient } from "../database/db.service.js";
import { series, type SerieInsert, type SerieRow } from "../database/schemas/serie.schema.js";
import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../application/repository.error.js";
import { SerieRepository } from "../application/serie.repository.js";

const toRepoError = (operation: RepositoryOperation, serieId?: string) => (e: unknown) =>
  new RepositoryError({
    code: RepositoryErrorCode.DB_FAILURE,
    entity: RepositoryEntity.SERIE,
    operation,
    message: e instanceof Error ? e.message : String(e),
    details: {
      ...(serieId ? { entityId: serieId } : {}),
      cause: e instanceof Error ? e.message : String(e),
    },
  });

const toSerieInsert = (newSerie: ValidatedSerie): SerieInsert => ({
  title: unwrapSerieTitle(newSerie.title),
  description: newSerie.description,
  seasons: unwrapSeasonCount(newSerie.seasons),
  producer: newSerie.producer,
  releaseAt: newSerie.releaseAt,
});

const toSerieDomain = (row: SerieRow): Serie => ({
  id: row.id,
  title: row.title,
  description: row.description,
  seasons: row.seasons,
  producer: row.producer,
  releaseAt: row.releaseAt,
});

/**
 * SerieRepositoryLive is the concrete runtime implementation of the repository service.
 *  It is provided through Effect Layer, so use-cases depend on the interface, not Drizzle directly.
 */
export const SerieRepositoryLive = Layer.effect(
  SerieRepository,
  Effect.gen(function* () {
    const { db } = yield* DbClient;

    yield* Effect.logInfo("[STARTUP] SerieRepository wired");

    const findRowById = (serieId: string) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`[REPO] find serie start id=${serieId}`);

        return yield* Effect.mapError(
          db.select().from(series).where(eq(series.id, serieId)),
          toRepoError(RepositoryOperation.FIND, serieId),
        );
      });

    const insertRow = (newSerie: ValidatedSerie) =>
      Effect.gen(function* () {
        yield* Effect.logInfo("[REPO] save serie start");

        return yield* Effect.mapError(
          db.insert(series).values(toSerieInsert(newSerie)).returning(),
          toRepoError(RepositoryOperation.SAVE),
        );
      });

    return {
      findById: (serieId: string) =>
        Effect.gen(function* () {
          const rows = yield* findRowById(serieId);
          const row = rows[0];

          if (row === undefined) {
            return yield* new RepositoryError({
              code: RepositoryErrorCode.NOT_FOUND,
              entity: RepositoryEntity.SERIE,
              operation: RepositoryOperation.FIND,
              message: "Serie not found",
              details: { entityId: serieId },
            });
          }

          yield* Effect.logInfo(`[REPO] find serie success id=${serieId}`);

          return toSerieDomain(row);
        }),
      save: (newSerie: ValidatedSerie) =>
        Effect.gen(function* () {
          const rows = yield* insertRow(newSerie);
          const row = rows[0];

          if (row === undefined) {
            return yield* new RepositoryError({
              code: RepositoryErrorCode.DB_EMPTY_RESULT,
              entity: RepositoryEntity.SERIE,
              operation: RepositoryOperation.SAVE,
              message: "Insert did not return a row",
            });
          }

          yield* Effect.logInfo("[REPO] save serie success");

          return toSerieDomain(row);
        }),
    };
  }),
);
