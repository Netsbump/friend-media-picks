import { DomainErrorCode, domainError, type Brand, type Result } from "./shared/type.js";

// Value Object (types)
export type SerieTitle = Brand<string, "SerieTitle">;
export type SeasonCount = Brand<number, "SeasonCount">;

const createSerieTitle = (raw: string): Result<SerieTitle> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.EMPTY_TITLE, "Title cannot be empty."),
    };
  }

  return {
    success: true,
    value: value as SerieTitle,
  };
};

const createSeasonCount = (raw: number): Result<SeasonCount> => {
  if (!Number.isInteger(raw) || raw <= 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.INVALID_SEASONS, "Serie must have at least one season."),
    };
  }

  return {
    success: true,
    value: raw as SeasonCount,
  };
};

export const unwrapSerieTitle = (title: SerieTitle): string => title;
export const unwrapSeasonCount = (count: SeasonCount): number => count;

export type Serie = {
  id: string;
  title: string;
  description: string;
  seasons: number;
  producer: string;
  releaseAt: Date;
};

export type NewSerieInput = {
  title: string;
  description: string;
  seasons: number;
  producer: string;
  releaseAt: Date;
};

export type ValidatedNewSerie = {
  title: SerieTitle;
  description: string;
  seasons: SeasonCount;
  producer: string;
  releaseAt: Date;
};

export const validateNewSerie = (input: NewSerieInput): Result<ValidatedNewSerie> => {
  const titleResult = createSerieTitle(input.title);
  if (!titleResult.success) return titleResult;

  const seasonsResult = createSeasonCount(input.seasons);
  if (!seasonsResult.success) return seasonsResult;

  return {
    success: true,
    value: {
      title: titleResult.value,
      description: input.description,
      seasons: seasonsResult.value,
      producer: input.producer,
      releaseAt: input.releaseAt,
    },
  };
};
