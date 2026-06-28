import { HttpApiSchema } from "@effect/platform";
import * as Schema from "effect/Schema";

export const PersonInput = Schema.Struct({
  firstName: Schema.String,
  lastName: Schema.String,
}).annotations({ identifier: "PersonInput" });

export const GenreInput = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
}).annotations({ identifier: "GenreInput" });

export const CreateTvShowRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  seasons: Schema.Number,
  episodes: Schema.Number,
  releaseAt: Schema.String,
  directors: Schema.Array(PersonInput),
  writers: Schema.Array(PersonInput),
  stars: Schema.Array(PersonInput),
  genres: Schema.Array(GenreInput),
}).annotations({ identifier: "CreateTvShowRequest" });

export const TvShowIdPathParams = Schema.Struct({
  id: Schema.String,
}).annotations({ identifier: "TvShowIdPathParams" });

export const PersonResponse = Schema.Struct({
  id: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
}).annotations({ identifier: "PersonResponse" });

export const GenreResponse = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
}).annotations({ identifier: "GenreResponse" });

export const TvShowResponse = Schema.Struct({
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
}).annotations({ identifier: "TvShowResponse" });

export const TvShowsResponse = Schema.Array(TvShowResponse).annotations({
  identifier: "TvShowsResponse",
});

export const CreatedTvShowResponse = TvShowResponse.annotations(
  HttpApiSchema.annotations({ status: 201 }),
);

export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
}).annotations({ identifier: "HealthResponse" });

export type CreateTvShowRequest = typeof CreateTvShowRequest.Type;
