import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { createSerieUseCase } from "./create-serie.use-case.js";
import { SerieRepository } from "./serie.repository.js";

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
  save: () => Effect.succeed(sampleSerie),
});

describe("createSerieUseCase", () => {
  it("fails with domain error when input is invalid", async () => {
    const program = createSerieUseCase({
      title: "   ",
      description: "desc",
      seasons: 1,
      producer: "p",
      releaseAt,
    }).pipe(Effect.provide(repoLayer));

    const exit = await Effect.runPromiseExit(program);

    expect(exit._tag).toBe("Failure");
  });

  it("saves and returns persisted serie when input is valid", async () => {
    const program = createSerieUseCase({
      title: "Dark",
      description: "Time travel thriller",
      seasons: 3,
      producer: "Netflix",
      releaseAt,
    }).pipe(Effect.provide(repoLayer));

    const result = await Effect.runPromise(program);

    expect(result).toEqual(sampleSerie);
  });
});
