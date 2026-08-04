import type { Director, DirectorCreation } from "../domain/director.js";
import type { Genre, GenreCreation, GenreName } from "../domain/genre.js";
import type { PersonName } from "../domain/personName.js";
import type { Star, StarCreation } from "../domain/star.js";
import type {
  EpisodeCount,
  SeasonCount,
  TvShow,
  TvShowCreation,
  TvShowName,
} from "../domain/tvshow.js";
import type { Writer, WriterCreation } from "../domain/writer.js";
import type { GenreInsert, GenreRow } from "../../database/schemas/genre.schema.js";
import type { PersonInsert, PersonRow } from "../../database/schemas/person.schema.js";
import type { TvShowInsert, TvShowRow } from "../../database/schemas/tvshow.schema.js";

export const toTvShowInsert = (tvShow: TvShowCreation): TvShowInsert => ({
  name: tvShow.name,
  description: tvShow.description,
  seasons: tvShow.seasons,
  episodes: tvShow.episodes,
  releaseAt: tvShow.releaseAt,
});

export const toPersonInsert = (
  person: DirectorCreation | WriterCreation | StarCreation,
): PersonInsert => ({
  firstName: person.firstName,
  lastName: person.lastName,
});

export const toGenreInsert = (genre: GenreCreation): GenreInsert => ({
  name: genre.name,
  description: genre.description,
});

export const toDirectorDomain = (person: PersonRow): Director => ({
  id: person.id,
  firstName: person.firstName as PersonName,
  lastName: person.lastName as PersonName,
});

export const toDirectorsDomain = (directors: ReadonlyArray<PersonRow>): ReadonlyArray<Director> =>
  directors.map((director) => toDirectorDomain(director));

export const toWriterDomain = (person: PersonRow): Writer => ({
  id: person.id,
  firstName: person.firstName as PersonName,
  lastName: person.lastName as PersonName,
});

export const toWritersDomain = (writers: ReadonlyArray<PersonRow>): ReadonlyArray<Writer> =>
  writers.map((writer) => toWriterDomain(writer));

export const toStarDomain = (person: PersonRow): Star => ({
  id: person.id,
  firstName: person.firstName as PersonName,
  lastName: person.lastName as PersonName,
});

export const toStarsDomain = (stars: ReadonlyArray<PersonRow>): ReadonlyArray<Star> =>
  stars.map((star) => toStarDomain(star));

export const toGenreDomain = (genre: GenreRow): Genre => ({
  id: genre.id,
  name: genre.name as GenreName,
  description: genre.description,
});

export const toGenresDomain = (genres: ReadonlyArray<GenreRow>): ReadonlyArray<Genre> =>
  genres.map((genre) => toGenreDomain(genre));

export const toTvShowDomain = (
  row: TvShowRow,
  relations: {
    directors: ReadonlyArray<Director>;
    writers: ReadonlyArray<Writer>;
    stars: ReadonlyArray<Star>;
    genres: ReadonlyArray<Genre>;
  },
): TvShow => ({
  id: row.id,
  name: row.name as TvShowName,
  description: row.description,
  seasons: row.seasons as SeasonCount,
  episodes: row.episodes as EpisodeCount,
  releaseAt: row.releaseAt,
  directors: relations.directors,
  writers: relations.writers,
  stars: relations.stars,
  genres: relations.genres,
});
