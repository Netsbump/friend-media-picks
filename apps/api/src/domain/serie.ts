import { Data } from "effect";

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

export type ValidatedNewSerie = NewSerie;

export type DomainValidationResult =
  | { readonly success: true; readonly value: ValidatedNewSerie }
  | { readonly success: false; readonly error: DomainError };

const validateTitle = (title: string): DomainError | null =>
  title.trim().length > 0
    ? null
    : new DomainError({
        code: CodeDomainError.EMPTY_TITLE,
        message: "Title cannot be empty.",
      });

const validateSeasons = (seasons: number): DomainError | null =>
  seasons > 0
    ? null
    : new DomainError({
        code: CodeDomainError.INVALID_SEASONS,
        message: "Serie must have at least one season.",
      });

export const validateNewSerie = (input: NewSerie): DomainValidationResult => {
  const titleError = validateTitle(input.title);
  if (titleError) {
    return { success: false, error: titleError };
  }

  const seasonsError = validateSeasons(input.seasons);
  if (seasonsError) {
    return { success: false, error: seasonsError };
  }

  return { success: true, value: input };
};
