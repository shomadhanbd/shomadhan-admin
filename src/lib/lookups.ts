"use client";

import { useQuery } from "@tanstack/react-query";
import type { Page } from "@/types/api";
import api from "./api";

export interface Lookup {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean;
}

/** An academic group (Science, Arts…) belongs to one education level. */
export interface AcademicGroupLookup extends Lookup {
  education_level: number;
}

/** A batch belongs to one education level. */
export interface BatchLookup extends Lookup {
  education_level: number;
}

export interface SubjectLookup extends Lookup {
  education_level: number;
  academic_group: number;
}

/** `retirable` resources carry `is_active`; their retired rows are left out unless a form must still show one. */
function useLookup<T extends Lookup>(resource: string, { retirable = false, includeRetired = false } = {}) {
  const activeOnly = retirable && !includeRetired;
  return useQuery({
    queryKey: ["lookup", resource, activeOnly ? "active" : "all"],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = { page_size: 200 };
      if (activeOnly) params.is_active = true;
      return (await api.get<Page<T>>(`/admin/${resource}/`, { params })).data.results;
    },
    staleTime: 60_000,
  });
}

export const useEducationLevels = () => useLookup<Lookup>("education-levels");
export const useAcademicGroups = () => useLookup<AcademicGroupLookup>("academic-groups");
export const useSubjects = () => useLookup<SubjectLookup>("subjects");
export const useBatches = (includeRetired = false) =>
  useLookup<BatchLookup>("batches", { retirable: true, includeRetired });

/** Plans for pickers: a product's title is its name, and its code stands in for the slug. */
export function useProducts() {
  return useQuery({
    queryKey: ["lookup", "products", "all"],
    queryFn: async () => {
      const { data } = await api.get<Page<{ id: number; title: string; code: string; is_active: boolean }>>(
        "/admin/products/",
        { params: { page_size: 200 } },
      );
      return data.results.map((p) => ({ id: p.id, name: p.title, slug: p.code, is_active: p.is_active }));
    },
    staleTime: 60_000,
  });
}
