import { DomainErrorCode, domainError, type Brand, type Result } from "./type.js";

export type PersonName = Brand<string, "PersonName">;

export const createPersonName = (raw: string): Result<PersonName> => {
  const value = raw.trim();
  if (value.length === 0) {
    return {
      success: false,
      error: domainError(DomainErrorCode.EMPTY_PERSON_NAME, "Person name cannot be empty."),
    };
  }

  return {
    success: true,
    value: value as PersonName,
  };
};

export const unwrapPersonName = (name: PersonName): string => name;
