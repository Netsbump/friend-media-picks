import { Effect } from "effect";

import { validateNewSerie, type NewSerie } from "../domain/serie.js";
import { SerieRepository } from "./serie.repository.port.js";

export const createSerieUseCase = (newSerie: NewSerie) =>
  Effect.gen(function* () {
    const validatedSerie = yield* validateNewSerie(newSerie);

    const serieRepository = yield* SerieRepository;

    const persistedSerie = yield* serieRepository.save(validatedSerie);

    return persistedSerie;
  });
