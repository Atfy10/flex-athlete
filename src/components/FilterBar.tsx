import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  /** Unique key used in the filters state object */
  key: string;
  placeholder: string;
  options: FilterOption[];
  /** Optional fixed width, defaults to w-44 */
  width?: string;
}

interface FilterBarProps {
  /** Current search term */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /** Controlled filter values keyed by FilterConfig.key */
  filters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;

  /** Filter definitions */
  filterConfigs?: FilterConfig[];

  /** Optional extra content to the right (e.g. date input) */
  extra?: React.ReactNode;

  /** Called when Reset is clicked — clears search + all filters */
  onReset?: () => void;

  /** Show reset button only when there is something to reset */
  hasActiveFilters?: boolean;
}

/**
 * Reusable search + filter bar used on all list pages.
 *
 * Usage:
 *   <FilterBar
 *     searchValue={term}
 *     onSearchChange={(v) => { setTerm(v); setPage(1); }}
 *     searchPlaceholder="Search trainees…"
 *     filters={{ sport: sportFilter, status: statusFilter }}
 *     onFilterChange={(key, val) => { setFilter(key, val); setPage(1); }}
 *     filterConfigs={[
 *       { key: "sport",  placeholder: "All Sports",   options: sportOptions  },
 *       { key: "status", placeholder: "All Statuses", options: statusOptions },
 *     ]}
 *     onReset={handleReset}
 *     hasActiveFilters={term !== "" || sportFilter !== "all" || statusFilter !== "all"}
 *   />
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters = {},
  onFilterChange,
  filterConfigs = [],
  extra,
  onReset,
  hasActiveFilters,
}: FilterBarProps) {
  const showReset = onReset && (hasActiveFilters ?? (searchValue !== "" || Object.values(filters).some((v) => v !== "all")));

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
      {/* Search input */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Dynamic filter selects */}
      {filterConfigs.map((config) => (
        <Select
          key={config.key}
          value={filters[config.key] ?? "all"}
          onValueChange={(v) => onFilterChange?.(config.key, v)}
        >
          <SelectTrigger className={config.width ?? "w-full sm:w-44"}>
            <SelectValue placeholder={config.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{config.placeholder}</SelectItem>
            {config.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Extra slot (e.g. date input) */}
      {extra}

      {/* Reset button — only shown when there's something to reset */}
      {showReset && (
        <Button
          variant="outline"
          size="default"
          onClick={onReset}
          className="gap-2 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
