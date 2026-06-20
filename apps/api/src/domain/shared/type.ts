export const DomainErrorCode = {
  EMPTY_TITLE: "EMPTY_TITLE",
  EMPTY_PERSON_NAME: "EMPTY_PERSON_NAME",
  INVALID_SEASONS: "INVALID_SEASONS",
  INVALID_EPISODES: "INVALID EPISODES",
} as const;

export type DomainError =
  | { code: typeof DomainErrorCode.EMPTY_TITLE; message: string }
  | { code: typeof DomainErrorCode.EMPTY_PERSON_NAME; message: string }
  | { code: typeof DomainErrorCode.INVALID_SEASONS; message: string }
  | { code: typeof DomainErrorCode.INVALID_EPISODES; message: string };

/**
 * Brand<T, B> creates a nominal-like type from a base type T.
 * - T is the runtime/base type (string, number, ...)
 * - B is a string label ("SerieTitle", "SeasonCount", ...) used only by TypeScript
 * The intersection (T & { readonly __brand: B }) keeps T at runtime
 * but makes differently branded values incompatible at compile time.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Result<T> = { success: true; value: T } | { success: false; error: DomainError };
