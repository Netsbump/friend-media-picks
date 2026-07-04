import "@effect/sql-drizzle/Pg";
import { eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Effect } from "effect";
import type { DirectorCreation } from "../domain/director.js";
import type { GenreCreation } from "../domain/genre.js";
import type { StarCreation } from "../domain/star.js";
import type { WriterCreation } from "../domain/writer.js";
import type { Database } from "../../database/database.client.js";
import { genresTable, type GenreRow } from "../../database/schemas/genre.schema.js";
import { personsTable, type PersonRow } from "../../database/schemas/person.schema.js";
import {
  tvShowDirectorsTable,
  tvShowGenresTable,
  tvShowsTable,
  tvShowStarsTable,
  tvShowWritersTable,
  type TvShowInsert,
} from "../../database/schemas/tvshow.schema.js";
import { toGenreInsert, toPersonInsert } from "./tvshow.mappers.js";

type TvShowQueryExecutor = Pick<Database, "insert" | "select">;

const toUniquePersonInserts = (
  input: ReadonlyArray<DirectorCreation | WriterCreation | StarCreation>,
) => {
  const personsByName = new Map<string, ReturnType<typeof toPersonInsert>>();

  for (const person of input) {
    const personInsert = toPersonInsert(person);
    personsByName.set(`${personInsert.firstName}\u0000${personInsert.lastName}`, personInsert);
  }

  return [...personsByName.values()];
};

export const makeTvShowQueries = (db: TvShowQueryExecutor) => {
  const directorPersons = alias(personsTable, "director_persons");
  const writerPersons = alias(personsTable, "writer_persons");
  const starPersons = alias(personsTable, "star_persons");

  const selectDirectors = (tvShowId: string) =>
    db
      .select({ id: personsTable.id, firstName: personsTable.firstName, lastName: personsTable.lastName })
      .from(tvShowDirectorsTable)
      .innerJoin(personsTable, eq(tvShowDirectorsTable.personId, personsTable.id))
      .where(eq(tvShowDirectorsTable.tvShowId, tvShowId));

  const selectWriters = (tvShowId: string) =>
    db
      .select({ id: personsTable.id, firstName: personsTable.firstName, lastName: personsTable.lastName })
      .from(tvShowWritersTable)
      .innerJoin(personsTable, eq(tvShowWritersTable.personId, personsTable.id))
      .where(eq(tvShowWritersTable.tvShowId, tvShowId));

  const selectStars = (tvShowId: string) =>
    db
      .select({ id: personsTable.id, firstName: personsTable.firstName, lastName: personsTable.lastName })
      .from(tvShowStarsTable)
      .innerJoin(personsTable, eq(tvShowStarsTable.personId, personsTable.id))
      .where(eq(tvShowStarsTable.tvShowId, tvShowId));

  const selectGenres = (tvShowId: string) =>
    db
      .select({ id: genresTable.id, name: genresTable.name, description: genresTable.description })
      .from(tvShowGenresTable)
      .innerJoin(genresTable, eq(tvShowGenresTable.genreId, genresTable.id))
      .where(eq(tvShowGenresTable.tvShowId, tvShowId));

  const selectDirectorsForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowDirectorsTable.tvShowId,
            id: personsTable.id,
            firstName: personsTable.firstName,
            lastName: personsTable.lastName,
          })
          .from(tvShowDirectorsTable)
          .innerJoin(personsTable, eq(tvShowDirectorsTable.personId, personsTable.id))
          .where(inArray(tvShowDirectorsTable.tvShowId, tvShowIds));

  const selectWritersForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowWritersTable.tvShowId,
            id: personsTable.id,
            firstName: personsTable.firstName,
            lastName: personsTable.lastName,
          })
          .from(tvShowWritersTable)
          .innerJoin(personsTable, eq(tvShowWritersTable.personId, personsTable.id))
          .where(inArray(tvShowWritersTable.tvShowId, tvShowIds));

  const selectStarsForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowStarsTable.tvShowId,
            id: personsTable.id,
            firstName: personsTable.firstName,
            lastName: personsTable.lastName,
          })
          .from(tvShowStarsTable)
          .innerJoin(personsTable, eq(tvShowStarsTable.personId, personsTable.id))
          .where(inArray(tvShowStarsTable.tvShowId, tvShowIds));

  const selectGenresForTvShows = (tvShowIds: ReadonlyArray<string>) =>
    tvShowIds.length === 0
      ? Effect.succeed([])
      : db
          .select({
            tvShowId: tvShowGenresTable.tvShowId,
            id: genresTable.id,
            name: genresTable.name,
            description: genresTable.description,
          })
          .from(tvShowGenresTable)
          .innerJoin(genresTable, eq(tvShowGenresTable.genreId, genresTable.id))
          .where(inArray(tvShowGenresTable.tvShowId, tvShowIds));

  const insertPersons = (
    input: ReadonlyArray<DirectorCreation | WriterCreation | StarCreation>,
  ) =>
    input.length === 0
      ? Effect.succeed([])
      : db
          .insert(personsTable)
          .values(toUniquePersonInserts(input))
          .onConflictDoUpdate({
            target: [personsTable.firstName, personsTable.lastName],
            set: {
              firstName: sql`excluded.first_name`,
              lastName: sql`excluded.last_name`,
            },
          })
          .returning();

  const insertGenres = (input: ReadonlyArray<GenreCreation>) =>
    input.length === 0
      ? Effect.succeed([])
      : db
          .insert(genresTable)
          .values(input.map((genre) => toGenreInsert(genre)))
          .onConflictDoUpdate({
            target: genresTable.name,
            set: { description: sql`excluded.description` },
          })
          .returning();

  const insertTvShowDirectors = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowDirectorsTable)
            .values(rows.map((row) => ({ tvShowId, personId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShowWriters = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowWritersTable)
            .values(rows.map((row) => ({ tvShowId, personId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShowStars = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowStarsTable)
            .values(rows.map((row) => ({ tvShowId, personId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShowGenres = (tvShowId: string, rows: ReadonlyArray<GenreRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db
            .insert(tvShowGenresTable)
            .values(rows.map((row) => ({ tvShowId, genreId: row.id })))
            .onConflictDoNothing(),
        );

  const insertTvShow = (row: TvShowInsert) =>
    db
      .insert(tvShowsTable)
      .values(row)
      .returning()
      .pipe(Effect.map((rows) => rows[0]));

  const selectTvShowById = (tvShowId: string) =>
    db.select().from(tvShowsTable).where(eq(tvShowsTable.id, tvShowId));

  const selectTvShowWithRelationsById = (tvShowId: string) =>
    db
      .select({
        tvShow: tvShowsTable,
        director: {
          tvShowId: tvShowDirectorsTable.tvShowId,
          id: directorPersons.id,
          firstName: directorPersons.firstName,
          lastName: directorPersons.lastName,
        },
        writer: {
          tvShowId: tvShowWritersTable.tvShowId,
          id: writerPersons.id,
          firstName: writerPersons.firstName,
          lastName: writerPersons.lastName,
        },
        star: {
          tvShowId: tvShowStarsTable.tvShowId,
          id: starPersons.id,
          firstName: starPersons.firstName,
          lastName: starPersons.lastName,
        },
        genre: {
          tvShowId: tvShowGenresTable.tvShowId,
          id: genresTable.id,
          name: genresTable.name,
          description: genresTable.description,
        },
      })
      .from(tvShowsTable)
      .leftJoin(tvShowDirectorsTable, eq(tvShowDirectorsTable.tvShowId, tvShowsTable.id))
      .leftJoin(directorPersons, eq(tvShowDirectorsTable.personId, directorPersons.id))
      .leftJoin(tvShowWritersTable, eq(tvShowWritersTable.tvShowId, tvShowsTable.id))
      .leftJoin(writerPersons, eq(tvShowWritersTable.personId, writerPersons.id))
      .leftJoin(tvShowStarsTable, eq(tvShowStarsTable.tvShowId, tvShowsTable.id))
      .leftJoin(starPersons, eq(tvShowStarsTable.personId, starPersons.id))
      .leftJoin(tvShowGenresTable, eq(tvShowGenresTable.tvShowId, tvShowsTable.id))
      .leftJoin(genresTable, eq(tvShowGenresTable.genreId, genresTable.id))
      .where(eq(tvShowsTable.id, tvShowId));

  const selectTvShows = (offset = 0, limit = 10) =>
    db.select().from(tvShowsTable).limit(limit).offset(offset);

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
