import { pgTable, text } from "drizzle-orm/pg-core";
import { timestampFields, uuidField } from "./shared.schema.js";

export const persons = pgTable("persons", {
  ...uuidField,
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  ...timestampFields,
});
