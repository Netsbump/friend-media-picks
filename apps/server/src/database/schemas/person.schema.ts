import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { timestampFields, uuidField } from "./shared.schema.js";

export const persons = pgTable(
  "persons",
  {
    ...uuidField,
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    ...timestampFields,
  },
  (table) => [unique("persons_first_name_last_name_unique").on(table.firstName, table.lastName)],
);

export type PersonRow = InferSelectModel<typeof persons>;
export type PersonInsert = InferInsertModel<typeof persons>;
