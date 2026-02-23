import { useMemo, useState, useEffect } from "react";

interface UseClientPaginationProps<T> {
  data: T[];
  initialPageSize?: number;
}

export function useClientPagination<T>({
  data,
  initialPageSize = 10,
}: UseClientPaginationProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset page when data or pageSize changes
  useEffect(() => {
    setPage(1);
  }, [data.length, pageSize]);

  const totalCount = data.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  return {
    paginatedData,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
  };
}
