import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const uuidField = {
  id: uuid("id").primaryKey().defaultRandom(),
};

const timestampsFields = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
};

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
  ...timestampsFields,
});
