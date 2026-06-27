import { eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import type { ValidatedDirector } from "../domain/director.js";
import type { ValidatedGenre } from "../domain/genre.js";
import type { ValidatedStar } from "../domain/star.js";
import type { ValidatedWriter } from "../domain/writer.js";
import type { Database } from "../database/db.client.js";
import { genres, type GenreRow } from "./schemas/genre.schema.js";
import { persons, type PersonRow } from "./schemas/person.schema.js";
import {
  tvShowDirectors,
  tvShowGenres,
  tvShows,
  tvShowStars,
  tvShowWriters,
  type TvShowInsert,
} from "./schemas/tvshow.schema.js";
import { toGenreInsert, toPersonInsert } from "./tvshow.mappers.js";

type TvShowQueryExecutor = Pick<Database, "insert" | "select">;

export const makeTvShowQueries = (db: TvShowQueryExecutor) => {
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

  const insertPersons = (
    input: ReadonlyArray<ValidatedDirector | ValidatedWriter | ValidatedStar>,
  ) =>
    input.length === 0
      ? Effect.succeed([])
      : db
          .insert(persons)
          .values(input.map((person) => toPersonInsert(person)))
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
          db.insert(tvShowDirectors).values(rows.map((row) => ({ tvShowId, personId: row.id }))),
        );

  const insertTvShowWriters = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db.insert(tvShowWriters).values(rows.map((row) => ({ tvShowId, personId: row.id }))),
        );

  const insertTvShowStars = (tvShowId: string, rows: ReadonlyArray<PersonRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db.insert(tvShowStars).values(rows.map((row) => ({ tvShowId, personId: row.id }))),
        );

  const insertTvShowGenres = (tvShowId: string, rows: ReadonlyArray<GenreRow>) =>
    rows.length === 0
      ? Effect.void
      : Effect.asVoid(
          db.insert(tvShowGenres).values(rows.map((row) => ({ tvShowId, genreId: row.id }))),
        );

  const insertTvShow = (row: TvShowInsert) => db.insert(tvShows).values(row).returning();

  const selectTvShowById = (tvShowId: string) =>
    db.select().from(tvShows).where(eq(tvShows.id, tvShowId));

  const selectTvShows = () => db.select().from(tvShows);

  return {
    selectTvShowById,
    selectTvShows,
    insertGenres,
    insertPersons,
    insertTvShow,
    insertTvShowDirectors,
    insertTvShowGenres,
    insertTvShowStars,
    insertTvShowWriters,
    selectDirectors,
    selectGenres,
    selectStars,
    selectWriters,
  };
};
