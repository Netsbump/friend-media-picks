import { HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";

import type { DomainError } from "../../domain/serie.js";
import { toApiError } from "./api-error.js";
import type { SerieRepositoryError } from "../../application/serie.repository.js";
import type { RequestValidationError } from "../serie.handler.js";

const isDevelopment = process.env.NODE_ENV === "development";

const toResponse = (error: unknown) => {
  // Convert domain/infrastructure failures into API-safe payloads.
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
  // Logging must not fail the request pipeline.
  Effect.gen(function* () {
    const apiError = toApiError(error, { includeInternalDetails: isDevelopment });
    yield* Effect.logError(
      `[HTTP_ERROR] status=${apiError.status} code=${apiError.code} message=${apiError.message}`,
    );
    if (isDevelopment && apiError.details) {
      yield* Effect.logError(`[HTTP_ERROR_DETAILS] ${String(apiError.details)}`);
    }
  }).pipe(Effect.orDie);

const logAndRespond = (error: unknown) => logError(error).pipe(Effect.andThen(toResponse(error)));

export const withHttpErrors = <A, R>(effect: Effect.Effect<A, unknown, R>) =>
  effect.pipe(
    // Handle expected tagged errors explicitly.
    Effect.catchTags({
      ValidationError: (error: RequestValidationError) => logAndRespond(error),
      DomainError: (error: DomainError) => logAndRespond(error),
      SerieRepositoryError: (error: SerieRepositoryError) => logAndRespond(error),
    }),
    // Catch defects / unknown errors as last-resort 500.
    Effect.catchAll((error) => logAndRespond(error)),
  );
