import { createPersonName, type PersonName } from "./shared/person-name.js";
import type { Result } from "./shared/type.js";

export type Star = {
  id: string;
  firstName: string;
  lastName: string;
};

export type NewStarInput = {
  firstName: string;
  lastName: string;
};

export type ValidatedStar = {
  firstName: PersonName;
  lastName: PersonName;
};

export const validateNewStar = (input: NewStarInput): Result<ValidatedStar> => {
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

export const validateNewStars = (
  inputs: ReadonlyArray<NewStarInput>,
): Result<ReadonlyArray<ValidatedStar>> => {
  const stars: ValidatedStar[] = [];

  for (const input of inputs) {
    const starResult = validateNewStar(input);

    if (!starResult.success) {
      return starResult;
    }

    stars.push(starResult.value);
  }

  return {
    success: true,
    value: stars,
  };
};
