import "@effect/sql-drizzle/Pg";
import { eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Effect } from "effect";
import type { ValidatedDirector } from "../domain/director.js";
import type { ValidatedGenre } from "../domain/genre.js";
import type { ValidatedStar } from "../domain/star.js";
import type { ValidatedWriter } from "../domain/writer.js";
import type { Database } from "../../database/database.client.js";
import { genres, type GenreRow } from "../../database/schemas/genre.schema.js";
import { persons, type PersonRow } from "../../database/schemas/person.schema.js";
import {
  tvShowDirectors,
  tvShowGenres,
  tvShows,
  tvShowStars,
  tvShowWriters,
  type TvShowInsert,
} from "../../database/schemas/tvshow.schema.js";
import { toGenreInsert, toPersonInsert } from "./tvshow.mappers.js";

type TvShowQueryExecutor = Pick<Database, "insert" | "select">;

const toUniquePersonInserts = (
  input: ReadonlyArray<ValidatedDirector | ValidatedWriter | ValidatedStar>,
) => {
  const personsByName = new Map<string, ReturnType<typeof toPersonInsert>>();

  for (const person of input) {
    const personInsert = toPersonInsert(person);
    personsByName.set(`${personInsert.firstName}\u0000${personInsert.lastName}`, personInsert);
  }

  return [...personsByName.values()];
};

export const makeTvShowQueries = (db: TvShowQueryExecutor) => {
  const directorPersons = alias(persons, "director_persons");
  const writerPersons = alias(persons, "writer_persons");
  const starPersons = alias(persons, "star_persons");

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

  const selectDirectorsForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowDirectors.tvShowId,
            id: persons.id,
            firstName: persons.firstName,
            lastName: persons.lastName,
          })
          .from(tvShowDirectors)
          .innerJoin(persons, eq(tvShowDirectors.personId, persons.id))
          .where(inArray(tvShowDirectors.tvShowId, tvShowIds));

  const selectWritersForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowWriters.tvShowId,
            id: persons.id,
            firstName: persons.firstName,
            lastName: persons.lastName,
          })
          .from(tvShowWriters)
          .innerJoin(persons, eq(tvShowWriters.personId, persons.id))
          .where(inArray(tvShowWriters.tvShowId, tvShowIds));

  const selectStarsForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowStars.tvShowId,
            id: persons.id,
            firstName: persons.firstName,
            lastName: persons.lastName,
          })
          .from(tvShowStars)
          .innerJoin(persons, eq(tvShowStars.personId, persons.id))
          .where(inArray(tvShowStars.tvShowId, tvShowIds));

  const selectGenresForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowGenres.tvShowId,
            id: genres.id,
            name: genres.name,
            description: genres.description,
          })
          .from(tvShowGenres)
          .innerJoin(genres, eq(tvShowGenres.genreId, genres.id))
          .where(inArray(tvShowGenres.tvShowId, tvShowIds));

  const insertPersons = (
    input: ReadonlyArray<ValidatedDirector | ValidatedWriter | ValidatedStar>,
  ) =>
    input.length === 0
      ? Effect.succeed([])
      : db
          .insert(persons)
          .values(toUniquePersonInserts(input))
          .onConflictDoUpdate({
            target: [persons.firstName, persons.lastName],
            set: {
              firstName: sql`excluded.first_name`,
              lastName: sql`excluded.last_name`,
            },
          })
          .returning();

  const insertGenres = (input: ReadonlyArray<ValidatedGenre>) =>
    input.length === 0
      ? Effect.succeed([])
      : db
          .insert(genres)
          .values(input.map((genre) => toGenreInsert(genre)))
          .onConflictDoUpdate({
            target: genres.name,
            set: { description: sql`excluded.description` },
          })
          .returning();

  const insertTvShowDirectors = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowDirectors)
            .values(rows.map((row) => ({ tvShowId, personId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShowWriters = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowWriters)
            .values(rows.map((row) => ({ tvShowId, personId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShowStars = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowStars)
            .values(rows.map((row) => ({ tvShowId, personId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShowGenres = (tvShowId: string, rows: ReadonlyArray<GenreRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowGenres)
            .values(rows.map((row) => ({ tvShowId, genreId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShow = (row: TvShowInsert) => db.insert(tvShows).values(row).returning();

  const selectTvShowById = (tvShowId: string) =>
    db.select().from(tvShows).where(eq(tvShows.id, tvShowId));

  const selectTvShowWithRelationsById = (tvShowId: string) =>
    db
      .select({
        tvShow: tvShows,
        director: {
          tvShowId: tvShowDirectors.tvShowId,
          id: directorPersons.id,
          firstName: directorPersons.firstName,
          lastName: directorPersons.lastName,
        },
        writer: {
          tvShowId: tvShowWriters.tvShowId,
          id: writerPersons.id,
          firstName: writerPersons.firstName,
          lastName: writerPersons.lastName,
        },
        star: {
          tvShowId: tvShowStars.tvShowId,
          id: starPersons.id,
          firstName: starPersons.firstName,
          lastName: starPersons.lastName,
        },
        genre: {
          tvShowId: tvShowGenres.tvShowId,
          id: genres.id,
          name: genres.name,
          description: genres.description,
        },
      })
      .from(tvShows)
      .leftJoin(tvShowDirectors, eq(tvShowDirectors.tvShowId, tvShows.id))
      .leftJoin(directorPersons, eq(tvShowDirectors.personId, directorPersons.id))
      .leftJoin(tvShowWriters, eq(tvShowWriters.tvShowId, tvShows.id))
      .leftJoin(writerPersons, eq(tvShowWriters.personId, writerPersons.id))
      .leftJoin(tvShowStars, eq(tvShowStars.tvShowId, tvShows.id))
      .leftJoin(starPersons, eq(tvShowStars.personId, starPersons.id))
      .leftJoin(tvShowGenres, eq(tvShowGenres.tvShowId, tvShows.id))
      .leftJoin(genres, eq(tvShowGenres.genreId, genres.id))
      .where(eq(tvShows.id, tvShowId));

  const selectTvShows = () => db.select().from(tvShows);

  return {
    selectTvShowById,
    selectTvShowWithRelationsById,
    selectTvShows,
    insertGenres,
    insertPersons,
    insertTvShow,
    insertTvShowDirectors,
    insertTvShowGenres,
    insertTvShowStars,
    insertTvShowWriters,
    selectDirectors,
    selectDirectorsForTvShows,
    selectGenres,
    selectGenresForTvShows,
    selectStars,
    selectStarsForTvShows,
    selectWriters,
    selectWritersForTvShows,
  };
};
