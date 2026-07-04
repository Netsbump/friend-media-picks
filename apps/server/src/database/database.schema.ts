import { genresTable } from "./schemas/genre.schema.js";
import { personsTable } from "./schemas/person.schema.js";
import {
  tvShowDirectorsRelations,
  tvShowDirectorsTable,
  tvShowGenresRelations,
  tvShowGenresTable,
  tvShowsRelations,
  tvShowsTable,
  tvShowStarsRelations,
  tvShowStarsTable,
  tvShowWritersRelations,
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
  tvShowsRelations,
  tvShowDirectorsRelations,
  tvShowGenresRelations,
  tvShowStarsRelations,
  tvShowWritersRelations,
};

export type DbSchema = typeof dbSchema;
