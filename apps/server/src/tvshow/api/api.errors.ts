import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";
import { TvShowCatalogErrorCode } from "../application/tvshow.catalog.error.js";

export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DOMAIN_ERROR: "DOMAIN_ERROR",
  NOT_FOUND: "NOT_FOUND",
  PERSISTENCE_ERROR: "PERSISTENCE_ERROR",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

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

export type ApiError = BadRequestApiError | NotFoundApiError | DomainApiError | InternalApiError;

const isDevelopment = () => process.env.NODE_ENV === "development";

type TaggedError = {
  _tag: string;
  message?: string;
  details?: unknown;
  cause?: unknown;
  code?: string;
};

const isTaggedError = (error: unknown): error is TaggedError =>
  Boolean(error && typeof error === "object" && "_tag" in error);

export const toApiError = (error: unknown): ApiError => {
  if (isTaggedError(error) && error._tag === "TvShowCatalogError") {
    if (error.code === TvShowCatalogErrorCode.VALIDATION_FAILED) {
      return new DomainApiError({
        code: error.code,
        message: error.message ?? "Domain validation failed",
        details: isDevelopment() ? error.cause : undefined,
      });
    }

    if (error.code === TvShowCatalogErrorCode.NOT_FOUND) {
      return new NotFoundApiError({
        code: ApiErrorCode.NOT_FOUND,
        message: "Resource not found",
      });
    }

    return new InternalApiError({
      code: ApiErrorCode.PERSISTENCE_ERROR,
      message: "Persistence failed",
      details: isDevelopment() ? error.cause : undefined,
    });
  }

  return new InternalApiError({
    code: ApiErrorCode.UNEXPECTED_ERROR,
    message: "Unexpected error",
  });
};
