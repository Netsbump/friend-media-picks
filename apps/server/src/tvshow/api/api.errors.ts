import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";
import { RepositoryErrorCode } from "../application/repository.error.js";

export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DOMAIN_ERROR: "DOMAIN_ERROR",
  NOT_FOUND: "NOT_FOUND",
  PERSISTENCE_ERROR: "PERSISTENCE_ERROR",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

type ApiError = {
  status: 400 | 404 | 422 | 500;
  code: string;
  message: string;
  details?: unknown;
};

type TaggedError = {
  _tag: string;
  message?: string;
  details?: unknown;
  code?: string;
};

export class BadRequestApiError extends Schema.TaggedError<BadRequestApiError>()(
  "BadRequestApiError",
  {
    code: Schema.Literal(ApiErrorCode.VALIDATION_ERROR),
    message: Schema.String,
    details: Schema.optional(Schema.Unknown),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class NotFoundApiError extends Schema.TaggedError<NotFoundApiError>()(
  "NotFoundApiError",
  {
    code: Schema.Literal(ApiErrorCode.NOT_FOUND),
    message: Schema.String,
    details: Schema.optional(Schema.Unknown),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class DomainApiError extends Schema.TaggedError<DomainApiError>()(
  "DomainApiError",
  {
    code: Schema.String,
    message: Schema.String,
    details: Schema.optional(Schema.Unknown),
  },
  HttpApiSchema.annotations({ status: 422 }),
) {}

export class InternalApiError extends Schema.TaggedError<InternalApiError>()(
  "InternalApiError",
  {
    code: Schema.String,
    message: Schema.String,
    details: Schema.optional(Schema.Unknown),
  },
  HttpApiSchema.annotations({ status: 500 }),
) {}

export type PublicApiError =
  | BadRequestApiError
  | NotFoundApiError
  | DomainApiError
  | InternalApiError;

const isDevelopment = () => process.env.NODE_ENV === "development";

const isTaggedError = (error: unknown): error is TaggedError =>
  Boolean(error && typeof error === "object" && "_tag" in error);

const toApiError = (error: unknown, options?: { includeInternalDetails?: boolean }): ApiError => {
  const includeInternalDetails = options?.includeInternalDetails ?? false;

  if (isTaggedError(error)) {
    if (error._tag === "SchemaValidationError") {
      return {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        message: error.message ?? "Invalid request payload",
        details: error.details,
      };
    }

    if (error._tag === "DomainError") {
      return {
        status: 422,
        code: error.code ?? ApiErrorCode.DOMAIN_ERROR,
        message: error.message ?? "Domain validation failed",
      };
    }

    if (error._tag === "RepositoryError") {
      const isNotFound = error.code === RepositoryErrorCode.NOT_FOUND;

      return {
        status: isNotFound ? 404 : 500,
        code: isNotFound ? ApiErrorCode.NOT_FOUND : ApiErrorCode.PERSISTENCE_ERROR,
        message: isNotFound ? "Resource not found" : "Persistence failed",
        details: includeInternalDetails
          ? { internalMessage: error.message, context: error.details }
          : undefined,
      };
    }
  }

  return {
    status: 500,
    code: ApiErrorCode.UNEXPECTED_ERROR,
    message: "Unexpected error",
  };
};

const toPublicApiError = (apiError: ApiError): PublicApiError => {
  if (apiError.status === 400) {
    return new BadRequestApiError({
      code: ApiErrorCode.VALIDATION_ERROR,
      message: apiError.message,
      details: apiError.details,
    });
  }

  if (apiError.status === 404) {
    return new NotFoundApiError({
      code: ApiErrorCode.NOT_FOUND,
      message: apiError.message,
      details: apiError.details,
    });
  }

  if (apiError.status === 422) {
    return new DomainApiError({
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    });
  }

  return new InternalApiError({
    code: apiError.code,
    message: apiError.message,
    details: apiError.details,
  });
};

export const mapToPublicApiError = (error: unknown): PublicApiError =>
  toPublicApiError(toApiError(error, { includeInternalDetails: isDevelopment() }));
