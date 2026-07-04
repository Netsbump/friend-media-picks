import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { genresTable } from "./genre.schema.js";
import { personsTable } from "./person.schema.js";
import { timestampFields, uuidField } from "./shared.schema.js";

export const tvShowsTable = pgTable("tv_shows", {
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

export const tvShowDirectorsTable = pgTable(
  "tv_show_directors",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShowsTable.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => personsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.personId] })],
);

export const tvShowWritersTable = pgTable(
  "tv_show_writers",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShowsTable.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => personsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.personId] })],
);

export const tvShowStarsTable = pgTable(
  "tv_show_stars",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShowsTable.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => personsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.personId] })],
);

export const tvShowGenresTable = pgTable(
  "tv_show_genres",
  {
    tvShowId: uuid("tv_show_id")
      .notNull()
      .references(() => tvShowsTable.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genresTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tvShowId, table.genreId] })],
);

export type TvShowRow = InferSelectModel<typeof tvShowsTable>;
export type TvShowInsert = InferInsertModel<typeof tvShowsTable>;
