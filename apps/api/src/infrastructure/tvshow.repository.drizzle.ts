import { Effect, Layer } from "effect";
import type { ValidatedTvShow } from "../domain/tvshow.js";
import type { TvShowRow } from "./schemas/tvshow.schema.js";
import {
  toDirectorDomain,
  toGenreDomain,
  toStarDomain,
  toTvShowDomain,
  toTvShowInsert,
  toWriterDomain,
} from "./tvshow.mappers.js";
import { makeTvShowQueries } from "./tvshow.queries.js";
import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../application/repository.error.js";
import { TvShowRepository } from "../application/tvshow.repository.js";
import { DbClient } from "../database/db.service.js";

// Avoid flooding the database when hydrating many rows.
const TV_SHOW_HYDRATION_CONCURRENCY = 10;

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

export const TvShowRepositoryLive = Layer.effect(
  TvShowRepository,
  Effect.gen(function* () {
    const { db } = yield* DbClient;

    const queries = makeTvShowQueries(db);

    yield* Effect.logInfo("[BOOT] TvShowRepository wired");

    const hydrateTvShow = (row: TvShowRow) =>
      Effect.gen(function* () {
        const [directorRows, writerRows, starRows, genreRows] = yield* Effect.all(
          [
            queries.selectDirectors(row.id),
            queries.selectWriters(row.id),
            queries.selectStars(row.id),
            queries.selectGenres(row.id),
          ],
          { concurrency: "unbounded" },
        );

        return toTvShowDomain(row, {
          directors: directorRows.map((d) => toDirectorDomain(d)),
          writers: writerRows.map((w) => toWriterDomain(w)),
          stars: starRows.map((s) => toStarDomain(s)),
          genres: genreRows.map((g) => toGenreDomain(g)),
        });
      });

    const findRowById = (tvShowId: string) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`[REPO] find tvshow start id=${tvShowId}`);

        return yield* Effect.mapError(
          queries.selectTvShowById(tvShowId),
          toRepoError(RepositoryOperation.FIND, tvShowId),
        );
      });

    const findRows = () =>
      Effect.gen(function* () {
        yield* Effect.logInfo("[REPO] find all tvshows start");

        return yield* Effect.mapError(
          queries.selectTvShows(),
          toRepoError(RepositoryOperation.FIND_ALL),
        );
      });

    const insertTvShowAggregate = (tvShow: ValidatedTvShow) =>
      Effect.mapError(
        Effect.gen(function* () {
          const transactionRows = yield* db.transaction((tx) =>
            Effect.gen(function* () {
              const txQueries = makeTvShowQueries(tx);

              yield* Effect.logInfo("[REPO] save tvshow start");

              const insertedTvShows = yield* txQueries.insertTvShow(toTvShowInsert(tvShow));
              const insertedTvShow = insertedTvShows[0];

              if (insertedTvShow === undefined) {
                return [];
              }

              const directorRows = yield* txQueries.insertPersons(tvShow.directors);
              const writerRows = yield* txQueries.insertPersons(tvShow.writers);
              const starRows = yield* txQueries.insertPersons(tvShow.stars);
              const genreRows = yield* txQueries.insertGenres(tvShow.genres);

              yield* txQueries.insertTvShowDirectors(insertedTvShow.id, directorRows);
              yield* txQueries.insertTvShowWriters(insertedTvShow.id, writerRows);
              yield* txQueries.insertTvShowStars(insertedTvShow.id, starRows);
              yield* txQueries.insertTvShowGenres(insertedTvShow.id, genreRows);

              return [insertedTvShow];
            }),
          );
          const insertedTvShow = transactionRows[0];

          if (insertedTvShow === undefined) {
            return [];
          }

          return [yield* hydrateTvShow(insertedTvShow)];
        }),
        toRepoError(RepositoryOperation.SAVE),
      );

    return {
      findById: (tvShowId: string) =>
        Effect.gen(function* () {
          const rows = yield* findRowById(tvShowId);
          const row = rows[0];

          if (row === undefined) {
            return yield* new RepositoryError({
              code: RepositoryErrorCode.NOT_FOUND,
              entity: RepositoryEntity.TVSHOW,
              operation: RepositoryOperation.FIND,
              message: "TvShow not found",
              details: { entityId: tvShowId },
            });
          }

          const tvShow = yield* Effect.mapError(
            hydrateTvShow(row),
            toRepoError(RepositoryOperation.FIND, tvShowId),
          );

          yield* Effect.logInfo(`[REPO] find tvshow success id=${tvShowId}`);

          return tvShow;
        }),

      findAll: () =>
        Effect.gen(function* () {
          const rows = yield* findRows();
          const tvShows = yield* Effect.mapError(
            Effect.all(
              rows.map((row) => hydrateTvShow(row)),
              { concurrency: TV_SHOW_HYDRATION_CONCURRENCY },
            ),
            toRepoError(RepositoryOperation.FIND_ALL),
          );

          yield* Effect.logInfo("[REPO] find all tvshows success");

          return tvShows;
        }),
      save: (tvShow: ValidatedTvShow) =>
        Effect.gen(function* () {
          const rows = yield* insertTvShowAggregate(tvShow);
          const row = rows[0];

          if (row === undefined) {
            return yield* new RepositoryError({
              code: RepositoryErrorCode.DB_EMPTY_RESULT,
              entity: RepositoryEntity.TVSHOW,
              operation: RepositoryOperation.SAVE,
              message: "Insert did not return a row",
            });
          }

          yield* Effect.logInfo("[REPO] save tvshow success");

          return row;
        }),
    };
  }),
);
