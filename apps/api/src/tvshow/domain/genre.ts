import { DomainErrorCode, domainError, type Brand, type Result } from "./shared/type.js";

export type Genre = {
  id: string;
  name: string;
  description: string;
};

export type GenreName = Brand<string, "GenreName">;
export const unwrapGenreName = (name: GenreName): string => name;

export const createGenreName = (raw: string): Result<GenreName> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.EMPTY_TITLE, "Genre name cannot be empty."),
    };
  }

  return {
    success: true,
    value: value as GenreName,
  };
};

export type NewGenreInput = {
  name: string;
  description: string;
};

export type ValidatedGenre = {
  name: GenreName;
  description: string;
};

export const validateNewGenre = (input: NewGenreInput): Result<ValidatedGenre> => {
  const nameResult = createGenreName(input.name);
  if (!nameResult.success) return nameResult;

  return {
    success: true,
    value: {
      name: nameResult.value,
      description: input.description,
    },
  };
};

export const validateNewGenres = (
  inputs: ReadonlyArray<NewGenreInput>,
): Result<ReadonlyArray<ValidatedGenre>> => {
  const genres: ValidatedGenre[] = [];

  for (const input of inputs) {
    const genreResult = validateNewGenre(input);

    if (!genreResult.success) {
      return genreResult;
    }

    genres.push(genreResult.value);
  }

  return {
    success: true,
    value: genres,
  };
};
