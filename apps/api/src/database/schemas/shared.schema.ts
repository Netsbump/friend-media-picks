import { timestamp, uuid } from "drizzle-orm/pg-core";

export const uuidField = {
  id: uuid("id").primaryKey().defaultRandom(),
};

export const timestampFields = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
};
