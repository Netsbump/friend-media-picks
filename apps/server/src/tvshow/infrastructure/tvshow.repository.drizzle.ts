import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import * as SqlClient from "@effect/sql/SqlClient";
import { Effect, Layer } from "effect";
import type { ValidatedTvShow } from "../domain/tvshow.js";
import type { TvShowRow } from "../../database/schemas/tvshow.schema.js";
import {
  toDirectorsDomain,
  toGenresDomain,
  toStarsDomain,
  toTvShowDomain,
  toTvShowInsert,
  toWritersDomain,
  type GenreProjection,
  type PersonProjection,
} from "./tvshow.mappers.js";
import { makeTvShowQueries } from "./tvshow.drizzle.queries.js";
import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../application/repository.error.js";
import { TvShowRepository } from "../application/tvshow.repository.js";

type PersonRelationProjection = PersonProjection & { tvShowId: string };
type GenreRelationProjection = GenreProjection & { tvShowId: string };

type NullablePersonRelationProjection = {
  tvShowId: string | null;
  id: string | null;
  firstName: string | null;
  lastName: string | null;
} | null;

type NullableGenreRelationProjection = {
  tvShowId: string | null;
  id: string | null;
  name: string | null;
  description: string | null;
} | null;

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

const isPersonRelationProjection = (
  row: NullablePersonRelationProjection,
): row is PersonRelationProjection =>
  row !== null &&
  row.tvShowId !== null &&
  row.id !== null &&
  row.firstName !== null &&
  row.lastName !== null;

const isGenreRelationProjection = (
  row: NullableGenreRelationProjection,
): row is GenreRelationProjection =>
  row !== null &&
  row.tvShowId !== null &&
  row.id !== null &&
  row.name !== null &&
  row.description !== null;

const uniqueById = <Row extends { id: string }>(rows: ReadonlyArray<Row>): Row[] => {
  const rowsById = new Map<string, Row>();

  for (const row of rows) {
    rowsById.set(row.id, row);
  }

  return [...rowsById.values()];
};

const groupByTvShowId = <Row extends { tvShowId: string }>(rows: ReadonlyArray<Row>) => {
  const rowsByTvShowId = new Map<string, Row[]>();

  for (const row of rows) {
    const tvShowRows = rowsByTvShowId.get(row.tvShowId) ?? [];
    tvShowRows.push(row);
    rowsByTvShowId.set(row.tvShowId, tvShowRows);
  }

  return rowsByTvShowId;
};

export const TvShowRepositoryLive = Layer.effect(
  TvShowRepository,
  Effect.gen(function* () {
    const db = yield* PgDrizzle.PgDrizzle;
    const sql = yield* SqlClient.SqlClient;

    const queries = makeTvShowQueries(db);

    yield* Effect.logInfo("[STARTUP] TvShowRepository wired");

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
          directors: toDirectorsDomain(directorRows),
          writers: toWritersDomain(writerRows),
          stars: toStarsDomain(starRows),
          genres: toGenresDomain(genreRows),
        });
      });

    const findJoinedRowsById = (tvShowId: string) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`[REPO] find tvshow start id=${tvShowId}`);

        return yield* Effect.mapError(
          queries.selectTvShowWithRelationsById(tvShowId),
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

    const hydrateTvShowsFromBulkRelations = (rows: ReadonlyArray<TvShowRow>) =>
      Effect.gen(function* () {
        const tvShowIds = rows.map((row) => row.id);
        const [directorRows, writerRows, starRows, genreRows] = yield* Effect.mapError(
          Effect.all(
            [
              queries.selectDirectorsForTvShows(tvShowIds),
              queries.selectWritersForTvShows(tvShowIds),
              queries.selectStarsForTvShows(tvShowIds),
              queries.selectGenresForTvShows(tvShowIds),
            ],
            { concurrency: "unbounded" },
          ),
          toRepoError(RepositoryOperation.FIND_ALL),
        );

        const directorsByTvShowId = groupByTvShowId(directorRows);
        const writersByTvShowId = groupByTvShowId(writerRows);
        const starsByTvShowId = groupByTvShowId(starRows);
        const genresByTvShowId = groupByTvShowId(genreRows);

        return rows.map((row) =>
          toTvShowDomain(row, {
            directors: toDirectorsDomain(uniqueById(directorsByTvShowId.get(row.id) ?? [])),
            writers: toWritersDomain(uniqueById(writersByTvShowId.get(row.id) ?? [])),
            stars: toStarsDomain(uniqueById(starsByTvShowId.get(row.id) ?? [])),
            genres: toGenresDomain(uniqueById(genresByTvShowId.get(row.id) ?? [])),
          }),
        );
      });

    const insertTvShowAggregate = (tvShow: ValidatedTvShow) =>
      Effect.mapError(
        sql
          .withTransaction(
            Effect.gen(function* () {
              yield* Effect.logInfo("[REPO] save tvshow start");

              const insertedTvShows = yield* queries.insertTvShow(toTvShowInsert(tvShow));
              const insertedTvShow = insertedTvShows[0];

              if (insertedTvShow === undefined) {
                return [];
              }

              const directorRows = yield* queries.insertPersons(tvShow.directors);
              const writerRows = yield* queries.insertPersons(tvShow.writers);
              const starRows = yield* queries.insertPersons(tvShow.stars);
              const genreRows = yield* queries.insertGenres(tvShow.genres);

              yield* queries.insertTvShowDirectors(insertedTvShow.id, directorRows);
              yield* queries.insertTvShowWriters(insertedTvShow.id, writerRows);
              yield* queries.insertTvShowStars(insertedTvShow.id, starRows);
              yield* queries.insertTvShowGenres(insertedTvShow.id, genreRows);

              return [insertedTvShow];
            }),
          )
          .pipe(
            Effect.flatMap((transactionRows) =>
              Effect.gen(function* () {
                const insertedTvShow = transactionRows[0];

                if (insertedTvShow === undefined) {
                  return [];
                }

                return [yield* hydrateTvShow(insertedTvShow)];
              }),
            ),
          ),
        toRepoError(RepositoryOperation.SAVE),
      );

    return {
      findById: (tvShowId: string) =>
        Effect.gen(function* () {
          const rows = yield* findJoinedRowsById(tvShowId);
          const firstRow = rows[0];

          if (firstRow === undefined) {
            return yield* new RepositoryError({
              code: RepositoryErrorCode.NOT_FOUND,
              entity: RepositoryEntity.TVSHOW,
              operation: RepositoryOperation.FIND,
              message: "TvShow not found",
              details: { entityId: tvShowId },
            });
          }

          const directorRows = uniqueById(
            rows.map((row) => row.director).filter((row) => isPersonRelationProjection(row)),
          );
          const writerRows = uniqueById(
            rows.map((row) => row.writer).filter((row) => isPersonRelationProjection(row)),
          );
          const starRows = uniqueById(
            rows.map((row) => row.star).filter((row) => isPersonRelationProjection(row)),
          );
          const genreRows = uniqueById(
            rows.map((row) => row.genre).filter((row) => isGenreRelationProjection(row)),
          );
          const tvShow = toTvShowDomain(firstRow.tvShow, {
            directors: toDirectorsDomain(directorRows),
            writers: toWritersDomain(writerRows),
            stars: toStarsDomain(starRows),
            genres: toGenresDomain(genreRows),
          });

          yield* Effect.logInfo(`[REPO] find tvshow success id=${tvShowId}`);

          return tvShow;
        }),

      findAll: () =>
        Effect.gen(function* () {
          const rows = yield* findRows();
          const tvShows = yield* hydrateTvShowsFromBulkRelations(rows);

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
