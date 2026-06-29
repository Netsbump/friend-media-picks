import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";

export const PersonInput = Schema.Struct({
  firstName: Schema.String,
  lastName: Schema.String,
}).annotations({ identifier: "PersonInput" });
export type PersonInput = Schema.Schema.Type<typeof PersonInput>;

export const GenreInput = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
}).annotations({ identifier: "GenreInput" });
export type GenreInput = Schema.Schema.Type<typeof GenreInput>;

export const CreateTvShowInput = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  episodes: Schema.Number,
  releaseAt: Schema.DateFromString,
  directors: Schema.Array(PersonInput),
  writers: Schema.Array(PersonInput),
  stars: Schema.Array(PersonInput),
  genres: Schema.Array(GenreInput),
}).annotations({ identifier: "CreateTvShowInput" });
export type CreateTvShowInput = Schema.Schema.Type<typeof CreateTvShowInput>;

export const TvShowIdPathParams = Schema.Struct({
  id: Schema.String,
}).annotations({ identifier: "TvShowIdPathParams" });
export type TvShowIdPathParams = Schema.Schema.Type<typeof TvShowIdPathParams>;

export const PersonResponse = Schema.Struct({
  id: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
}).annotations({ identifier: "PersonResponse" });
export type PersonResponse = Schema.Schema.Type<typeof PersonResponse>;

export const GenreResponse = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
}).annotations({ identifier: "GenreResponse" });
export type GenreResponse = Schema.Schema.Type<typeof GenreResponse>;

export const TvShowApiResponse = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  episodes: Schema.Number,
  releaseAt: Schema.String,
  directors: Schema.Array(PersonResponse),
  writers: Schema.Array(PersonResponse),
  stars: Schema.Array(PersonResponse),
  genres: Schema.Array(GenreResponse),
}).annotations({ identifier: "TvShowApiResponse" });
export type TvShowApiResponse = Schema.Schema.Type<typeof TvShowApiResponse>;

export const TvShowsApiResponse = Schema.Array(TvShowApiResponse).annotations({
  identifier: "TvShowsApiResponse",
});
export type TvShowsApiResponse = Schema.Schema.Type<typeof TvShowsApiResponse>;

export const CreatedTvShowApiResponse = TvShowApiResponse.annotations(
  HttpApiSchema.annotations({ status: 201 }),
);

export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
}).annotations({ identifier: "HealthResponse" });
export type HealthResponse = Schema.Schema.Type<typeof HealthResponse>;
