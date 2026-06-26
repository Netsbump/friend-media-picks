import { Effect, Layer, Option } from "effect";
import { eq, sql } from "drizzle-orm";
import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../application/repository.error.js";
import { TvShowRepository } from "../application/tvshow.repository.js";
import type { Director, ValidatedDirector } from "../domain/director.js";
import { unwrapGenreName, type Genre, type ValidatedGenre } from "../domain/genre.js";
import type { Star, ValidatedStar } from "../domain/star.js";
import { unwrapPersonName } from "../domain/shared/person-name.js";
import {
  unwrapEpisodeCount,
  unwrapSeasonCount,
  unwrapTvShowName,
  type TvShow,
  type ValidatedTvShow,
} from "../domain/tvshow.js";
import type { ValidatedWriter, Writer } from "../domain/writer.js";
import { DbClient } from "../database/db.service.js";
import { genres, type GenreInsert, type GenreRow } from "./schemas/genre.schema.js";
import { persons, type PersonInsert, type PersonRow } from "./schemas/person.schema.js";
import {
  tvShowDirectors,
  tvShowGenres,
  tvShows,
  tvShowStars,
  tvShowWriters,
  type TvShowInsert,
  type TvShowRow,
} from "./schemas/tvshow.schema.js";

type PersonProjection = Pick<PersonRow, "id" | "firstName" | "lastName">;
type GenreProjection = Pick<GenreRow, "id" | "name" | "description">;

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

const toTvShowInsert = (tvShow: ValidatedTvShow): TvShowInsert => ({
  name: unwrapTvShowName(tvShow.name),
  description: tvShow.description,
  seasons: unwrapSeasonCount(tvShow.seasons),
  episodes: unwrapEpisodeCount(tvShow.episodes),
  releaseAt: tvShow.releaseAt,
});

const toPersonInsert = (
  person: ValidatedDirector | ValidatedWriter | ValidatedStar,
): PersonInsert => ({
  firstName: unwrapPersonName(person.firstName),
  lastName: unwrapPersonName(person.lastName),
});

const toGenreInsert = (genre: ValidatedGenre): GenreInsert => ({
  name: unwrapGenreName(genre.name),
  description: genre.description,
});

const toDirectorDomain = (person: PersonProjection): Director => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

const toWriterDomain = (person: PersonProjection): Writer => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

const toStarDomain = (person: PersonProjection): Star => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

const toGenreDomain = (genre: GenreProjection): Genre => ({
  id: genre.id,
  name: genre.name,
  description: genre.description,
});

const toTvShowDomain = (
  row: TvShowRow,
  relations: {
    directors: ReadonlyArray<Director>;
    writers: ReadonlyArray<Writer>;
    stars: ReadonlyArray<Star>;
    genres: ReadonlyArray<Genre>;
  },
): TvShow => ({
  id: row.id,
  name: row.name,
  description: row.description,
  seasons: row.seasons,
  episodes: row.episodes,
  releaseAt: row.releaseAt,
  directors: relations.directors,
  writers: relations.writers,
  stars: relations.stars,
  genres: relations.genres,
});

export const TvShowRepositoryLive = Layer.effect(
  TvShowRepository,
  Effect.gen(function* () {
    const { db } = yield* DbClient;

    yield* Effect.logInfo("[BOOT] TvShowRepository wired");

    const selectDirectors = (tvShowId: string) =>
      db
        .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
        .from(tvShowDirectors)
        .innerJoin(persons, eq(tvShowDirectors.personId, persons.id))
        .where(eq(tvShowDirectors.tvShowId, tvShowId));

    const selectWriters = (tvShowId: string) =>
      db
        .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
        .from(tvShowWriters)
        .innerJoin(persons, eq(tvShowWriters.personId, persons.id))
        .where(eq(tvShowWriters.tvShowId, tvShowId));

    const selectStars = (tvShowId: string) =>
      db
        .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
        .from(tvShowStars)
        .innerJoin(persons, eq(tvShowStars.personId, persons.id))
        .where(eq(tvShowStars.tvShowId, tvShowId));

    const selectGenres = (tvShowId: string) =>
      db
        .select({ id: genres.id, name: genres.name, description: genres.description })
        .from(tvShowGenres)
        .innerJoin(genres, eq(tvShowGenres.genreId, genres.id))
        .where(eq(tvShowGenres.tvShowId, tvShowId));

    const hydrateTvShow = async (row: TvShowRow): Promise<TvShow> => {
      const [directorRows, writerRows, starRows, genreRows] = await Promise.all([
        selectDirectors(row.id),
        selectWriters(row.id),
        selectStars(row.id),
        selectGenres(row.id),
      ]);

      return toTvShowDomain(row, {
        directors: directorRows.map(toDirectorDomain),
        writers: writerRows.map(toWriterDomain),
        stars: starRows.map(toStarDomain),
        genres: genreRows.map(toGenreDomain),
      });
    };

    const insertPersons = (
      input: ReadonlyArray<ValidatedDirector | ValidatedWriter | ValidatedStar>,
    ) =>
      input.length === 0
        ? Promise.resolve([])
        : db.insert(persons).values(input.map(toPersonInsert)).returning();

    const insertGenres = (input: ReadonlyArray<ValidatedGenre>) =>
      input.length === 0
        ? Promise.resolve([])
        : db
            .insert(genres)
            .values(input.map(toGenreInsert))
            .onConflictDoUpdate({
              target: genres.name,
              set: { description: sql`excluded.description` },
            })
            .returning();

    const insertJoinRows = (
      tvShowId: string,
      rows: ReadonlyArray<PersonRow | GenreRow>,
      table:
        | typeof tvShowDirectors
        | typeof tvShowWriters
        | typeof tvShowStars
        | typeof tvShowGenres,
      idKey: "personId" | "genreId",
    ) =>
      rows.length === 0
        ? Promise.resolve()
        : db
            .insert(table)
            .values(rows.map((row) => ({ tvShowId, [idKey]: row.id })))
            .then(() => undefined);

    const findRowById = (tvShowId: string) =>
      Effect.logInfo(`[REPO] find tvshow start id=${tvShowId}`).pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: () => db.select().from(tvShows).where(eq(tvShows.id, tvShowId)),
            catch: toRepoError(RepositoryOperation.FIND, tvShowId),
          }),
        ),
      );

    const findRows = () =>
      Effect.logInfo("[REPO] find all tvshows start").pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: () => db.select().from(tvShows),
            catch: toRepoError(RepositoryOperation.FIND_ALL),
          }),
        ),
      );

    const insertGraph = (tvShow: ValidatedTvShow) =>
      Effect.logInfo("[REPO] save tvshow start").pipe(
        Effect.andThen(
          Effect.tryPromise({
            try: async () => {
              const insertedTvShows = await db
                .insert(tvShows)
                .values(toTvShowInsert(tvShow))
                .returning();
              const insertedTvShow = insertedTvShows[0];

              if (!insertedTvShow) {
                return [];
              }

              const [directorRows, writerRows, starRows, genreRows] = await Promise.all([
                insertPersons(tvShow.directors),
                insertPersons(tvShow.writers),
                insertPersons(tvShow.stars),
                insertGenres(tvShow.genres),
              ]);

              await Promise.all([
                insertJoinRows(insertedTvShow.id, directorRows, tvShowDirectors, "personId"),
                insertJoinRows(insertedTvShow.id, writerRows, tvShowWriters, "personId"),
                insertJoinRows(insertedTvShow.id, starRows, tvShowStars, "personId"),
                insertJoinRows(insertedTvShow.id, genreRows, tvShowGenres, "genreId"),
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
        insertGraph(tvShow).pipe(
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
