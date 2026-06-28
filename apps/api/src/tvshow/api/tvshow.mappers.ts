import type { Director } from "../domain/director.js";
import type { Genre } from "../domain/genre.js";
import type { Star } from "../domain/star.js";
import type { TvShow } from "../domain/tvshow.js";
import type { Writer } from "../domain/writer.js";

type PersonApiResponse = {
  id: string;
  firstName: string;
  lastName: string;
};

type GenreApiResponse = {
  id: string;
  name: string;
  description: string;
};

export type TvShowApiResponse = {
  id: string;
  name: string;
  description: string;
  seasons: number;
  episodes: number;
  releaseAt: string;
  directors: ReadonlyArray<PersonApiResponse>;
  writers: ReadonlyArray<PersonApiResponse>;
  stars: ReadonlyArray<PersonApiResponse>;
  genres: ReadonlyArray<GenreApiResponse>;
};

const toPersonApiResponse = (person: Director | Writer | Star): PersonApiResponse => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

const toGenreApiResponse = (genre: Genre): GenreApiResponse => ({
  id: genre.id,
  name: genre.name,
  description: genre.description,
});

export const toTvShowApiResponse = (tvShow: TvShow): TvShowApiResponse => ({
  id: tvShow.id,
  name: tvShow.name,
  description: tvShow.description,
  seasons: tvShow.seasons,
  episodes: tvShow.episodes,
  releaseAt: tvShow.releaseAt.toISOString(),
  directors: tvShow.directors.map(toPersonApiResponse),
  writers: tvShow.writers.map(toPersonApiResponse),
  stars: tvShow.stars.map(toPersonApiResponse),
  genres: tvShow.genres.map(toGenreApiResponse),
});

export const toTvShowsApiResponse = (
  tvShows: ReadonlyArray<TvShow>,
): ReadonlyArray<TvShowApiResponse> => tvShows.map((tvShow) => toTvShowApiResponse(tvShow));
