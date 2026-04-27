import { Data, Effect } from "effect";

import { createSerie } from "../../application/serie/create-serie.use-case.js";
import type { Serie } from "../../domain/serie.js";
import z from "zod";

const createSerieSchema = z.object({
  title: z.string(),
  description: z.string(),
  seasons: z.number(),
  producer: z.string(),
  releaseAt: z.coerce.date(),
});

type CreateSerieInput = z.infer<typeof createSerieSchema>;

class ValidationError extends Data.TaggedError("ValidationError")<{
  issues: z.ZodError["issues"];
}> {}

const parseCreateSerieInput = (
  input: unknown,
): Effect.Effect<CreateSerieInput, ValidationError> =>
  Effect.suspend(() => {
    const parsed = createSerieSchema.safeParse(input);
    return parsed.success
      ? Effect.succeed(parsed.data)
      : Effect.fail(new ValidationError({ issues: parsed.error.issues }));
  });

//TODO If case we need to map for Client
const mapToClientShape = (serie: Serie): Effect.Effect<Serie> =>
  Effect.succeed(serie);

export const createSerieHttpHandler = (input: unknown) =>
  Effect.gen(function* () {
    const parsedSerie = yield* parseCreateSerieInput(input);

    const serie = yield* createSerie(parsedSerie);

    return yield* mapToClientShape(serie);
  });
