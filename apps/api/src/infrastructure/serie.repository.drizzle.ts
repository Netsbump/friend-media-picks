import { Effect, Layer, Option } from "effect";
import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import {
  unwrapSeasonCount,
  unwrapSerieTitle,
  type Serie,
  type ValidatedNewSerie,
} from "../domain/serie.js";
import { DbClient } from "./database/db.service.js";
import { series } from "./serie.schema.js";
import {
  SerieRepository,
  SerieRepositoryError,
  SerieRepositoryErrorCode,
  SerieRepositoryOperation,
} from "../application/serie.repository.js";

type SerieRow = InferSelectModel<typeof series>;
type SerieInsert = InferInsertModel<typeof series>;

const toRepoError = (operation: SerieRepositoryOperation, serieId?: string) => (e: unknown) =>
  new SerieRepositoryError({
    code: SerieRepositoryErrorCode.DB_FAILURE,
    message: e instanceof Error ? e.message : String(e),
    details: {
      operation,
      ...(serieId ? { serieId } : {}),
      cause: e instanceof Error ? e.message : String(e),
    },
  });

const firstOrRepoError = <A>(
  rows: ReadonlyArray<A>,
  error: {
    code: (typeof SerieRepositoryErrorCode)[keyof typeof SerieRepositoryErrorCode];
    message: string;
    details: {
      operation: SerieRepositoryOperation;
      serieId?: string;
    };
  },
) =>
  Option.fromNullable(rows[0]).pipe(
    Option.match({
      onNone: () => Effect.fail(new SerieRepositoryError(error)),
      onSome: (row) => Effect.succeed(row),
    }),
  );

const mapNewSerieToInsert = (newSerie: ValidatedNewSerie): SerieInsert => ({
  title: unwrapSerieTitle(newSerie.title),
  description: newSerie.description,
  seasons: unwrapSeasonCount(newSerie.seasons),
  producer: newSerie.producer,
  releaseAt: newSerie.releaseAt,
});

const mapRowToSerie = (row: SerieRow): Serie => ({
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
            catch: toRepoError(SerieRepositoryOperation.FIND, serieId),
          }),
        ),
      );

    const insertRow = (newSerie: ValidatedNewSerie) =>
      Effect.logInfo("[REPO] save serie start").pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: () => db.insert(series).values(mapNewSerieToInsert(newSerie)).returning(),
            catch: toRepoError(SerieRepositoryOperation.SAVE),
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
              code: SerieRepositoryErrorCode.NOT_FOUND,
              message: "Serie not found",
              details: { operation: SerieRepositoryOperation.FIND, serieId },
            }),
          ),
          Effect.tap(() => Effect.logInfo(`[REPO] find serie success id=${serieId}`)),
          Effect.map(mapRowToSerie),
        ),
      save: (newSerie: ValidatedNewSerie) =>
        insertRow(newSerie).pipe(
          // Same composition pattern for save: empty insert result becomes a typed repository error.
          Effect.flatMap((rows) =>
            firstOrRepoError(rows, {
              code: SerieRepositoryErrorCode.DB_EMPTY_RESULT,
              message: "Insert did not return a row",
              details: { operation: SerieRepositoryOperation.SAVE },
            }),
          ),
          Effect.tap(() => Effect.logInfo("[REPO] save serie success")),
          Effect.map(mapRowToSerie),
        ),
    };
  }),
);
