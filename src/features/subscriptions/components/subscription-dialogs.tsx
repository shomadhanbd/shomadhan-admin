"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { apiError } from "@/lib/api-error";
import { date } from "@/lib/format";
import { useProducts } from "@/lib/lookups";
import { subscriptionKeys, subscriptionsApi } from "@/features/subscriptions/api";
import { subscriptionSource } from "@/features/subscriptions/constants";
import { USERS, userKeys } from "@/features/users/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormDialog } from "@/components/shared/form-dialog";
import { LookupSelect } from "@/components/shared/lookup-select";
import { Field } from "@/components/shared/page-shell";
import type { Subscription } from "@/features/subscriptions/types";
import type { User } from "@/features/users/types";
import type { Page } from "@/types/api";

const pad = (n: number) => String(n).padStart(2, "0");
/** A moment as the `YYYY-MM-DD` a date input wants, in local time. */
const toDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** VIP lasts through the whole of its last day. */
const endOfDay = (day: string) => new Date(`${day}T23:59:59`).toISOString();

function monthsFromNow(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return toDay(d);
}

export type Student = { id: number; name: string; mobile: string | null };

/** Finds the student to grant VIP to, by name or mobile. */
function StudentPicker({ student, onPick }: { student: Student | null; onPick: (s: Student | null) => void }) {
  const [term, setTerm] = useState("");
  const search = term.trim();
  const { data, isFetching } = useQuery({
    queryKey: [...userKeys.all, "picker", search],
    queryFn: async () => (await api.get<Page<User>>(USERS, { params: { search, page_size: 6 } })).data.results,
    enabled: search.length >= 2 && !student,
  });

  if (student) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-(--shape-sm) border border-border px-3 py-2">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-medium text-foreground">{student.name || student.mobile}</p>
          {student.name && <p className="text-xs text-muted-foreground">{student.mobile}</p>}
        </div>
        <button type="button" className="text-xs text-primary hover:underline" onClick={() => onPick(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        id="grant-student"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search by name or mobile…"
        autoFocus
      />
      {search.length >= 2 && (
        <ul className="divide-y divide-border rounded-(--shape-sm) border border-border">
          {(data ?? []).map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-2"
                onClick={() => onPick({ id: u.id, name: u.full_name, mobile: u.mobile })}
              >
                <span className="line-clamp-1 text-sm text-foreground">{u.full_name || u.mobile}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {u.has_active_subscription ? "Already VIP · " : ""}
                  {u.mobile}
                </span>
              </button>
            </li>
          ))}
          {data?.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No student matches.</li>}
          {!data && isFetching && <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>}
        </ul>
      )}
    </div>
  );
}

/** Grants VIP by hand: no payment is recorded, so revenue is untouched. */
export function GrantDialog({
  student: preset,
  onOpenChange,
}: {
  /** Set when opened from a student's own page. */
  student?: Student;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const products = useProducts();
  const [student, setStudent] = useState<Student | null>(preset ?? null);
  const [product, setProduct] = useState("");
  const [until, setUntil] = useState(monthsFromNow(1));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      subscriptionsApi.grant({
        user: student!.id,
        product: Number(product),
        expires_at: endOfDay(until),
        note: note.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("VIP granted");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="md"
      title="Grant VIP"
      description="Gives a student VIP without a payment, for example after they paid outside the app."
      submitLabel="Grant VIP"
      pending={save.isPending}
      canSubmit={Boolean(student && product && until && note.trim())}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <Field id="grant-student" label="Student" required>
        {preset ? (
          <p className="text-sm text-foreground">
            {preset.name || preset.mobile}
            {preset.name && <span className="text-muted-foreground"> · {preset.mobile}</span>}
          </p>
        ) : (
          <StudentPicker student={student} onPick={setStudent} />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="grant-plan" label="Plan" required hint="What the grant stands for.">
          <LookupSelect
            id="grant-plan"
            value={product}
            onChange={setProduct}
            options={products.data}
            placeholder="Pick a plan"
            className="w-full"
          />
        </Field>
        <Field id="grant-until" label="VIP until" required hint="Through the end of this day.">
          <Input
            id="grant-until"
            type="date"
            min={toDay(new Date())}
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </Field>
      </div>

      <Field id="grant-note" label="Reason" required hint="Kept on the record with your name.">
        <Input
          id="grant-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Paid ৳499 by bKash on 18 Nov"
        />
      </Field>
    </FormDialog>
  );
}

/** Extends, revokes or restores a subscription, whatever it came from. */
export function EditSubscriptionDialog({
  subscription,
  onOpenChange,
}: {
  subscription: Subscription;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [until, setUntil] = useState(toDay(new Date(subscription.expires_at)));
  const [isActive, setIsActive] = useState(subscription.is_active);
  const [note, setNote] = useState(subscription.note);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      subscriptionsApi.update(subscription.id, {
        // An untouched date keeps its exact time rather than moving to the end of the day.
        ...(until !== toDay(new Date(subscription.expires_at)) && { expires_at: endOfDay(until) }),
        is_active: isActive,
        note: note.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("Subscription updated");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="md"
      title="Change subscription"
      description={`${subscription.user_name || subscription.user_mobile} · ${subscription.product_title} · ${subscriptionSource(subscription.source)}, from ${date(subscription.starts_at)}`}
      submitLabel="Save changes"
      pending={save.isPending}
      canSubmit={Boolean(until)}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <Field id="subscription-until" label="VIP until" required hint="Move it later to extend, earlier to cut short.">
        <Input id="subscription-until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
      </Field>

      <label htmlFor="subscription-active" className="flex items-start gap-3">
        <Switch id="subscription-active" checked={isActive} onCheckedChange={setIsActive} className="mt-0.5" />
        <span>
          <span className="block text-sm text-foreground">In force</span>
          <span className="block text-xs text-muted-foreground">
            Switch off to revoke it, for example after a refund. The record is kept.
          </span>
        </span>
      </label>

      <Field id="subscription-note" label="Note" hint="Why it was changed. Kept with your name.">
        <Input id="subscription-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </FormDialog>
  );
}
