import { useState } from "react";

export const usePagination = (initialPageSize = 20, initialTotalCount = 0) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  const totalPages = Math.ceil(totalCount / pageSize);

  const onPageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const onPageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const setTotalItemsCount = (newTotalCount: number) => {
    setTotalCount(newTotalCount);
  };

  return {
    pageIndex,
    pageSize,
    totalCount,
    totalPages,
    onPageChange,
    onPageSizeChange,
    setTotalItemsCount,
  };
};
