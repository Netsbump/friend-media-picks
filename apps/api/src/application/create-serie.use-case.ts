import { Effect } from "effect";

import { validateNewSerie, type NewSerie } from "../domain/serie.js";
import { SerieRepository } from "../infrastructure/serie.repository.js";

export const createSerieUseCase = (newSerie: NewSerie) =>
  Effect.gen(function* () {
    const validatedSerie = validateNewSerie(newSerie);
    if (!validatedSerie.success) {
      return yield* validatedSerie.error;
    }

    const serieRepository = yield* SerieRepository;

    const persistedSerie = yield* serieRepository.save(validatedSerie.value);

    return persistedSerie;
  });
