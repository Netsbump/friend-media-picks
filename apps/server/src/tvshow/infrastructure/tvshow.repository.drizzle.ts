import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import * as SqlClient from "@effect/sql/SqlClient";
import { Effect, Layer } from "effect";
import type { TvShowCreation } from "../domain/tvshow.js";
import type { GenreRow } from "../../database/schemas/genre.schema.js";
import type { PersonRow } from "../../database/schemas/person.schema.js";
import type { TvShowRow } from "../../database/schemas/tvshow.schema.js";
import {
  toDirectorsDomain,
  toGenresDomain,
  toStarsDomain,
  toTvShowDomain,
  toTvShowInsert,
  toWritersDomain,
} from "./tvshow.mappers.js";
import { makeTvShowQueries } from "./tvshow.drizzle.queries.js";
import { toTvShowsWithRelations, toTvShowWithRelations } from "./tvshow.repository.hydration.js";
import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../application/repository.error.js";
import { TvShowRepository } from "../application/tvshow.repository.js";

type InsertedRelations = {
  directors: ReadonlyArray<PersonRow>;
  writers: ReadonlyArray<PersonRow>;
  stars: ReadonlyArray<PersonRow>;
  genres: ReadonlyArray<GenreRow>;
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

    const findTvShows = () =>
      Effect.gen(function* () {
        yield* Effect.logInfo("[REPO] find all tvshows start");

        return yield* Effect.mapError(
          queries.selectTvShows(),
          toRepoError(RepositoryOperation.FIND_ALL),
        );
      });

    const findRelationsForTvShows = (tvShows: ReadonlyArray<TvShowRow>) =>
      Effect.gen(function* () {
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

        return {
          directors,
          writers,
          stars,
          genres,
        };
      });

    const findTvShowById = (tvShowId: string) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`[REPO] find tvshow start id=${tvShowId}`);

        const tvShowDetails = yield* Effect.mapError(
          queries.selectTvShowWithRelationsById(tvShowId),
          toRepoError(RepositoryOperation.FIND, tvShowId),
        );

        return yield* requireRow(toTvShowWithRelations(tvShowDetails), failNotFound(tvShowId));
      });

    const insertTvShow = (tvShow: TvShowCreation) =>
      Effect.gen(function* () {
        const tvShowInsert = toTvShowInsert(tvShow);
        const insertedTvShow = yield* queries.insertTvShow(tvShowInsert);

        return yield* requireRow(insertedTvShow, failEmptyInsert());
      });

    const insertTvShowRelations = (tvShow: TvShowCreation) =>
      Effect.gen(function* () {
        const [directors, writers, stars, genres] = yield* Effect.all(
          [
            queries.insertPersons(tvShow.directors),
            queries.insertPersons(tvShow.writers),
            queries.insertPersons(tvShow.stars),
            queries.insertGenres(tvShow.genres),
          ],
          { concurrency: "unbounded" },
        );

        return { directors, writers, stars, genres };
      });

    const linkTvShowRelations = (tvShowId: string, relations: InsertedRelations) =>
      Effect.all(
        [
          queries.insertTvShowDirectors(tvShowId, relations.directors),
          queries.insertTvShowWriters(tvShowId, relations.writers),
          queries.insertTvShowStars(tvShowId, relations.stars),
          queries.insertTvShowGenres(tvShowId, relations.genres),
        ],
        { concurrency: "unbounded" },
      );

    //C'est pas un aggregate dans le sens on recupere des tables qu on rien a voir avec TVSHOW -> donc pas suffixer
    //  ```ts
    // tvShowsTable      // objet Drizzle/table SQL
    // TvShowRow         // une ligne complète retournée par SELECT -> y a un soucis avec ce type infer car j'ai pas les includes en gros
    // TvShowInsert      // shape pour INSERT
    // TvShowUpdate      // shape pour UPDATE, si besoin
    //```
    // TvShowDao peut etre du coup
    //
    const saveTvShowWithRelations = (tvShow: TvShowCreation) =>
      Effect.mapError(
        sql.withTransaction(
          Effect.gen(function* () {
            yield* Effect.logInfo("[REPO] save tvshow start");

            const insertedTvShow = yield* insertTvShow(tvShow);
            const relations = yield* insertTvShowRelations(tvShow);
            yield* linkTvShowRelations(insertedTvShow.id, relations);

            return yield* hydrateTvShow(insertedTvShow);
          }),
        ),
        toRepoError(RepositoryOperation.SAVE),
      );

    return {
      findById: (tvShowId: string) =>
        Effect.gen(function* () {
          const tvShow = yield* findTvShowById(tvShowId);

          yield* Effect.logInfo(`[REPO] find tvshow success id=${tvShowId}`);

          return tvShow;
        }),

      findAll: () =>
        Effect.gen(function* () {
          const tvShows = yield* findTvShows();
          const relations = yield* findRelationsForTvShows(tvShows);
          const tvShowsWithRelations = toTvShowsWithRelations(tvShows, relations);

          yield* Effect.logInfo("[REPO] find all tvshows success");

          return tvShowsWithRelations;
        }),

      save: (tvShow: TvShowCreation) =>
        Effect.gen(function* () {
          const savedTvShow = yield* saveTvShowWithRelations(tvShow);

          yield* Effect.logInfo("[REPO] save tvshow success");

          return savedTvShow;
        }),
    };
  }),
);
