import { Data } from "effect";
import { RepositoryErrorCode } from "../../application/repository.error.js";

export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DOMAIN_ERROR: "DOMAIN_ERROR",
  NOT_FOUND: "NOT_FOUND",
  PERSISTENCE_ERROR: "PERSISTENCE_ERROR",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

export class ApiError extends Data.TaggedError("ApiError")<{
  status: 400 | 404 | 422 | 500;
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

    if (taggedError._tag === "SchemaValidationError") {
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

    if (taggedError._tag === "RepositoryError") {
      const repositoryCode = taggedError.code;
      const isNotFound = repositoryCode === RepositoryErrorCode.NOT_FOUND;

      return new ApiError({
        // Repository failures can map to either 404 (missing entity) or 500 (storage failure).
        status: isNotFound ? 404 : 500,
        code: isNotFound ? ApiErrorCode.NOT_FOUND : ApiErrorCode.PERSISTENCE_ERROR,
        message: isNotFound ? "Resource not found" : "Persistence failed",
        // Expose technical context only in development.
        details: includeInternalDetails
          ? { internalMessage: taggedError.message, context: taggedError.details }
          : undefined,
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
