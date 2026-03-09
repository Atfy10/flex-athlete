import { useEffect, useRef, useState } from "react";
import { ApiResult, PagedData } from "@/types/api";

type ListFn<T> = (
  page: number,
  pageSize: number,
  extraParams?: Record<string, string>,
) => Promise<ApiResult<PagedData<T>>>;

type SearchFn<T> = (
  term: string,
  page: number,
  pageSize: number,
  extraParams?: Record<string, string>,
) => Promise<ApiResult<PagedData<T>>>;

interface UseEntitySearchProps<T> {
  listFn: ListFn<T>;
  searchFn: SearchFn<T>;
  pageSize?: number;
  minLength?: number;
  debounceMs?: number;
  /** Extra query-string params forwarded to both listFn and searchFn (e.g. filters) */
  extraParams?: Record<string, string>;
}

export function useEntitySearch<T>({
  listFn,
  searchFn,
  pageSize = 9,
  minLength = 2,
  debounceMs = 400,
  extraParams,
}: UseEntitySearchProps<T>) {
  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // Keeps the last successfully fetched items so UI isn't blanked on transient errors
  const lastGoodItemsRef = useRef<T[]>([]);

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedTerm(term.trim());
    }, debounceMs);

    return () => clearTimeout(id);
  }, [term, debounceMs]);

  // Reset page when term or extra params change
  const extraParamsKey = JSON.stringify(extraParams ?? {});
  useEffect(() => {
    setPage(1);
  }, [debouncedTerm, extraParamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debouncedTerm.length === 1) return;

    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const isSearch = debouncedTerm.length >= minLength;

        const result = isSearch
          ? await searchFn(debouncedTerm, page, pageSize, extraParams)
          : await listFn(page, pageSize, extraParams);

        if (!active) return;

        if (!result?.isSuccess || !result.data) {
          // Keep previous items — only signal the error non-destructively
          setError("Search failed");
          setTotalPages(1);
          return;
        }

        const paged = result.data;
        const newItems = paged.items ?? [];
        lastGoodItemsRef.current = newItems;
        setItems(newItems);
        setTotalPages(
          Math.max(1, Math.ceil(paged.totalCount / paged.pageSize)),
        );
      } catch (err) {
        if (!active) return;
        // Retain stale items; show error banner without blanking the list
        setError("Network error");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [debouncedTerm, page, minLength, pageSize, listFn, searchFn, refreshKey, extraParamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => setRefreshKey((k) => k + 1);

  return {
    items,
    loading,
    error,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  };
}
