"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { apiError, fieldErrors } from "@/lib/api-error";

/**
 * Saves one card's fields of a record with a PATCH to `path`, keeps `queryKey` (the page's own query) current,
 * and refreshes the list behind `listKey`. Field errors land on their inputs; anything else on the card.
 */
export function useRecordSave<T>({
  path,
  queryKey,
  listKey,
}: {
  path: string;
  queryKey: unknown[];
  listKey: unknown[];
}) {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const update = useMutation({
    mutationFn: async (fields: Record<string, unknown>) => (await api.patch<T>(path, fields)).data,
    // Shown on the card by `save` below, so the app-wide error toast stays out of it.
    meta: { handlesErrors: true },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved);
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  async function save(fields: Record<string, unknown>, own: string[] = Object.keys(fields)): Promise<boolean> {
    setErrors({});
    setError(null);
    try {
      await update.mutateAsync(fields);
      toast.success("Saved");
      return true;
    } catch (err) {
      const byField = fieldErrors(err);
      setErrors(byField);
      // A message for a field this card has no input for still needs showing.
      setError(Object.keys(byField).some((f) => own.includes(f)) ? null : apiError(err));
      return false;
    }
  }

  const reset = () => {
    setErrors({});
    setError(null);
  };
  return { save, reset, errors, error, pending: update.isPending };
}
