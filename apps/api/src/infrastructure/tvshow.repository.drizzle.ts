import { Effect, Layer, Option } from "effect";
import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../../application/repository.error.js";
import { TvShowRepository } from "../../application/tvshow.repository.js";
import { DbClient } from "../../database/db.service.js";
import type { TvShow, ValidatedTvShow } from "../../domain/tvshow.js";
import type { TvShowRow } from "../schemas/tvshow.schema.js";
import {
  toDirectorDomain,
  toGenreDomain,
  toStarDomain,
  toTvShowDomain,
  toTvShowInsert,
  toWriterDomain,
} from "../tvshow.mappers.js";
import { makeTvShowQueries } from "../tvshow.queries.js";

const toRepoError = (operation: RepositoryOperation, tvShowId?: string) => (e: unknown) =>
  new RepositoryError({
    code: RepositoryErrorCode.DB_FAILURE,
    entity: RepositoryEntity.TVSHOW,
    operation,
    message: e instanceof Error ? e.message : String(e),
    details: {
      ...(tvShowId ? { entityId: tvShowId } : {}),
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

export const TvShowRepositoryLive = Layer.effect(
  TvShowRepository,
  Effect.gen(function* () {
    const { db } = yield* DbClient;
    const queries = makeTvShowQueries(db);

    yield* Effect.logInfo("[BOOT] TvShowRepository wired");

    const hydrateTvShow = async (row: TvShowRow): Promise<TvShow> => {
      const [directorRows, writerRows, starRows, genreRows] = await Promise.all([
        queries.selectDirectors(row.id),
        queries.selectWriters(row.id),
        queries.selectStars(row.id),
        queries.selectGenres(row.id),
      ]);

      return toTvShowDomain(row, {
        directors: directorRows.map(toDirectorDomain),
        writers: writerRows.map(toWriterDomain),
        stars: starRows.map(toStarDomain),
        genres: genreRows.map(toGenreDomain),
      });
    };

    const findRowById = (tvShowId: string) =>
      Effect.logInfo(`[REPO] find tvshow start id=${tvShowId}`).pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: () => queries.selectTvShowById(tvShowId),
            catch: toRepoError(RepositoryOperation.FIND, tvShowId),
          }),
        ),
      );

    const findRows = () =>
      Effect.logInfo("[REPO] find all tvshows start").pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: queries.selectTvShows,
            catch: toRepoError(RepositoryOperation.FIND_ALL),
          }),
        ),
      );

    const insertTvShowAggregate = (tvShow: ValidatedTvShow) =>
      Effect.logInfo("[REPO] save tvshow start").pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: async () => {
              const insertedTvShows = await queries.insertTvShow(toTvShowInsert(tvShow));
              const insertedTvShow = insertedTvShows[0];

              if (!insertedTvShow) {
                return [];
              }

              const [directorRows, writerRows, starRows, genreRows] = await Promise.all([
                queries.insertPersons(tvShow.directors),
                queries.insertPersons(tvShow.writers),
                queries.insertPersons(tvShow.stars),
                queries.insertGenres(tvShow.genres),
              ]);

              await Promise.all([
                queries.insertTvShowDirectors(insertedTvShow.id, directorRows),
                queries.insertTvShowWriters(insertedTvShow.id, writerRows),
                queries.insertTvShowStars(insertedTvShow.id, starRows),
                queries.insertTvShowGenres(insertedTvShow.id, genreRows),
              ]);

              return [await hydrateTvShow(insertedTvShow)];
            },
            catch: toRepoError(RepositoryOperation.SAVE),
          }),
        ),
      );

    return {
      findById: (tvShowId: string) =>
        findRowById(tvShowId).pipe(
          Effect.flatMap((rows) =>
            firstOrRepoError(rows, {
              code: RepositoryErrorCode.NOT_FOUND,
              entity: RepositoryEntity.TVSHOW,
              operation: RepositoryOperation.FIND,
              message: "TvShow not found",
              details: { entityId: tvShowId },
            }),
          ),
          Effect.flatMap((row) =>
            Effect.tryPromise({
              try: () => hydrateTvShow(row),
              catch: toRepoError(RepositoryOperation.FIND, tvShowId),
            }),
          ),
          Effect.tap(() => Effect.logInfo(`[REPO] find tvshow success id=${tvShowId}`)),
        ),
      findAll: () =>
        findRows().pipe(
          Effect.flatMap((rows) =>
            Effect.tryPromise({
              try: () => Promise.all(rows.map(hydrateTvShow)),
              catch: toRepoError(RepositoryOperation.FIND_ALL),
            }),
          ),
          Effect.tap(() => Effect.logInfo("[REPO] find all tvshows success")),
        ),
      save: (tvShow: ValidatedTvShow) =>
        insertTvShowAggregate(tvShow).pipe(
          Effect.flatMap((rows) =>
            firstOrRepoError(rows, {
              code: RepositoryErrorCode.DB_EMPTY_RESULT,
              entity: RepositoryEntity.TVSHOW,
              operation: RepositoryOperation.SAVE,
              message: "Insert did not return a row",
            }),
          ),
          Effect.tap(() => Effect.logInfo("[REPO] save tvshow success")),
        ),
    };
  }),
);
