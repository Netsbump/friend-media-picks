import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { genres } from "./genre.schema.js";
import { persons } from "./person.schema.js";
import { timestampFields, uuidField } from "./shared.schema.js";

export const tvShows = pgTable("tv_shows", {
  ...uuidField,
  name: text("name").notNull(),
  description: text("description").notNull(),
  seasons: integer("seasons").notNull(),
  episodes: integer("episodes").notNull(),
  releaseAt: timestamp("release_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ...timestampFields,
});

export const tvShowDirectors = pgTable(
  "tv_show_directors",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShows.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.personId] })],
);

export const tvShowWriters = pgTable(
  "tv_show_writers",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShows.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.personId] })],
);

export const tvShowStars = pgTable(
  "tv_show_stars",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShows.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.personId] })],
);

export const tvShowGenres = pgTable(
  "tv_show_genres",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShows.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.genreId] })],
);

export type TvShowRow = InferSelectModel<typeof tvShows>;
export type TvShowInsert = InferInsertModel<typeof tvShows>;
