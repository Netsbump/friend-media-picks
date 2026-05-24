import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

import { SerieRepository } from "./serie.repository.js";
import { SerieService } from "./serie.service.js";
import { SerieServiceLive } from "./serie.service.live.js";

const releaseAt = new Date("2024-01-01T00:00:00.000Z");

const sampleSerie = {
  id: "serie-1",
  title: "Dark",
  description: "Time travel thriller",
  seasons: 3,
  producer: "Netflix",
  releaseAt,
};

describe("SerieServiceLive", () => {
  it("fails with domain error when input is invalid", async () => {
    const repoLayer = Layer.succeed(SerieRepository, {
      findById: () => Effect.succeed(sampleSerie),
      save: () => Effect.succeed(sampleSerie),
    });

    const appLayer = Layer.provide(SerieServiceLive, repoLayer);

    const program = Effect.gen(function* () {
      const serieService = yield* SerieService;

      return yield* serieService.create({
        title: "   ",
        description: "desc",
        seasons: 1,
        producer: "p",
        releaseAt,
      });
    }).pipe(Effect.provide(appLayer));

    const exit = await Effect.runPromiseExit(program);

    expect(exit._tag).toBe("Failure");
  });

  it("saves and returns persisted serie when input is valid", async () => {
    const save = vi.fn(() => Effect.succeed(sampleSerie));

    const repoLayer = Layer.succeed(SerieRepository, {
      findById: () => Effect.succeed(sampleSerie),
      save,
    });

    const appLayer = Layer.provide(SerieServiceLive, repoLayer);

    const program = Effect.gen(function* () {
      const serieService = yield* SerieService;

      return yield* serieService.create({
        title: "Dark",
        description: "Time travel thriller",
        seasons: 3,
        producer: "Netflix",
        releaseAt,
      });
    }).pipe(Effect.provide(appLayer));

    const result = await Effect.runPromise(program);

    expect(result).toEqual(sampleSerie);
    expect(save).toHaveBeenCalledOnce();
  });
});
