import type { Director } from "./director.js";
import {
  validateNewGenre,
  type Genre,
  type NewGenreInput,
  type ValidatedNewGenre,
} from "./genre.js";
import type { Star } from "./star.js";
import type { Writer } from "./writer.js";
import { DomainErrorCode, type Brand, type Result } from "./shared/type.js";

export type TvShow = {
  id: string;
  name: string;
  description: string;
  seasons: number;
  episodes: number;
  releaseAt: Date;
  directors: Director;
  writers: Writer;
  stars: Star;
  genres: Genre;
};

export type TvShowName = Brand<string, "TvShowName">;
export const unwrapSerieName = (name: TvShowName): string => name;

const createTvShowName = (raw: string): Result<TvShowName> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: { code: DomainErrorCode.EMPTY_TITLE, message: "TvShow name cannot be empty." },
    };
  }

  return {
    success: true,
    value: value as TvShowName,
  };
};

export type SeasonCount = Brand<number, "SeasonCount">;
export const unwrapSeasonCount = (count: SeasonCount): number => count;

const createSeasonCount = (raw: number): Result<SeasonCount> => {
  if (!Number.isInteger(raw) || raw <= 0) {
    return {
      success: false,
      error: {
        code: DomainErrorCode.INVALID_SEASONS,
        message: "TvShow must have at least one season.",
      },
    };
  }

  return {
    success: true,
    value: raw as SeasonCount,
  };
};

export type EpisodeCount = Brand<number, "EpisodeCount">;
export const unwrapEpisodeCount = (count: EpisodeCount): number => count;

const createEpisodeCount = (raw: number): Result<EpisodeCount> => {
  if (!Number.isInteger(raw) || raw <= 0) {
    return {
      success: false,
      error: {
        code: DomainErrorCode.INVALID_SEASONS,
        message: "TvShow must have at least one episode.",
      },
    };
  }

  return {
    success: true,
    value: raw as EpisodeCount,
  };
};

export type NewTvShowInput = {
  name: string;
  description: string;
  seasons: number;
  episodes: number;
  releaseAt: Date;
  directors: Director;
  writers: Writer;
  stars: Star;
  genres: NewGenreInput;
};

export type ValidatedNewTvShow = {
  name: TvShowName;
  description: string;
  seasons: SeasonCount;
  episodes: EpisodeCount;
  releaseAt: Date;
  directors: Director;
  writers: Writer;
  stars: Star;
  genres: ValidatedNewGenre;
};

export const validateNewTvShow = (input: NewTvShowInput): Result<ValidatedNewTvShow> => {
  const nameResult = createTvShowName(input.name);
  if (!nameResult.success) return nameResult;

  const seasonsResult = createSeasonCount(input.seasons);
  if (!seasonsResult.success) return seasonsResult;

  const episodesResult = createEpisodeCount(input.episodes);
  if (!episodesResult.success) return episodesResult;

  const genreResult = validateNewGenre(input.genres);
  if (!genreResult.success) return genreResult;

  return {
    success: true,
    value: {
      name: nameResult.value,
      description: input.description,
      seasons: seasonsResult.value,
      episodes: episodesResult.value,
      releaseAt: input.releaseAt,
      directors: input.directors,
      writers: input.writers,
      stars: input.stars,
      genres: genreResult.value,
    },
  };
};
