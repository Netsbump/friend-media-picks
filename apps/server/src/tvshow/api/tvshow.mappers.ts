import type { Director } from "../domain/director.js";
import type { Genre } from "../domain/genre.js";
import type { Star } from "../domain/star.js";
import type { TvShow } from "../domain/tvshow.js";
import type { Writer } from "../domain/writer.js";
import type {
  GenreResponse,
  PersonResponse,
  TvShowResponse,
  TvShowsResponse,
} from "./tvshow.api.schemas.js";

const toPersonResponse = (person: Director | Writer | Star): PersonResponse => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

const toGenreResponse = (genre: Genre): GenreResponse => ({
  id: genre.id,
  name: genre.name,
  description: genre.description,
});

export const toTvShowResponse = (tvShow: TvShow): TvShowResponse => ({
  id: tvShow.id,
  name: tvShow.name,
  description: tvShow.description,
  seasons: tvShow.seasons,
  episodes: tvShow.episodes,
  releaseAt: tvShow.releaseAt.toISOString(),
  directors: tvShow.directors.map(toPersonResponse),
  writers: tvShow.writers.map(toPersonResponse),
  stars: tvShow.stars.map(toPersonResponse),
  genres: tvShow.genres.map(toGenreResponse),
});

export const toTvShowsResponse = (tvShows: ReadonlyArray<TvShow>): TvShowsResponse =>
  tvShows.map((tvShow) => toTvShowResponse(tvShow));
