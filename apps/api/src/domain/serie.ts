type Brand<T, B extends string> = T & { readonly __brand: B };

// Value Object (types)
export type SerieTitle = Brand<string, "SerieTitle">;
export type SeasonCount = Brand<number, "SeasonCount">;

export type DomainError =
  | { code: "EMPTY_TITLE"; message: string }
  | { code: "INVALID_SEASONS"; message: string };

export type Result<T> = { success: true; value: T } | { success: false; error: DomainError };

export const makeSerieTitle = (raw: string): Result<SerieTitle> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: { code: "EMPTY_TITLE", message: "Title cannot be empty." },
    };
  }

  return {
    success: true,
    value: value as SerieTitle,
  };
};

export const makeSeasonsCount = (raw: number): Result<SeasonCount> => {
  if (!Number.isInteger(raw) || raw <= 0) {
    return {
      success: false,
      error: { code: "INVALID_SEASONS", message: "Serie must have at least one season." },
    };
  }

  return {
    success: true,
    value: raw as SeasonCount,
  };
};

export const unwrapTitleSerie = (title: SerieTitle): string => title;
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
  const title = makeSerieTitle(input.title);
  if (!title.success) return title;

  const seasons = makeSeasonsCount(input.seasons);
  if (!seasons.success) return seasons;

  return {
    success: true,
    value: {
      title: title.value,
      description: input.description,
      seasons: seasons.value,
      producer: input.producer,
      releaseAt: input.releaseAt,
    },
  };
};
