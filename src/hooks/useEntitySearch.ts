import { useEffect, useState } from "react";
import { ApiResult, PagedData } from "@/types/api";

type ListFn<T> = (
  page: number,
  pageSize: number,
) => Promise<ApiResult<PagedData<T>>>;

type SearchFn<T> = (
  term: string,
  page: number,
  pageSize: number,
) => Promise<ApiResult<PagedData<T>>>;

interface UseEntitySearchProps<T> {
  listFn: ListFn<T>;
  searchFn: SearchFn<T>;
  pageSize?: number;
  minLength?: number;
  debounceMs?: number;
}

export function useEntitySearch<T>({
  listFn,
  searchFn,
  pageSize = 9,
  minLength = 2,
  debounceMs = 400,
}: UseEntitySearchProps<T>) {
  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedTerm(term.trim());
    }, debounceMs);

    return () => clearTimeout(id);
  }, [term, debounceMs]);

  // Reset page when term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedTerm]);

  useEffect(() => {
    if (debouncedTerm.length === 1) return;

    let active = true;

    const fetchData = async () => {
      setLoading(true);

      try {
        const isSearch = debouncedTerm.length >= minLength;

        const result = isSearch
          ? await searchFn(debouncedTerm, page, pageSize)
          : await listFn(page, pageSize);

        if (!active || !result?.isSuccess || !result.data) {
          setItems([]);
          setError("Search failed");
          setTotalPages(1);
          return;
        }

        const paged = result.data;

        setItems(paged.items ?? []);

        setTotalPages(
          Math.max(1, Math.ceil(paged.totalCount / paged.pageSize)),
        );
      } catch (err) {
        if (!active) return;
        setItems([]);
        setError("Network error");
        setTotalPages(1);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [debouncedTerm, page, minLength, pageSize, listFn, searchFn]);

  return {
    items,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
  };
}
