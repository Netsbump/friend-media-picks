import { Data } from "effect";
import type { DomainError } from "../domain/type.js";
import { RepositoryErrorCode, type RepositoryError } from "./repository.error.js";

export const TvShowCatalogErrorCode = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NOT_FOUND: "NOT_FOUND",
  PERSISTENCE_FAILED: "PERSISTENCE_FAILED",
} as const;

export type TvShowCatalogErrorCode =
  (typeof TvShowCatalogErrorCode)[keyof typeof TvShowCatalogErrorCode];

export class TvShowCatalogError extends Data.TaggedError("TvShowCatalogError")<{
  code: TvShowCatalogErrorCode;
  message: string;
  cause: DomainError | RepositoryError;
}> {}

export const toTvShowCatalogError = (error: DomainError | RepositoryError): TvShowCatalogError => {
  if (error._tag === "DomainError") {
    return new TvShowCatalogError({
      code: TvShowCatalogErrorCode.VALIDATION_FAILED,
      message: error.message,
      cause: error,
    });
  }

  if (error.code === RepositoryErrorCode.NOT_FOUND) {
    return new TvShowCatalogError({
      code: TvShowCatalogErrorCode.NOT_FOUND,
      message: error.message,
      cause: error,
    });
  }

  return new TvShowCatalogError({
    code: TvShowCatalogErrorCode.PERSISTENCE_FAILED,
    message: "Could not access tv show catalog",
    cause: error,
  });
};
