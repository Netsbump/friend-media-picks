import { createPersonName, type PersonName } from "./shared/person-name.js";
import type { Result } from "./shared/type.js";

export type Director = {
  id: string;
  firstName: string;
  lastName: string;
};

export type NewDirectorInput = {
  firstName: string;
  lastName: string;
};

export type ValidatedDirector = {
  firstName: PersonName;
  lastName: PersonName;
};

export const validateNewDirector = (input: NewDirectorInput): Result<ValidatedDirector> => {
  const firstNameResult = createPersonName(input.firstName);
  if (!firstNameResult.success) return firstNameResult;

  const lastNameResult = createPersonName(input.lastName);
  if (!lastNameResult.success) return lastNameResult;

  return {
    success: true,
    value: {
      firstName: firstNameResult.value,
      lastName: lastNameResult.value,
    },
  };
};

export const validateNewDirectors = (
  inputs: ReadonlyArray<NewDirectorInput>,
): Result<ReadonlyArray<ValidatedDirector>> => {
  const directors: ValidatedDirector[] = [];

  for (const input of inputs) {
    const directorResult = validateNewDirector(input);

    if (!directorResult.success) {
      return directorResult;
    }

    directors.push(directorResult.value);
  }

  return {
    success: true,
    value: directors,
  };
};
