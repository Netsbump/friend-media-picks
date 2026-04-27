import { Effect } from "effect";

import { validateDomainSerie, type NewSerie } from "../../domain/serie.js";
import { SerieRepo } from "./serie.repo.port.js";

export const createSerie = (newSerie: NewSerie) =>
  Effect.gen(function* () {
    const validatedSerie = yield* validateDomainSerie(newSerie);

    const serieRepo = yield* SerieRepo;

    const persistedSerie = yield* serieRepo.save(validatedSerie);

    return persistedSerie;
  });
