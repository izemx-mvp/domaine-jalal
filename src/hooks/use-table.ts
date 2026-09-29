import { useMemo, useState } from "react";

export interface SortState<K extends string> {
  field: K;
  dir: "asc" | "desc";
}

export function useTable<T, K extends string>(
  rows: T[],
  options: {
    initialSort: SortState<K>;
    sortValue: (row: T, field: K) => string | number;
    searchText: (row: T) => string;
  },
) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState<K>>(options.initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter((r) => options.searchText(r).toLowerCase().includes(q))
      : rows.slice();
    base.sort((a, b) => {
      const av = options.sortValue(a, sort.field);
      const bv = options.sortValue(b, sort.field);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "fr");
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, sort]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (field: K) =>
    setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" }));

  return {
    query,
    setQuery: (v: string) => {
      setQuery(v);
      setPage(1);
    },
    sort,
    toggleSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    total,
    rows: paged,
    all: filtered,
  };
}
