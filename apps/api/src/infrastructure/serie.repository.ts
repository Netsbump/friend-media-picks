import { Context, Data, Effect, Layer } from "effect";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import {
  unwrapSeasonCount,
  unwrapTitleSerie,
  type Serie,
  type ValidatedNewSerie,
} from "../domain/serie.js";
import { DbClient } from "./database/db.service.js";
import { series } from "./serie.schema.js";

export class SerieRepositoryError extends Data.TaggedError("SerieRepositoryError")<{
  message: string;
}> {}

export class SerieRepository extends Context.Tag("SerieRepository")<
  SerieRepository,
  {
    save: (newSerie: ValidatedNewSerie) => Effect.Effect<Serie, SerieRepositoryError>;
  }
>() {}

type SerieRow = InferSelectModel<typeof series>;
type SerieInsert = InferInsertModel<typeof series>;

const mapNewSerieToInsert = (newSerie: ValidatedNewSerie): SerieInsert => ({
  title: unwrapTitleSerie(newSerie.title),
  description: newSerie.description,
  seasons: unwrapSeasonCount(newSerie.seasons),
  producer: newSerie.producer,
  releaseAt: newSerie.releaseAt,
});

const mapRowToSerie = (row: SerieRow): Serie => ({
  id: row.id,
  title: row.title,
  description: row.description,
  seasons: row.seasons,
  producer: row.producer,
  releaseAt: row.releaseAt,
});

export const SerieRepositoryLive = Layer.effect(
  SerieRepository,
  Effect.gen(function* () {
    const { db } = yield* DbClient;
    yield* Effect.logInfo("[BOOT] SerieRepository wired");

    return {
      save: (newSerie: ValidatedNewSerie) =>
        Effect.tryPromise({
          try: async () => {
            const row = await db
              .insert(series)
              .values(mapNewSerieToInsert(newSerie))
              .returning()
              .then((rows) => rows[0]);

            if (!row) {
              throw new Error("Insert did not return a row");
            }

            return mapRowToSerie(row);
          },
          catch: (e) => {
            const message = e instanceof Error ? e.message : String(e);

            return new SerieRepositoryError({
              message,
            });
          },
        }),
    };
  }),
);
