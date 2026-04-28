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

const CodeDomainError = {
  EMPTY_TITLE: "EMPTY_TITLE",
  INVALID_SEASONS: "INVALID_SEASONS",
} as const;

type CodeDomainError = (typeof CodeDomainError)[keyof typeof CodeDomainError];

export class DomainError extends Data.TaggedError("DomainError")<{
  code: CodeDomainError;
  message: string;
}> {}

const validateTitle = (title: string): Effect.Effect<void, DomainError> =>
  title.trim().length > 0
    ? Effect.void
    : Effect.fail(
        new DomainError({
          code: CodeDomainError.EMPTY_TITLE,
          message: "Title cannot be empty.",
        }),
      );

const validateSeasons = (seasons: number): Effect.Effect<void, DomainError> =>
  seasons > 0
    ? Effect.void
    : Effect.fail(
        new DomainError({
          code: CodeDomainError.INVALID_SEASONS,
          message: "Serie must have at least one season.",
        }),
      );

export const validateNewSerie = (
  input: NewSerie,
): Effect.Effect<NewSerie, DomainError> =>
  Effect.all([validateTitle(input.title), validateSeasons(input.seasons)]).pipe(
    Effect.as(input),
  );
