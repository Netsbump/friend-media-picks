import type { genres } from "./schemas/genre.schema.js";
import type { persons } from "./schemas/person.schema.js";
import type { series } from "./schemas/serie.schema.js";
import type {
  tvShowDirectors,
  tvShowGenres,
  tvShows,
  tvShowStars,
  tvShowWriters,
} from "./schemas/tvshow.schema.js";

export type DbSchema = {
  genres: typeof genres;
  persons: typeof persons;
  series: typeof series;
  tvShows: typeof tvShows;
  tvShowDirectors: typeof tvShowDirectors;
  tvShowGenres: typeof tvShowGenres;
  tvShowStars: typeof tvShowStars;
  tvShowWriters: typeof tvShowWriters;
};
