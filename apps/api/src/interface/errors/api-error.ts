import { Data } from "effect";

import {
  SerieRepositoryErrorReason,
  type SerieRepositoryErrorReason as SerieRepositoryErrorReasonType,
} from "../../infrastructure/serie.repository.js";
import { env } from "../../../config/env.config.js";

export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DOMAIN_ERROR: "DOMAIN_ERROR",
  SCHEMA_MISSING: "SCHEMA_MISSING",
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
      issues?: unknown;
      reason?: SerieRepositoryErrorReasonType;
      code?: string;
    };

    if (taggedError._tag === "ValidationError") {
      return new ApiError({
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        message: taggedError.message ?? "Invalid request payload",
        details: taggedError.issues,
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
        code: taggedError.reason ?? SerieRepositoryErrorReason.UNKNOWN,
        message:
          taggedError.reason === SerieRepositoryErrorReason.SCHEMA_MISSING
            ? "Database schema is missing"
            : "Persistence failed",
        details:
          env.nodeEnv === "development"
            ? {
                reason: taggedError.reason,
                internalMessage: taggedError.message,
                hint:
                  taggedError.reason === SerieRepositoryErrorReason.SCHEMA_MISSING
                    ? "Run: pnpm --filter @friend-media-picks/api db:migrate"
                    : undefined,
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
