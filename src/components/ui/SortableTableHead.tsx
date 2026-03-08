import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { SortState } from "@/hooks/useSortable";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps<K extends string> {
  col: K;
  label: string;
  sort: SortState<K> | null;
  onSort: (key: K) => void;
  className?: string;
}

export function SortableTableHead<K extends string>({
  col,
  label,
  sort,
  onSort,
  className,
}: SortableTableHeadProps<K>) {
  const isActive = sort?.key === col;
  const dir = sort?.dir;

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none whitespace-nowrap group",
        className,
      )}
      onClick={() => onSort(col)}
      aria-sort={
        isActive
          ? dir === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <span className="inline-flex items-center gap-1 group-hover:text-foreground transition-colors">
        {label}
        {isActive ? (
          dir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground/70 transition-colors" />
        )}
      </span>
    </TableHead>
  );
}
