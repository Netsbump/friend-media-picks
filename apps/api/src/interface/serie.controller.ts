import { Data, Effect } from "effect";

import { createSerieUseCase } from "../application/create-serie.use-case.js";
import type { Serie } from "../domain/serie.js";
import z from "zod";

const createSerieSchema = z.object({
  title: z.string(),
  description: z.string(),
  seasons: z.number(),
  producer: z.string(),
  releaseAt: z.coerce.date(),
});

export class RequestValidationError extends Data.TaggedError("ValidationError")<{
  issues: z.ZodError["issues"];
}> {}

const parseCreateSerieInput = (input: unknown) =>
  Effect.suspend(() => {
    const parsed = createSerieSchema.safeParse(input);
    return parsed.success
      ? Effect.succeed(parsed.data)
      : Effect.fail(new RequestValidationError({ issues: parsed.error.issues }));
  });

const mapToClientShape = (serie: Serie): Serie => serie;

export const createSerieHttpHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedSerie = yield* parseCreateSerieInput(input);

    const serie = yield* createSerieUseCase(parsedSerie);

    return mapToClientShape(serie);
  });
