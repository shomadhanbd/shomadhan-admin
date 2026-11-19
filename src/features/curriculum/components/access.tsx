"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { chaptersApi, curriculumKeys, subjectsApi } from "@/features/curriculum/api";

/** A chapter's lock shows on the chapters and in its subject's VIP chapter count. */
function useRefreshAccess() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: curriculumKeys.subjects.all });
    queryClient.invalidateQueries({ queryKey: curriculumKeys.chapters.all });
  };
}

/** Saves one chapter's lock at once, with an Undo in the confirmation toast. */
export function useSetChapterLock() {
  const refresh = useRefreshAccess();
  const save = useMutation({
    mutationFn: ({ id, value }: { id: number; name: string; value: boolean; undo?: boolean }) =>
      chaptersApi.update(id, { is_locked: value }),
    onSuccess: (_, { id, name, value, undo }) => {
      refresh();
      const text = `${name} is ${value ? "VIP only" : "free"}${undo ? " again" : ""}`;
      if (undo) return toast.success(text);
      toast.success(text, {
        action: { label: "Undo", onClick: () => save.mutate({ id, name, value: !value, undo: true }) },
      });
    },
    onError: (err) => toast.error(apiError(err)),
  });
  return save;
}

/** Locks or frees every chapter of one subject. */
export function useSetChapterAccess() {
  const refresh = useRefreshAccess();
  return useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) => subjectsApi.setChapterAccess(id, value),
    onSuccess: ({ updated }, { value }) => {
      refresh();
      toast.success(
        updated === 0
          ? `Every chapter was already ${value ? "VIP only" : "free"}`
          : `${updated} chapter${updated === 1 ? "" : "s"} now ${value ? "VIP only" : "free"}`,
      );
    },
    onError: (err) => toast.error(apiError(err)),
  });
}
