import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { timestampFields, uuidField } from "./shared.schema.js";

export const genres = pgTable("genres", {
  ...uuidField,
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  ...timestampFields,
});

export type GenreRow = InferSelectModel<typeof genres>;
export type GenreInsert = InferInsertModel<typeof genres>;
