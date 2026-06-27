import { HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import type { DomainError } from "../../domain/shared/type.js";
import type { RepositoryError } from "../../application/repository.error.js";
import { toApiError } from "./api-error.js";
import type { SchemaValidationError } from "../tvshow.handler.js";

const isDevelopment = process.env.NODE_ENV === "development";

const toHttpResponse = (error: unknown) => {
  const apiError = toApiError(error, { includeInternalDetails: isDevelopment });

  return HttpServerResponse.json(
    {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    },
    { status: apiError.status },
  );
};

const logError = (error: unknown) =>
  Effect.gen(function* () {
    const apiError = toApiError(error, { includeInternalDetails: isDevelopment });

    yield* Effect.logError(
      `[API_ERROR] status=${apiError.status} code=${apiError.code} message=${apiError.message}`,
    );

    if (isDevelopment && apiError.details) {
      yield* Effect.logError(`[API_ERROR_DETAILS] ${String(apiError.details)}`);
    }
  });

const logAndRespond = (error: unknown) =>
  Effect.gen(function* () {
    yield* logError(error);
    return yield* toHttpResponse(error);
  });

export const catchApiErrors = <Success, Requirements>(
  effect: Effect.Effect<Success, unknown, Requirements>,
) =>
  effect.pipe(
    // Handle expected tagged errors explicitly.
    Effect.catchTags({
      SchemaValidationError: (error: SchemaValidationError) => logAndRespond(error),
      DomainError: (error: DomainError) => logAndRespond(error),
      RepositoryError: (error: RepositoryError) => logAndRespond(error),
    }),
    // Catch defects / unknown errors as last-resort 500.
    Effect.catchAll((error) => logAndRespond(error)),
  );
