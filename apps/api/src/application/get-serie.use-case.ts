import { Effect } from "effect";
import { SerieRepository } from "./serie.repository.js";

export const getSerieUseCase = (serieId: string) =>
  Effect.gen(function* () {
    const serieRepository = yield* SerieRepository;

    return yield* serieRepository.findById(serieId);
  });
