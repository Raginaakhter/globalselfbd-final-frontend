"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface StoreSearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Current search query if controlled externally */
  value?: string;
  /** Callback on change if controlled externally */
  onChange?: (val: string) => void;
  /** Extra CSS classes */
  className?: string;
  /** Automatically sync with URL ?q=... (default: true if onChange not provided) */
  syncUrl?: boolean;
  /** Param name in URL, default is "q" */
  paramName?: string;
  /** Auto focus input on mount */
  autoFocus?: boolean;
}

export default function StoreSearchBar({
  placeholder = "Search vitamins, skin care, baby, grocery…",
  value: controlledValue,
  onChange: controlledOnChange,
  className = "",
  syncUrl = true,
  paramName = "q",
  autoFocus = false,
}: StoreSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get(paramName) ?? "";
  const isControlled = controlledOnChange !== undefined;

  const [query, setQuery] = useState(isControlled ? (controlledValue ?? "") : urlQuery);

  // Sync state if URL or controlled prop changes
  useEffect(() => {
    if (isControlled) {
      setQuery(controlledValue ?? "");
    } else {
      setQuery(urlQuery);
    }
  }, [isControlled, controlledValue, urlQuery]);

  const updateUrl = useCallback(
    (newQuery: string) => {
      if (!syncUrl || isControlled) return;
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        const trimmed = newQuery.trim();
        if (trimmed) {
          params.set(paramName, trimmed);
        } else {
          params.delete(paramName);
        }
        // Reset page back to 1 on new search query
        params.delete("page");
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [syncUrl, isControlled, searchParams, paramName, router, pathname]
  );

  // Debounced URL updates when typing
  useEffect(() => {
    if (isControlled) return;
    const timer = setTimeout(() => {
      if (query !== urlQuery) {
        updateUrl(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, urlQuery, updateUrl, isControlled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (isControlled && controlledOnChange) {
      controlledOnChange(val);
    }
  };

  const handleClear = () => {
    setQuery("");
    if (isControlled && controlledOnChange) {
      controlledOnChange("");
    } else {
      updateUrl("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isControlled) {
      updateUrl(query);
    }
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`relative w-full max-w-md sm:max-w-lg ${className}`}
    >
      <div className="flex items-center rounded-full border-2 border-blue-900 bg-blue-900 overflow-hidden shadow-sm transition-all focus-within:ring-3 focus-within:ring-blue-900/20">
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Search"
          autoFocus={autoFocus}
          className="flex-1 min-w-0 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-transparent placeholder:text-blue-100 text-white font-medium"
        />

        {query.trim() !== "" && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="p-1.5 mr-1 text-blue-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="submit"
          aria-label="Search"
          className="m-1 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>Search</span>
        </button>
      </div>
    </form>
  );
}
