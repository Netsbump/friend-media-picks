import type { Serie } from "../domain/serie.js";

export type SerieApiResponse = {
  id: string;
  title: string;
  description: string;
  seasons: number;
  producer: string;
  releaseAt: string;
};

export const toSerieApiResponse = (serie: Serie): SerieApiResponse => ({
  id: serie.id,
  title: serie.title,
  description: serie.description,
  seasons: serie.seasons,
  producer: serie.producer,
  releaseAt: serie.releaseAt.toISOString(),
});
