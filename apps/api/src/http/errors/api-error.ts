import { Data } from "effect";

export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DOMAIN_ERROR: "DOMAIN_ERROR",
  PERSISTENCE_ERROR: "PERSISTENCE_ERROR",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

export class ApiError extends Data.TaggedError("ApiError")<{
  status: 400 | 422 | 500;
  code: string;
  message: string;
  details?: unknown;
}> {}

type TaggedError = {
  _tag: string;
  message?: string;
  details?: unknown;
  code?: string;
};

const isTaggedError = (error: unknown): error is TaggedError =>
  Boolean(error && typeof error === "object" && "_tag" in error);

export const toApiError = (
  error: unknown,
  options?: { includeInternalDetails?: boolean },
): ApiError => {
  const includeInternalDetails = options?.includeInternalDetails ?? false;

  // We map known tagged errors first (expected application failures).
  if (isTaggedError(error)) {
    const taggedError = error;

    if (taggedError._tag === "ValidationError") {
      return new ApiError({
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        message: taggedError.message ?? "Invalid request payload",
        details: taggedError.details,
      });
    }

    if (taggedError._tag === "DomainError") {
      return new ApiError({
        status: 422,
        code: taggedError.code ?? ApiErrorCode.DOMAIN_ERROR,
        message: taggedError.message ?? "Domain validation failed",
      });
    }

    if (taggedError._tag === "SerieRepositoryError") {
      return new ApiError({
        status: 500,
        code: ApiErrorCode.PERSISTENCE_ERROR,
        message: "Persistence failed",
        // Keep technical details only when explicitly enabled.
        details: includeInternalDetails ? { internalMessage: taggedError.message } : undefined,
      });
    }
  }

  // Fallback for defects / unknown errors.
  return new ApiError({
    status: 500,
    code: ApiErrorCode.UNEXPECTED_ERROR,
    message: "Unexpected error",
  });
};
