import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import {
  SerieRepository,
  SerieRepositoryError,
  SerieRepositoryErrorCode,
  SerieRepositoryOperation,
} from "../application/serie.repository.js";
import { createSerieHandler, getSerieHandler } from "./serie.handler.js";

const releaseAt = new Date("2024-01-01T00:00:00.000Z");

const sampleSerie = {
  id: "serie-1",
  title: "Dark",
  description: "Time travel thriller",
  seasons: 3,
  producer: "Netflix",
  releaseAt,
};

const repoLayer = Layer.succeed(SerieRepository, {
  findById: () => Effect.succeed(sampleSerie),
  save: () =>
    Effect.fail(
      new SerieRepositoryError({
        code: SerieRepositoryErrorCode.DB_FAILURE,
        message: "unused",
        details: { operation: SerieRepositoryOperation.SAVE },
      }),
    ),
});

describe("serie handlers", () => {
  it("createSerieHandler maps schema validation errors", async () => {
    const program = createSerieHandler({
      title: "Dark",
      description: "desc",
      seasons: "invalid",
      producer: "Netflix",
      releaseAt: "2024-01-01T00:00:00.000Z",
    }).pipe(Effect.provide(repoLayer));

    const exit = await Effect.runPromiseExit(program);

    expect(exit._tag).toBe("Failure");
  });

  it("getSerieHandler returns serie with repository layer", async () => {
    const program = getSerieHandler("serie-1").pipe(Effect.provide(repoLayer));

    const result = await Effect.runPromise(program);

    expect(result).toEqual(sampleSerie);
  });
});
