import { Effect, Layer } from "effect";
import { TvShowService } from "./tvshow.service.js";
import { validateNewTvShow, type NewTvShowInput } from "../domain/tvshow.js";
import { TvShowRepository } from "./tvshow.repository.js";

export const TvShowServiceLive = Layer.effect(
  TvShowService,
  Effect.gen(function* () {
    yield* Effect.logInfo("[BOOT] TvShowService wired");

    const tvShowRepository = yield* TvShowRepository;

    const create = (newTvShow: NewTvShowInput) =>
      Effect.gen(function* () {
        const validatedResult = validateNewTvShow(newTvShow);

        if (!validatedResult.success) {
          return yield* Effect.fail(validatedResult.error);
        }

        return yield* tvShowRepository.save(validatedResult.value);
      });

    const getOne = (tvShowId: string) => tvShowRepository.findById(tvShowId);

    const getAll = () => tvShowRepository.findAll();

    return {
      create,
      getOne,
      getAll,
    };
  }),
);
