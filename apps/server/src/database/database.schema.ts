import { genres } from "./schemas/genre.schema.js";
import { persons } from "./schemas/person.schema.js";
import {
  tvShowDirectors,
  tvShowGenres,
  tvShows,
  tvShowStars,
  tvShowWriters,
} from "./schemas/tvshow.schema.js";

export const dbSchema = {
  genres,
  persons,
  tvShows,
  tvShowDirectors,
  tvShowGenres,
  tvShowStars,
  tvShowWriters,
};

export type DbSchema = typeof dbSchema;
