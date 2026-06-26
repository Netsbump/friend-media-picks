import { Effect, Layer, Option } from "effect";
import { eq } from "drizzle-orm";
import {
  unwrapSeasonCount,
  unwrapSerieTitle,
  type Serie,
  type ValidatedNewSerie,
} from "../domain/serie.js";
import { DbClient } from "../database/db.service.js";
import { series, type SerieInsert, type SerieRow } from "./schemas/serie.schema.js";
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

const firstOrRepoError = <A>(
  rows: ReadonlyArray<A>,
  error: {
    code: RepositoryErrorCode;
    message: string;
    entity: RepositoryEntity;
    operation: RepositoryOperation;
    details?: { entityId?: string };
  },
) =>
  Option.fromNullable(rows[0]).pipe(
    Option.match({
      onNone: () => Effect.fail(new RepositoryError(error)),
      onSome: (row) => Effect.succeed(row),
    }),
  );

const toSerieInsert = (newSerie: ValidatedNewSerie): SerieInsert => ({
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

    yield* Effect.logInfo("[BOOT] SerieRepository wired");

    const findRowById = (serieId: string) =>
      Effect.logInfo(`[REPO] find serie start id=${serieId}`).pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: () => db.select().from(series).where(eq(series.id, serieId)),
            catch: toRepoError(RepositoryOperation.FIND, serieId),
          }),
        ),
      );

    const insertRow = (newSerie: ValidatedNewSerie) =>
      Effect.logInfo("[REPO] save serie start").pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: () => db.insert(series).values(toSerieInsert(newSerie)).returning(),
            catch: toRepoError(RepositoryOperation.SAVE),
          }),
        ),
      );

    return {
      findById: (serieId: string) =>
        findRowById(serieId).pipe(
          // flatMap is used when the callback returns another Effect.
          // In this step, we transform "rows" into a typed failure when no row exists.
          Effect.flatMap((rows) =>
            firstOrRepoError(rows, {
              code: RepositoryErrorCode.NOT_FOUND,
              entity: RepositoryEntity.SERIE,
              operation: RepositoryOperation.FIND,
              message: "Serie not found",
              details: { entityId: serieId },
            }),
          ),
          Effect.tap(() => Effect.logInfo(`[REPO] find serie success id=${serieId}`)),
          Effect.map(toSerieDomain),
        ),
      save: (newSerie: ValidatedNewSerie) =>
        insertRow(newSerie).pipe(
          // Same composition pattern for save: empty insert result becomes a typed repository error.
          Effect.flatMap((rows) =>
            firstOrRepoError(rows, {
              code: RepositoryErrorCode.DB_EMPTY_RESULT,
              entity: RepositoryEntity.SERIE,
              operation: RepositoryOperation.SAVE,
              message: "Insert did not return a row",
            }),
          ),
          Effect.tap(() => Effect.logInfo("[REPO] save serie success")),
          Effect.map(toSerieDomain),
        ),
    };
  }),
);
