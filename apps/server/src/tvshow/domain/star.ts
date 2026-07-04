import { validatePersonName, type PersonName } from "./personName.js";
import type { ValidationResult } from "./type.js";

export type Star = {
  id: string;
  firstName: PersonName;
  lastName: PersonName;
};

export type StarCreation = {
  firstName: string;
  lastName: string;
};

export const validateNewStar = (newStar: StarCreation): ValidationResult => {
  const firstNameResult = validatePersonName(newStar.firstName);
  if (!firstNameResult.success) return firstNameResult;

  const lastNameResult = validatePersonName(newStar.lastName);
  if (!lastNameResult.success) return lastNameResult;

  return {
    success: true,
  };
};

export const validateNewStars = (newStars: ReadonlyArray<StarCreation>): ValidationResult => {
  for (const newStar of newStars) {
    const starResult = validateNewStar(newStar);

    if (!starResult.success) {
      return starResult;
    }
  }

  return {
    success: true,
  };
};
