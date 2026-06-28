import { Effect, Layer } from "effect";
import { TvShowCatalog } from "./tvshow.catalog.js";
import { validateNewTvShow, type NewTvShowInput } from "../domain/tvshow.js";
import { TvShowRepository } from "./tvshow.repository.js";

export const TvShowCatalogLive = Layer.effect(
  TvShowCatalog,
  Effect.gen(function* () {
    yield* Effect.logInfo("[STARTUP] TvShowCatalog wired");

    const tvShowRepository = yield* TvShowRepository;

    const add = (newTvShow: NewTvShowInput) =>
      Effect.gen(function* () {
        const validatedResult = validateNewTvShow(newTvShow);

        if (!validatedResult.success) {
          return yield* Effect.fail(validatedResult.error);
        }

        return yield* tvShowRepository.save(validatedResult.value);
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
