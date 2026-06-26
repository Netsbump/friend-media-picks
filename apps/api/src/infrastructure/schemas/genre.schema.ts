import { pgTable, text } from "drizzle-orm/pg-core";
import { timestampFields, uuidField } from "./shared.schema.js";

export const genres = pgTable("genres", {
  ...uuidField,
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  ...timestampFields,
});
