import type { TvShowRow } from "../../database/schemas/tvshow.schema.js";
import {
  toDirectorsDomain,
  toGenresDomain,
  toStarsDomain,
  toTvShowDomain,
  toWritersDomain,
  type GenreProjection,
  type PersonProjection,
} from "./tvshow.mappers.js";

type PersonRelationProjection = PersonProjection & { tvShowId: string };
type GenreRelationProjection = GenreProjection & { tvShowId: string };

type NullablePersonRelationProjection = {
  tvShowId: string | null;
  id: string | null;
  firstName: string | null;
  lastName: string | null;
} | null;

type NullableGenreRelationProjection = {
  tvShowId: string | null;
  id: string | null;
  name: string | null;
  description: string | null;
} | null;

export type TvShowJoinedRow = {
  tvShow: TvShowRow;
  director: NullablePersonRelationProjection;
  writer: NullablePersonRelationProjection;
  star: NullablePersonRelationProjection;
  genre: NullableGenreRelationProjection;
};

export type TvShowRelationRows = {
  directors: ReadonlyArray<PersonRelationProjection>;
  writers: ReadonlyArray<PersonRelationProjection>;
  stars: ReadonlyArray<PersonRelationProjection>;
  genres: ReadonlyArray<GenreRelationProjection>;
};

const isPersonRelationProjection = (
  row: NullablePersonRelationProjection,
): row is PersonRelationProjection =>
  row !== null &&
  row.tvShowId !== null &&
  row.id !== null &&
  row.firstName !== null &&
  row.lastName !== null;

const isGenreRelationProjection = (
  row: NullableGenreRelationProjection,
): row is GenreRelationProjection =>
  row !== null &&
  row.tvShowId !== null &&
  row.id !== null &&
  row.name !== null &&
  row.description !== null;

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

const extractPersons = (
  rows: ReadonlyArray<TvShowJoinedRow>,
  relation: "director" | "writer" | "star",
) => uniqueById(rows.map((row) => row[relation]).filter((row) => isPersonRelationProjection(row)));

const extractGenres = (rows: ReadonlyArray<TvShowJoinedRow>) =>
  uniqueById(rows.map((row) => row.genre).filter((row) => isGenreRelationProjection(row)));

export const toTvShowAggregate = (details: ReadonlyArray<TvShowJoinedRow>) => {
  const firstDetail = details[0];

  if (firstDetail === undefined) {
    return;
  }

  return toTvShowDomain(firstDetail.tvShow, {
    directors: toDirectorsDomain(extractPersons(details, "director")),
    writers: toWritersDomain(extractPersons(details, "writer")),
    stars: toStarsDomain(extractPersons(details, "star")),
    genres: toGenresDomain(extractGenres(details)),
  });
};

export const toTvShowAggregates = (
  rows: ReadonlyArray<TvShowRow>,
  relations: TvShowRelationRows,
) => {
  const directorsByTvShowId = groupByTvShowId(relations.directors);
  const writersByTvShowId = groupByTvShowId(relations.writers);
  const starsByTvShowId = groupByTvShowId(relations.stars);
  const genresByTvShowId = groupByTvShowId(relations.genres);

  return rows.map((row) =>
    toTvShowDomain(row, {
      directors: toDirectorsDomain(uniqueById(directorsByTvShowId.get(row.id) ?? [])),
      writers: toWritersDomain(uniqueById(writersByTvShowId.get(row.id) ?? [])),
      stars: toStarsDomain(uniqueById(starsByTvShowId.get(row.id) ?? [])),
      genres: toGenresDomain(uniqueById(genresByTvShowId.get(row.id) ?? [])),
    }),
  );
};
