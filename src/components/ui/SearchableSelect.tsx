import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, ChevronDown, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  id?: string;
  label: string;
  placeholder?: string;
  value: SearchableOption | null;
  onChange: (option: SearchableOption | null) => void;
  onSearch: (query: string) => Promise<SearchableOption[]>;
  debounceMs?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Inline validation error from parent Zod schema */
  error?: string;
  /** Hint text shown when there is no error */
  hint?: string;
}

export function SearchableSelect({
  id,
  label,
  placeholder = "Search…",
  value,
  onChange,
  onSearch,
  debounceMs = 300,
  required,
  disabled,
  className,
  error,
  hint,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchableOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      setFetchError(false);
      try {
        const results = await onSearch(q);
        setOptions(results);
      } catch {
        setOptions([]);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    },
    [onSearch],
  );

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, debounceMs, doSearch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setTouched(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (opt: SearchableOption) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-sm font-medium text-foreground",
          disabled && "opacity-60",
        )}
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden>
            *
          </span>
        )}
      </label>

      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          id={id}
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          className={cn(
            "w-full flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-2 ring-ring ring-offset-2",
            error && "border-destructive focus:ring-destructive",
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? value.label : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="rounded hover:bg-muted p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
            {/* Search input */}
            <div className="flex items-center border-b border-border px-3">
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="flex-1 bg-transparent py-2 pl-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto p-1">
              {fetchError ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Failed to load results
                </div>
              ) : loading && options.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              ) : options.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {touched ? "No results found" : "Start typing to search"}
                </div>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "w-full flex flex-col items-start rounded px-3 py-2 text-sm hover:bg-accent cursor-pointer text-left",
                      value?.value === opt.value &&
                        "bg-accent text-accent-foreground font-medium",
                    )}
                  >
                    <span>{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-xs text-muted-foreground">
                        {opt.sublabel}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-destructive flex items-center gap-1"
        >
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
