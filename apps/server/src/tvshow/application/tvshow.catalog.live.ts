import { Effect, Layer } from "effect";
import { TvShowCatalog } from "./tvshow.catalog.js";
import { toTvShowCatalogError } from "./tvshow.catalog.error.js";
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
          return yield* toTvShowCatalogError(validationResult.error);
        }

        return yield* tvShowRepository.save(newTvShow).pipe(Effect.mapError(toTvShowCatalogError));
      });

    const getById = (tvShowId: string) =>
      tvShowRepository.findById(tvShowId).pipe(Effect.mapError(toTvShowCatalogError));

    const list = () => tvShowRepository.findAll().pipe(Effect.mapError(toTvShowCatalogError));

    return {
      add,
      getById,
      list,
    };
  }),
);
