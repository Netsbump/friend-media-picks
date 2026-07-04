import { DomainErrorCode, domainError, type Brand, type ValidationResult } from "./type.js";

export type PersonName = Brand<string, "PersonName">;

export const validatePersonName = (personName: string): ValidationResult => {
  const value = personName.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.EMPTY_PERSON_NAME, "Person name cannot be empty."),
    };
  }

  return {
    success: true,
  };
};

export const unwrapPersonName = (name: PersonName): string => name;
