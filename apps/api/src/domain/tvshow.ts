import {
  validateNewDirectors,
  type Director,
  type NewDirectorInput,
  type ValidatedNewDirector,
} from "./director.js";
import {
  validateNewGenres,
  type Genre,
  type NewGenreInput,
  type ValidatedNewGenre,
} from "./genre.js";
import { validateNewStars, type NewStarInput, type Star, type ValidatedNewStar } from "./star.js";
import {
  validateNewWriters,
  type NewWriterInput,
  type ValidatedNewWriter,
  type Writer,
} from "./writer.js";
import { DomainErrorCode, domainError, type Brand, type Result } from "./shared/type.js";

export type TvShow = {
  id: string;
  name: string;
  description: string;
  seasons: number;
  episodes: number;
  releaseAt: Date;
  directors: ReadonlyArray<Director>;
  writers: ReadonlyArray<Writer>;
  stars: ReadonlyArray<Star>;
  genres: ReadonlyArray<Genre>;
};

export type TvShowName = Brand<string, "TvShowName">;
export const unwrapTvShowName = (name: TvShowName): string => name;

const createTvShowName = (raw: string): Result<TvShowName> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.EMPTY_TITLE, "TvShow name cannot be empty."),
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
      error: domainError(DomainErrorCode.INVALID_SEASONS, "TvShow must have at least one season."),
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
      error: domainError(
        DomainErrorCode.INVALID_EPISODES,
        "TvShow must have at least one episode.",
      ),
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
  directors: ReadonlyArray<NewDirectorInput>;
  writers: ReadonlyArray<NewWriterInput>;
  stars: ReadonlyArray<NewStarInput>;
  genres: ReadonlyArray<NewGenreInput>;
};

export type ValidatedTvShow = {
  name: TvShowName;
  description: string;
  seasons: SeasonCount;
  episodes: EpisodeCount;
  releaseAt: Date;
  directors: ReadonlyArray<ValidatedNewDirector>;
  writers: ReadonlyArray<ValidatedNewWriter>;
  stars: ReadonlyArray<ValidatedNewStar>;
  genres: ReadonlyArray<ValidatedNewGenre>;
};

export const validateNewTvShow = (input: NewTvShowInput): Result<ValidatedTvShow> => {
  const nameResult = createTvShowName(input.name);
  if (!nameResult.success) return nameResult;

  const seasonsResult = createSeasonCount(input.seasons);
  if (!seasonsResult.success) return seasonsResult;

  const episodesResult = createEpisodeCount(input.episodes);
  if (!episodesResult.success) return episodesResult;

  const directorsResult = validateNewDirectors(input.directors);
  if (!directorsResult.success) return directorsResult;

  const writersResult = validateNewWriters(input.writers);
  if (!writersResult.success) return writersResult;

  const starsResult = validateNewStars(input.stars);
  if (!starsResult.success) return starsResult;

  const genresResult = validateNewGenres(input.genres);
  if (!genresResult.success) return genresResult;

  return {
    success: true,
    value: {
      name: nameResult.value,
      description: input.description,
      seasons: seasonsResult.value,
      episodes: episodesResult.value,
      releaseAt: input.releaseAt,
      directors: directorsResult.value,
      writers: writersResult.value,
      stars: starsResult.value,
      genres: genresResult.value,
    },
  };
};
