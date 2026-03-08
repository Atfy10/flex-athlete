import { useState, useCallback, useMemo } from "react";

/**
 * Reusable row-selection state for table views.
 *
 * @param items   The current page of items (any object with an `id: number | string` field).
 */
export function useTableSelection<T extends { id: number | string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

  /** IDs of the currently visible page */
  const visibleIds = useMemo(() => items.map((i) => i.id), [items]);

  const isSelected = useCallback(
    (id: number | string) => selectedIds.has(id),
    [selectedIds],
  );

  const toggle = useCallback((id: number | string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  /** True when every visible row is selected */
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  /** True when some (but not all) visible rows are selected */
  const someSelected =
    !allSelected && visibleIds.some((id) => selectedIds.has(id));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      // Deselect all visible rows
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all visible rows
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [allSelected, visibleIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  /** Resolved item objects for the selected IDs */
  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isSelected,
    toggle,
    allSelected,
    someSelected,
    toggleAll,
    clearSelection,
  };
}
