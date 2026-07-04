import { validateNewDirectors, type Director, type DirectorCreation } from "./director.js";
import { validateNewGenres, type Genre, type GenreCreation } from "./genre.js";
import { validateNewStars, type Star, type StarCreation } from "./star.js";
import { validateNewWriters, type Writer, type WriterCreation } from "./writer.js";
import { DomainErrorCode, domainError, type Brand, type ValidationResult } from "./type.js";

export type TvShow = {
  id: string;
  name: TvShowName;
  description: string;
  seasons: SeasonCount;
  episodes: EpisodeCount;
  releaseAt: Date;
  directors: ReadonlyArray<Director>;
  writers: ReadonlyArray<Writer>;
  stars: ReadonlyArray<Star>;
  genres: ReadonlyArray<Genre>;
};

export type TvShowName = Brand<string, "TvShowName">;
export const unwrapTvShowName = (name: TvShowName): string => name;

const validateTvShowName = (tvShowName: string): ValidationResult => {
  const value = tvShowName.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.EMPTY_NAME, "TvShow name cannot be empty."),
    };
  }

  return {
    success: true,
  };
};

export type SeasonCount = Brand<number, "SeasonCount">;
export const unwrapSeasonCount = (count: SeasonCount): number => count;

const validateSeasonCount = (seasonCount: number): ValidationResult => {
  if (!Number.isInteger(seasonCount) || seasonCount <= 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.INVALID_SEASONS, "TvShow must have at least one season."),
    };
  }

  return {
    success: true,
  };
};

export type EpisodeCount = Brand<number, "EpisodeCount">;
export const unwrapEpisodeCount = (count: EpisodeCount): number => count;

const validateEpisodeCount = (episodeCount: number): ValidationResult => {
  if (!Number.isInteger(episodeCount) || episodeCount <= 0) {
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
  };
};

export type TvShowCreation = {
  name: string;
  description: string;
  seasons: number;
  episodes: number;
  releaseAt: Date;
  directors: ReadonlyArray<DirectorCreation>;
  writers: ReadonlyArray<WriterCreation>;
  stars: ReadonlyArray<StarCreation>;
  genres: ReadonlyArray<GenreCreation>;
};

export const validateNewTvShow = (newTvShowCreation: TvShowCreation): ValidationResult => {
  const nameResult = validateTvShowName(newTvShowCreation.name);
  if (!nameResult.success) return nameResult;

  const seasonsResult = validateSeasonCount(newTvShowCreation.seasons);
  if (!seasonsResult.success) return seasonsResult;

  const episodesResult = validateEpisodeCount(newTvShowCreation.episodes);
  if (!episodesResult.success) return episodesResult;

  const directorsResult = validateNewDirectors(newTvShowCreation.directors);
  if (!directorsResult.success) return directorsResult;

  const writersResult = validateNewWriters(newTvShowCreation.writers);
  if (!writersResult.success) return writersResult;

  const starsResult = validateNewStars(newTvShowCreation.stars);
  if (!starsResult.success) return starsResult;

  const genresResult = validateNewGenres(newTvShowCreation.genres);
  if (!genresResult.success) return genresResult;

  return { success: true };
};
