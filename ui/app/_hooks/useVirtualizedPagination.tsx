import { SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

export const useVirtualizedPagination = (
  allData: any[],
  searchTerm: string,
  defaultPageSize: number = 20,
  defaultSorting?: SortingState,
  customNavigationPath?: (id: string) => string
) => {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const router = useRouter();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sorting]);

  const createNavigationIcon = customNavigationPath
    ? (id: string) => (
        <i
          className="fr-icon-arrow-right-line fr-icon--sm"
          style={{ cursor: "pointer" }}
          onClick={() => router.push(customNavigationPath(id))}
        />
      )
    : undefined;

  const { paginatedData, totalFiltered } = useMemo(() => {
    let filteredData = allData;
    if (searchTerm) {
      filteredData = allData.filter(
        (item) =>
          item.element?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.rawData?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    let sortedData = filteredData;
    if (sorting.length > 0) {
      const sort = sorting[0];
      sortedData = [...filteredData].sort((a, b) => {
        const aValue = a.rawData?.[sort.id] ?? a.element?.[sort.id];
        const bValue = b.rawData?.[sort.id] ?? b.element?.[sort.id];

        const aNum = typeof aValue === "number" ? aValue : parseFloat(String(aValue));
        const bNum = typeof bValue === "number" ? bValue : parseFloat(String(bValue));

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sort.desc ? bNum - aNum : aNum - bNum;
        }

        const aStr = String(aValue || "").toLowerCase();
        const bStr = String(bValue || "").toLowerCase();

        if (sort.desc) {
          return bStr.localeCompare(aStr);
        }
        return aStr.localeCompare(bStr);
      });
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalFiltered: sortedData.length,
    };
  }, [allData, searchTerm, sorting, currentPage, pageSize]);

  const pagination = useMemo(
    () => ({
      total: totalFiltered,
      page: currentPage,
      limit: pageSize,
      lastPage: Math.ceil(totalFiltered / pageSize),
    }),
    [totalFiltered, currentPage, pageSize]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return {
    data: paginatedData,
    pagination,
    sorting,
    setSorting,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    pageSize,
    createNavigationIcon,
  };
};
