import { DomainErrorCode, type Brand, type Result } from "./shared/type.js";

export type Genre = {
  id: string;
  name: string;
  description: string;
};

export type GenreName = Brand<string, "GenreName">;
export const unwrapSerieName = (name: GenreName): string => name;

export const createGenreName = (raw: string): Result<GenreName> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: { code: DomainErrorCode.EMPTY_TITLE, message: "Genre name cannot be empty." },
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

export type ValidatedNewGenre = {
  name: GenreName;
  description: string;
};

export const validateNewGenre = (input: NewGenreInput): Result<ValidatedNewGenre> => {
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
