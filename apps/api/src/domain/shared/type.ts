export const DomainErrorCode = {
  EMPTY_TITLE: "EMPTY_TITLE",
  EMPTY_PERSON_NAME: "EMPTY_PERSON_NAME",
  INVALID_SEASONS: "INVALID_SEASONS",
  INVALID_EPISODES: "INVALID_EPISODES",
} as const;

export type DomainErrorCode = (typeof DomainErrorCode)[keyof typeof DomainErrorCode];

const DOMAIN_ERROR = "DomainError";

export type DomainError = {
  _tag: typeof DOMAIN_ERROR;
  code: DomainErrorCode;
  message: string;
};

export const domainError = (code: DomainErrorCode, message: string): DomainError => ({
  _tag: DOMAIN_ERROR,
  code,
  message,
});

/**
 * Brand<T, B> creates a nominal-like type from a base type T.
 * - T is the runtime/base type (string, number, ...)
 * - B is a string label ("SerieTitle", "SeasonCount", ...) used only by TypeScript
 * The intersection (T & { readonly __brand: B }) keeps T at runtime
 * but makes differently branded values incompatible at compile time.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Result<T> = { success: true; value: T } | { success: false; error: DomainError };
