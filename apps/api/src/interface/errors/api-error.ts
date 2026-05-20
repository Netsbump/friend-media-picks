import { Data, Effect } from "effect";

import { loadEnv } from "../../infrastructure/config/env.config.js";

const env = Effect.runSync(loadEnv);

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

export const toApiError = (error: unknown): ApiError => {
  if (error && typeof error === "object" && "_tag" in error) {
    const taggedError = error as {
      _tag: string;
      message?: string;
      details?: unknown;
      code?: string;
    };

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
        details:
          env.nodeEnv === "development"
            ? {
                internalMessage: taggedError.message,
              }
            : undefined,
      });
    }
  }

  return new ApiError({
    status: 500,
    code: ApiErrorCode.UNEXPECTED_ERROR,
    message: "Unexpected error",
  });
};
