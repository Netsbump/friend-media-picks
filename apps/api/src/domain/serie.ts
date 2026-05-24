const DomainErrorCode = {
  EMPTY_TITLE: "EMPTY_TITLE",
  INVALID_SEASONS: "INVALID_SEASONS",
} as const;

export type DomainError =
  | { code: typeof DomainErrorCode.EMPTY_TITLE; message: string }
  | { code: typeof DomainErrorCode.INVALID_SEASONS; message: string };

/**
 * Brand<T, B> creates a nominal-like type from a base type T.
 * - T is the runtime/base type (string, number, ...)
 * - B is a string label ("SerieTitle", "SeasonCount", ...) used only by TypeScript
 * The intersection (T & { readonly __brand: B }) keeps T at runtime
 * but makes differently branded values incompatible at compile time.
 */
type Brand<T, B extends string> = T & { readonly __brand: B };

// Value Object (types)
export type SerieTitle = Brand<string, "SerieTitle">;
export type SeasonCount = Brand<number, "SeasonCount">;

export type Result<T> = { success: true; value: T } | { success: false; error: DomainError };

const createSerieTitle = (raw: string): Result<SerieTitle> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: { code: DomainErrorCode.EMPTY_TITLE, message: "Title cannot be empty." },
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
      error: {
        code: DomainErrorCode.INVALID_SEASONS,
        message: "Serie must have at least one season.",
      },
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
