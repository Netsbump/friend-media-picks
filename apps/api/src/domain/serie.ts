import { Data, Effect } from "effect";

export type Serie = {
  id: string;
  title: string;
  description: string;
  seasons: number;
  producer: string;
  releaseAt: Date;
};

export type NewSerie = {
  title: string;
  description: string;
  seasons: number;
  producer: string;
  releaseAt: Date;
};

export class DomainError extends Data.TaggedError("DomainError")<{
  message: string;
}> {}

export const validateDomainSerie = (
  input: NewSerie,
): Effect.Effect<NewSerie, DomainError> =>
  Effect.gen(function* () {
    if (input.title.trim().length === 0) {
      return yield* new DomainError({ message: "Title cannot be empty." });
    }

    if (input.seasons <= 0) {
      return yield* new DomainError({
        message: "Season must have at least one season.",
      });
    }

    return input;
  });
