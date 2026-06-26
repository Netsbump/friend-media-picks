import type { Director, ValidatedDirector } from "../domain/director.js";
import { unwrapGenreName, type Genre, type ValidatedGenre } from "../domain/genre.js";
import type { Star, ValidatedStar } from "../domain/star.js";
import { unwrapPersonName } from "../domain/shared/person-name.js";
import {
  unwrapEpisodeCount,
  unwrapSeasonCount,
  unwrapTvShowName,
  type TvShow,
  type ValidatedTvShow,
} from "../domain/tvshow.js";
import type { ValidatedWriter, Writer } from "../domain/writer.js";
import type { GenreInsert, GenreRow } from "./schemas/genre.schema.js";
import type { PersonInsert, PersonRow } from "./schemas/person.schema.js";
import type { TvShowInsert, TvShowRow } from "./schemas/tvshow.schema.js";

export type PersonProjection = Pick<PersonRow, "id" | "firstName" | "lastName">;
export type GenreProjection = Pick<GenreRow, "id" | "name" | "description">;

export const toTvShowInsert = (tvShow: ValidatedTvShow): TvShowInsert => ({
  name: unwrapTvShowName(tvShow.name),
  description: tvShow.description,
  seasons: unwrapSeasonCount(tvShow.seasons),
  episodes: unwrapEpisodeCount(tvShow.episodes),
  releaseAt: tvShow.releaseAt,
});

export const toPersonInsert = (
  person: ValidatedDirector | ValidatedWriter | ValidatedStar,
): PersonInsert => ({
  firstName: unwrapPersonName(person.firstName),
  lastName: unwrapPersonName(person.lastName),
});

export const toGenreInsert = (genre: ValidatedGenre): GenreInsert => ({
  name: unwrapGenreName(genre.name),
  description: genre.description,
});

export const toDirectorDomain = (person: PersonProjection): Director => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

export const toWriterDomain = (person: PersonProjection): Writer => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

export const toStarDomain = (person: PersonProjection): Star => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
});

export const toGenreDomain = (genre: GenreProjection): Genre => ({
  id: genre.id,
  name: genre.name,
  description: genre.description,
});

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
  name: row.name,
  description: row.description,
  seasons: row.seasons,
  episodes: row.episodes,
  releaseAt: row.releaseAt,
  directors: relations.directors,
  writers: relations.writers,
  stars: relations.stars,
  genres: relations.genres,
});
