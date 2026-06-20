import { createPersonName, type PersonName } from "./shared/person-name.js";
import type { Result } from "./shared/type.js";

export type Writer = {
  id: string;
  firstName: string;
  lastName: string;
};

export type NewWriterInput = {
  firstName: string;
  lastName: string;
};

export type ValidatedNewWriter = {
  firstName: PersonName;
  lastName: PersonName;
};

export const validateNewWriter = (input: NewWriterInput): Result<ValidatedNewWriter> => {
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
