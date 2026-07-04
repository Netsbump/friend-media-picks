import { genresTable } from "./schemas/genre.schema.js";
import { personsTable } from "./schemas/person.schema.js";
import {
  tvShowDirectorsTable,
  tvShowGenresTable,
  tvShowsTable,
  tvShowStarsTable,
  tvShowWritersTable,
} from "./schemas/tvshow.schema.js";

export const dbSchema = {
  genres: genresTable,
  persons: personsTable,
  tvShows: tvShowsTable,
  tvShowDirectors: tvShowDirectorsTable,
  tvShowGenres: tvShowGenresTable,
  tvShowStars: tvShowStarsTable,
  tvShowWriters: tvShowWritersTable,
};

export type DbSchema = typeof dbSchema;
