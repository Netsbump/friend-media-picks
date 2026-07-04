import { validatePersonName, type PersonName } from "./personName.js";
import type { ValidationResult } from "./type.js";

export type Director = {
  id: string;
  firstName: PersonName;
  lastName: PersonName;
};

export type DirectorCreation = {
  firstName: string;
  lastName: string;
};

export const validateNewDirector = (newDirector: DirectorCreation): ValidationResult => {
  const firstNameResult = validatePersonName(newDirector.firstName);
  if (!firstNameResult.success) return firstNameResult;

  const lastNameResult = validatePersonName(newDirector.lastName);
  if (!lastNameResult.success) return lastNameResult;

  return { success: true };
};

export const validateNewDirectors = (
  newDirectors: ReadonlyArray<DirectorCreation>,
): ValidationResult => {
  for (const newDirector of newDirectors) {
    const directorResult = validateNewDirector(newDirector);

    if (!directorResult.success) {
      return directorResult;
    }
  }

  return { success: true };
};
