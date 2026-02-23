import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";
import { ApiResult, PagedData } from "@/types/api";

export function useEmployeesSearch(searchTerm: string) {
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [employees, setEmployees] = useState<EmployeeCardDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 9;

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 400);

    return () => clearTimeout(id);
  }, [searchTerm]);

  // Reset page when term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedTerm]);

  useEffect(() => {
    let cancelled = false;

    const fetchEmployees = async () => {
      if (debouncedTerm.length === 1) return;

      setLoading(true);

      try {
        const isSearch = debouncedTerm.length >= 2;

        const url = isSearch
          ? `/api/employees/search?term=${encodeURIComponent(
              debouncedTerm,
            )}&page=${page}&pageSize=${pageSize}`
          : `/api/employees?page=${page}&pageSize=${pageSize}`;

        const result =
          await apiFetch<ApiResult<PagedData<EmployeeCardDto>>>(url);

        if (cancelled) return;

        if (!result?.isSuccess || !result.data) {
          setEmployees([]);
          setTotalPages(1);
          return;
        }

        const paged = result.data;

        setEmployees(paged.items ?? []);

        const computedTotalPages = Math.max(
          1,
          Math.ceil(paged.totalCount / paged.pageSize),
        );

        setTotalPages(computedTotalPages);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching employees", err);
          setEmployees([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [debouncedTerm, page]);

  return {
    employees,
    loading,
    page,
    totalPages,
    setPage,
  };
}
