import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestampFields, uuidField } from "./shared.schema.js";

export const series = pgTable("series", {
  ...uuidField,
  title: text("title").notNull(),
  description: text("description").notNull(),
  seasons: integer("seasons").notNull(),
  producer: text("producer").notNull(),
  releaseAt: timestamp("release_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ...timestampFields,
});

export type SerieRow = InferSelectModel<typeof series>;
export type SerieInsert = InferInsertModel<typeof series>;
