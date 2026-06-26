import { Data } from "effect";

export class SchemaValidationError extends Data.TaggedError("SchemaValidationError")<{
  details: string;
}> {}
