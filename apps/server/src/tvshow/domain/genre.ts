import { DomainErrorCode, domainError, type Brand, type ValidationResult } from "./type.js";

export type Genre = {
  id: string;
  name: GenreName;
  description: string;
};

export type GenreName = Brand<string, "GenreName">;
export const unwrapGenreName = (name: GenreName): string => name;

export const validateGenreName = (genreName: string): ValidationResult => {
  const value = genreName.trim();

  if (value.length === 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.EMPTY_NAME, "Genre name cannot be empty."),
    };
  }

  return {
    success: true,
  };
};

export type GenreCreation = {
  name: string;
  description: string;
};

export const validateNewGenre = (newGenre: GenreCreation): ValidationResult => {
  const nameResult = validateGenreName(newGenre.name);
  if (!nameResult.success) return nameResult;

  return {
    success: true,
  };
};

export const validateNewGenres = (newGenres: ReadonlyArray<GenreCreation>): ValidationResult => {
  for (const newGenre of newGenres) {
    const genreResult = validateNewGenre(newGenre);

    if (!genreResult.success) {
      return genreResult;
    }
  }

  return {
    success: true,
  };
};
