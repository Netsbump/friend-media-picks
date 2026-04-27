import { Effect } from "effect";

import { validateDomainSerie, type NewSerie } from "../../domain/serie.js";
import { SerieRepository } from "./serie.repo.port.js";

export const createSerieUseCase = (newSerie: NewSerie) =>
  Effect.gen(function* () {
    const validatedSerie = yield* validateDomainSerie(newSerie);

    const serieRepository = yield* SerieRepository;

    const persistedSerie = yield* serieRepository.save(validatedSerie);

    return persistedSerie;
  });
