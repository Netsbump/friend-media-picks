import type { GenreRow } from "../../database/schemas/genre.schema.js";
import type { PersonRow } from "../../database/schemas/person.schema.js";
import type { TvShowRow } from "../../database/schemas/tvshow.schema.js";
import {
  toDirectorsDomain,
  toGenresDomain,
  toStarsDomain,
  toTvShowDomain,
  toWritersDomain,
} from "./tvshow.mappers.js";

type PersonRelationRow = PersonRow & { tvShowId: string };
type GenreRelationRow = GenreRow & { tvShowId: string };

type TvShowRelationRows = {
  directors: ReadonlyArray<PersonRow>;
  writers: ReadonlyArray<PersonRow>;
  stars: ReadonlyArray<PersonRow>;
  genres: ReadonlyArray<GenreRow>;
};

export type TvShowRelationRowsByTvShow = {
  directors: ReadonlyArray<PersonRelationRow>;
  writers: ReadonlyArray<PersonRelationRow>;
  stars: ReadonlyArray<PersonRelationRow>;
  genres: ReadonlyArray<GenreRelationRow>;
};
const uniqueById = <Row extends { id: string }>(rows: ReadonlyArray<Row>): Row[] => {
  const rowsById = new Map<string, Row>();

  for (const row of rows) {
    rowsById.set(row.id, row);
  }

  return [...rowsById.values()];
};

const groupByTvShowId = <Row extends { tvShowId: string }>(rows: ReadonlyArray<Row>) => {
  const rowsByTvShowId = new Map<string, Row[]>();

  for (const row of rows) {
    const tvShowRows = rowsByTvShowId.get(row.tvShowId) ?? [];
    tvShowRows.push(row);
    rowsByTvShowId.set(row.tvShowId, tvShowRows);
  }

  return rowsByTvShowId;
};

export const toTvShowWithRelations = (row: TvShowRow, relations: TvShowRelationRows) =>
  toTvShowDomain(row, {
    directors: toDirectorsDomain(uniqueById(relations.directors)),
    writers: toWritersDomain(uniqueById(relations.writers)),
    stars: toStarsDomain(uniqueById(relations.stars)),
    genres: toGenresDomain(uniqueById(relations.genres)),
  });

export const toTvShowsWithRelations = (
  rows: ReadonlyArray<TvShowRow>,
  relations: TvShowRelationRowsByTvShow,
) => {
  const directorsByTvShowId = groupByTvShowId(relations.directors);
  const writersByTvShowId = groupByTvShowId(relations.writers);
  const starsByTvShowId = groupByTvShowId(relations.stars);
  const genresByTvShowId = groupByTvShowId(relations.genres);

  return rows.map((row) =>
    toTvShowWithRelations(row, {
      directors: directorsByTvShowId.get(row.id) ?? [],
      writers: writersByTvShowId.get(row.id) ?? [],
      stars: starsByTvShowId.get(row.id) ?? [],
      genres: genresByTvShowId.get(row.id) ?? [],
    }),
  );
};
