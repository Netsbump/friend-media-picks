import { Effect, Layer } from "effect";
import { TvShowCatalog } from "./tvshow.catalog.js";
import { validateNewTvShow, type TvShowCreation } from "../domain/tvshow.js";
import { TvShowRepository } from "./tvshow.repository.js";

export const TvShowCatalogLive = Layer.effect(
  TvShowCatalog,
  Effect.gen(function* () {
    yield* Effect.logInfo("[STARTUP] TvShowCatalog wired");

    const tvShowRepository = yield* TvShowRepository;

    const add = (newTvShow: TvShowCreation) =>
      Effect.gen(function* () {
        const validationResult = validateNewTvShow(newTvShow);

        if (!validationResult.success) {
          return yield* Effect.fail(validationResult.error);
        }

        return yield* tvShowRepository.save(newTvShow);
      });

    const getById = (tvShowId: string) => tvShowRepository.findById(tvShowId);

    const list = () => tvShowRepository.findAll();

    return {
      add,
      getById,
      list,
    };
  }),
);
