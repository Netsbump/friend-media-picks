import { Data } from "effect";

export const RepositoryErrorCode = {
  NOT_FOUND: "NOT_FOUND",
  DB_FAILURE: "DB_FAILURE",
  DB_EMPTY_RESULT: "DB_EMPTY_RESULT",
} as const;

export const RepositoryEntity = {
  TVSHOW: "tvshow",
} as const;

export const RepositoryOperation = {
  FIND: "find",
  FIND_ALL: "findAll",
  SAVE: "save",
} as const;

export type RepositoryErrorCode = (typeof RepositoryErrorCode)[keyof typeof RepositoryErrorCode];

export type RepositoryEntity = (typeof RepositoryEntity)[keyof typeof RepositoryEntity];

export type RepositoryOperation = (typeof RepositoryOperation)[keyof typeof RepositoryOperation];

export class RepositoryError extends Data.TaggedError("RepositoryError")<{
  code: RepositoryErrorCode;
  entity: RepositoryEntity;
  operation: RepositoryOperation;
  message: string;
  details?: {
    entityId?: string;
    cause?: string;
  };
}> {}
