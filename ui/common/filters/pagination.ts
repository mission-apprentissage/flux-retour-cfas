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

export function convertPaginationInfosToQuery(infos: Partial<PaginationInfos>): PaginationInfosQuery {
  return stripEmptyFields({
    pagination: infos.pagination ? JSON.stringify(infos.pagination) : undefined,
    sort: infos.sort ? JSON.stringify(infos.sort) : undefined,
  });
}
