import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import * as SqlClient from "@effect/sql/SqlClient";
import { Effect, Layer } from "effect";
import type { TvShowCreation } from "../domain/tvshow.js";
import type { GenreRow } from "../../database/schemas/genre.schema.js";
import type { PersonRow } from "../../database/schemas/person.schema.js";
import type { TvShowRow } from "../../database/schemas/tvshow.schema.js";
import { toTvShowInsert } from "./tvshow.mappers.js";
import { makeTvShowQueries } from "./tvshow.drizzle.queries.js";
import { toTvShowsWithRelations, toTvShowWithRelations } from "./tvshow.repository.hydration.js";
import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../application/repository.error.js";
import { TvShowRepository } from "../application/tvshow.repository.js";

type UpsertedTvShowPersons = {
  directors: ReadonlyArray<PersonRow>;
  writers: ReadonlyArray<PersonRow>;
  stars: ReadonlyArray<PersonRow>;
};

const toRepoError = (operation: RepositoryOperation, tvShowId?: string) => (e: unknown) =>
  new RepositoryError({
    code: RepositoryErrorCode.PERSISTENCE_FAILURE,
    entity: RepositoryEntity.TVSHOW,
    operation,
    message: e instanceof Error ? e.message : String(e),
    details: {
      ...(tvShowId ? { entityId: tvShowId } : {}),
      cause: e instanceof Error ? e.message : String(e),
    },
  });

const failEmptyInsert = () =>
  new RepositoryError({
    code: RepositoryErrorCode.EMPTY_RESULT,
    entity: RepositoryEntity.TVSHOW,
    operation: RepositoryOperation.SAVE,
    message: "Insert did not return a row",
  });

const failNotFound = (tvShowId: string) =>
  new RepositoryError({
    code: RepositoryErrorCode.NOT_FOUND,
    entity: RepositoryEntity.TVSHOW,
    operation: RepositoryOperation.FIND,
    message: "TvShow not found",
    details: { entityId: tvShowId },
  });

const requireRow = <A>(row: A | undefined, error: RepositoryError) =>
  row === undefined ? Effect.fail(error) : Effect.succeed(row);

export const TvShowRepositoryLive = Layer.effect(
  TvShowRepository,
  Effect.gen(function* () {
    const db = yield* PgDrizzle.PgDrizzle;
    const sql = yield* SqlClient.SqlClient;

    const queries = makeTvShowQueries(db);

    yield* Effect.logInfo("[STARTUP] TvShowRepository wired");

    const selectTvShowRelations = (tvShowId: string) =>
      Effect.gen(function* () {
        const [directors, writers, stars, genres] = yield* Effect.all(
          [
            queries.selectDirectors(tvShowId),
            queries.selectWriters(tvShowId),
            queries.selectStars(tvShowId),
            queries.selectGenres(tvShowId),
          ],
          { concurrency: "unbounded" },
        );

        return { directors, writers, stars, genres };
      });

    const hydrateTvShow = (row: TvShowRow) =>
      Effect.map(selectTvShowRelations(row.id), (relations) =>
        toTvShowWithRelations(row, relations),
      );

    const insertTvShow = (tvShow: TvShowCreation) =>
      Effect.gen(function* () {
        const tvShowInsert = toTvShowInsert(tvShow);
        const insertedTvShow = yield* queries.insertTvShow(tvShowInsert);

        return yield* requireRow(insertedTvShow, failEmptyInsert());
      });

    const upsertTvShowPersons = (tvShow: TvShowCreation) =>
      Effect.gen(function* () {
        const [directors, writers, stars] = yield* Effect.all(
          [
            queries.upsertPersons(tvShow.directors),
            queries.upsertPersons(tvShow.writers),
            queries.upsertPersons(tvShow.stars),
          ],
          { concurrency: "unbounded" },
        );

        return { directors, writers, stars };
      });

    const upsertTvShowGenres = (tvShow: TvShowCreation) => queries.upsertGenres(tvShow.genres);

    const insertTvShowRelations = (
      tvShowId: string,
      persons: UpsertedTvShowPersons,
      genres: ReadonlyArray<GenreRow>,
    ) =>
      Effect.all(
        [
          queries.insertTvShowDirectors(tvShowId, persons.directors),
          queries.insertTvShowWriters(tvShowId, persons.writers),
          queries.insertTvShowStars(tvShowId, persons.stars),
          queries.insertTvShowGenres(tvShowId, genres),
        ],
        { concurrency: "unbounded" },
      );

    return {
      findById: (tvShowId: string) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`[REPO] find tvshow start id=${tvShowId}`);

          const tvShowRows = yield* Effect.mapError(
            queries.selectTvShowById(tvShowId),
            toRepoError(RepositoryOperation.FIND, tvShowId),
          );

          const tvShow = yield* requireRow(tvShowRows[0], failNotFound(tvShowId));
          const relations = yield* Effect.mapError(
            selectTvShowRelations(tvShowId),
            toRepoError(RepositoryOperation.FIND, tvShowId),
          );

          yield* Effect.logInfo(`[REPO] find tvshow success id=${tvShowId}`);

          return toTvShowWithRelations(tvShow, relations);
        }),

      findAll: () =>
        Effect.gen(function* () {
          yield* Effect.logInfo("[REPO] find all tvshows start");

          const tvShows = yield* Effect.mapError(
            queries.selectTvShows(),
            toRepoError(RepositoryOperation.FIND_ALL),
          );
          const tvShowIds = tvShows.map((tvShow) => tvShow.id);

          const [directors, writers, stars, genres] = yield* Effect.mapError(
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

          yield* Effect.logInfo("[REPO] find all tvshows success");

          return toTvShowsWithRelations(tvShows, { directors, writers, stars, genres });
        }),

      save: (tvShow: TvShowCreation) =>
        Effect.gen(function* () {
          const savedTvShow = yield* Effect.mapError(
            sql.withTransaction(
              Effect.gen(function* () {
                yield* Effect.logInfo("[REPO] save tvshow start");

                const insertedTvShow = yield* insertTvShow(tvShow);
                const persons = yield* upsertTvShowPersons(tvShow);
                const genres = yield* upsertTvShowGenres(tvShow);
                yield* insertTvShowRelations(insertedTvShow.id, persons, genres);

                return yield* hydrateTvShow(insertedTvShow);
              }),
            ),
            toRepoError(RepositoryOperation.SAVE),
          );

          yield* Effect.logInfo("[REPO] save tvshow success");

          return savedTvShow;
        }),
    };
  }),
);
