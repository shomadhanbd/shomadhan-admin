"use client";

import { useCallback, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api, { cleanParams } from "@/lib/api";
import { stepBackIfEmptied } from "@/lib/utils";
import { useDebounce } from "./use-debounce";
import type { Page, Params } from "@/types/api";

interface CrudListOptions<T> {
  /** The query-key prefix every mutation of this resource invalidates. */
  key: string;
  /** Collection URL, e.g. `SUBJECTS` from `features/curriculum/api.ts`. */
  path: string;
  /** Extra query params (filters); part of the cache key. */
  params?: Params;
  /** Detail URL for deletes; defaults to `${path}${row.id}/`. */
  deleteUrl?: (row: T) => string;
  /** Extra work after a delete, e.g. refreshing a lookup or a toast. */
  onDeleted?: () => void;
  pageSize?: number;
  /** False holds the query back, e.g. until a required filter is chosen. */
  enabled?: boolean;
}

/** Search, paging, the list query and delete for a paginated admin table. */
export function useCrudList<T extends { id: number | string }>({
  key,
  path,
  params = {},
  deleteUrl,
  onDeleted,
  pageSize: initialPageSize = 25,
  enabled = true,
}: CrudListOptions<T>) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [deleting, setDeleting] = useState<T | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const query = useQuery({
    queryKey: [key, path, page, pageSize, debouncedSearch, params],
    queryFn: async () => {
      const query = cleanParams({ ...params, page, page_size: pageSize, search: debouncedSearch });
      try {
        return (await api.get<Page<T>>(path, { params: query })).data;
      } catch (err) {
        // The page emptied behind us (its last row was deleted, or stopped matching the filter).
        if (page > 1 && axios.isAxiosError(err) && err.response?.status === 404) {
          // Only if still on that page: a delete steps back by itself, and must not be stepped back twice.
          setPage((p) => (p === page ? Math.max(1, p - 1) : p));
          return { count: 0, next: null, previous: null, results: [] };
        }
        throw err;
      }
    },
    placeholderData: keepPreviousData,
    enabled,
  });

  const rows: T[] = query.data?.results ?? [];
  const total = query.data?.count ?? 0;
  // The API reports only the total, so the range shown under the table is worked out from the page.
  const from = rows.length ? (page - 1) * pageSize + 1 : 0;
  const to = rows.length ? from + rows.length - 1 : 0;

  const remove = useMutation({
    mutationFn: (row: T) => api.delete(deleteUrl ? deleteUrl(row) : `${path}${row.id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      stepBackIfEmptied(rows.length, 1, setPage);
      onDeleted?.();
    },
    // On failure too: the toast explains a refused delete, and the confirm should not linger behind it.
    onSettled: () => setDeleting(null),
  });

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return {
    rows,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    search,
    debouncedSearch,
    onSearch,
    page,
    setPage,
    deleting,
    setDeleting,
    remove,
    pagination: {
      page,
      pageSize,
      total,
      from,
      to,
      onPage: setPage,
      onPageSize: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
    },
  };
}
