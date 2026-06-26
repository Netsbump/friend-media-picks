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
