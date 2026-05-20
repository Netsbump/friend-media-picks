import { series } from "../serie.schema.js";

export type DbSchema = {
  series: typeof series;
};
