import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import {
  RepositoryEntity,
  RepositoryError,
  RepositoryErrorCode,
  RepositoryOperation,
} from "../application/repository.error.js";
import { SerieRepository } from "../application/serie.repository.js";
import { SerieServiceLive } from "../application/serie.service.live.js";
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
      new RepositoryError({
        code: RepositoryErrorCode.DB_FAILURE,
        entity: RepositoryEntity.SERIE,
        operation: RepositoryOperation.SAVE,
        message: "unused",
      }),
    ),
});

const appLayer = Layer.provide(SerieServiceLive, repoLayer);

describe("serie handlers", () => {
  it("createSerieHandler maps schema validation errors", async () => {
    const program = createSerieHandler({
      title: "Dark",
      description: "desc",
      seasons: "invalid",
      producer: "Netflix",
      releaseAt: "2024-01-01T00:00:00.000Z",
    }).pipe(Effect.provide(appLayer));

    const exit = await Effect.runPromiseExit(program);

    expect(exit._tag).toBe("Failure");
  });

  it("getSerieHandler returns serie api response with repository layer", async () => {
    const program = getSerieHandler("serie-1").pipe(Effect.provide(appLayer));

    const result = await Effect.runPromise(program);

    expect(result).toEqual({
      ...sampleSerie,
      releaseAt: releaseAt.toISOString(),
    });
  });
});
