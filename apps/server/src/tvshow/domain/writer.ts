import { validatePersonName, type PersonName } from "./personName.js";
import type { ValidationResult } from "./type.js";

export type Writer = {
  id: string;
  firstName: PersonName;
  lastName: PersonName;
};

export type WriterCreation = {
  firstName: string;
  lastName: string;
};

export const validateNewWriter = (newWriter: WriterCreation): ValidationResult => {
  const firstNameResult = validatePersonName(newWriter.firstName);
  if (!firstNameResult.success) return firstNameResult;

  const lastNameResult = validatePersonName(newWriter.lastName);
  if (!lastNameResult.success) return lastNameResult;

  return {
    success: true,
  };
};

export const validateNewWriters = (newWriters: ReadonlyArray<WriterCreation>): ValidationResult => {
  for (const newWriter of newWriters) {
    const writerResult = validateNewWriter(newWriter);

    if (!writerResult.success) {
      return writerResult;
    }
  }

  return {
    success: true,
  };
};
