import { PaginationState, SortingState } from "@tanstack/react-table";

import { stripEmptyFields } from "@/common/utils/misc";

export interface PaginationInfosQuery {
  pagination?: string;
  sort?: string;
}

export interface PaginationInfos {
  pagination: PaginationState;
  sort: SortingState;
}

export function parsePaginationInfosFromQuery(query: PaginationInfosQuery): PaginationInfos {
  return {
    pagination: query.pagination ? JSON.parse(query.pagination) : null,
    sort: query.sort ? JSON.parse(query.sort) : null,
  };
}

export function convertPaginationInfosToQuery(infos: Partial<PaginationInfos>): PaginationInfosQuery {
  return stripEmptyFields({
    pagination: JSON.stringify(infos.pagination ?? {}),
    sort: JSON.stringify(infos.sort ?? []),
  });
}
