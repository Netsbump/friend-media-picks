import { HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";

import type { DomainError } from "../../domain/serie.js";
import type { SerieRepositoryError } from "../../infrastructure/serie.repository.js";
import type { RequestValidationError } from "../serie.controller.js";
import { toApiError } from "./api-error.js";

const toResponse = (error: unknown) => {
  const apiError = toApiError(error);
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
  Effect.logError(`[HTTP_ERROR] ${JSON.stringify(error, null, 2)}`).pipe(Effect.orDie);

export const withHttpErrors = <A, R>(effect: Effect.Effect<A, unknown, R>) =>
  effect.pipe(
    Effect.catchTags({
      ValidationError: (error: RequestValidationError) =>
        logError(error).pipe(Effect.andThen(toResponse(error))),
      DomainError: (error: DomainError) => logError(error).pipe(Effect.andThen(toResponse(error))),
      SerieRepositoryError: (error: SerieRepositoryError) =>
        logError(error).pipe(Effect.andThen(toResponse(error))),
    }),
    Effect.catchAll((error) => logError(error).pipe(Effect.andThen(toResponse(error)))),
  );
