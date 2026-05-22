import { Effect } from "effect";

import { validateNewSerie, type NewSerieInput } from "../domain/serie.js";
import { SerieRepository } from "./serie.repository.js";

export const createSerieUseCase = (newSerie: NewSerieInput) =>
  Effect.gen(function* () {
    const validated = validateNewSerie(newSerie);

    if (!validated.success) {
      return yield* Effect.fail(validated.error);
    }

    const serieRepository = yield* SerieRepository;

    const persistedSerie = yield* serieRepository.save(validated.value);

    return persistedSerie;
  });
