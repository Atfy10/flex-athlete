import { useState, useCallback } from "react";

export type SortDir = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

export function useSortable<K extends string>(defaultKey?: K, defaultDir: SortDir = "asc") {
  const [sort, setSort] = useState<SortState<K> | null>(
    defaultKey ? { key: defaultKey, dir: defaultDir } : null,
  );

  const toggle = useCallback((key: K) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      // third click → back to null (unsorted)
      return null;
    });
  }, []);

  const sortItems = useCallback(
    <T>(items: T[], getValue: (item: T, key: K) => string | number | null | undefined): T[] => {
      if (!sort) return items;
      return [...items].sort((a, b) => {
        const av = getValue(a, sort.key) ?? "";
        const bv = getValue(b, sort.key) ?? "";
        let cmp: number;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        }
        return sort.dir === "asc" ? cmp : -cmp;
      });
    },
    [sort],
  );

  return { sort, toggle, sortItems };
}
