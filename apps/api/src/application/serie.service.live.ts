import { Effect, Layer } from "effect";
import { validateNewSerie, type NewSerieInput } from "../domain/serie.js";
import { SerieRepository } from "./serie.repository.js";
import { SerieService } from "./serie.service.js";

export const SerieServiceLive = Layer.effect(
  SerieService,
  Effect.gen(function* () {
    yield* Effect.logInfo("[STARTUP] SerieService wired");
    const serieRepository = yield* SerieRepository;

    const getById = (serieId: string) => serieRepository.findById(serieId);

    const create = (newSerie: NewSerieInput) =>
      Effect.gen(function* () {
        const validatedResult = validateNewSerie(newSerie);

        if (!validatedResult.success) {
          return yield* Effect.fail(validatedResult.error);
        }

        return yield* serieRepository.save(validatedResult.value);
      });

    return {
      create,
      getById,
    };
  }),
);
