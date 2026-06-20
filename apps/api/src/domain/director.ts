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

export type ValidatedNewDirector = {
  firstName: PersonName;
  lastName: PersonName;
};

export const validateNewDirector = (input: NewDirectorInput): Result<ValidatedNewDirector> => {
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
