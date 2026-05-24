import { Effect } from "effect";

import { validateNewSerie, type NewSerieInput } from "../domain/serie.js";
import { SerieRepository } from "./serie.repository.js";

export const createSerieUseCase = (newSerie: NewSerieInput) =>
  Effect.gen(function* () {
    const validatedResult = validateNewSerie(newSerie);

    if (!validatedResult.success) {
      return yield* Effect.fail(validatedResult.error);
    }

    const serieRepository = yield* SerieRepository;
    return yield* serieRepository.save(validatedResult.value);
  });
