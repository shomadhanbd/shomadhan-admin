"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { date, fromLocalInput, money, toLocalInput } from "@/lib/format";
import { useProducts } from "@/lib/lookups";
import { COUPONS, couponKeys, couponsApi } from "@/features/coupons/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChipSelect } from "@/components/shared/chip-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, Field, ListToolbar, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RowActions } from "@/components/shared/row-actions";
import type { Coupon, CouponStatus } from "@/features/coupons/types";

const STATUS: Record<CouponStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Redeemable", variant: "default" },
  scheduled: { label: "Not started", variant: "secondary" },
  expired: { label: "Expired", variant: "outline" },
  used_up: { label: "Used up", variant: "outline" },
  inactive: { label: "Switched off", variant: "outline" },
};

const ACTIVE_FILTER = [
  { id: "true", name: "Switched on" },
  { id: "false", name: "Switched off" },
];

function CouponDialog({ coupon, onOpenChange }: { coupon: Coupon | null; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(coupon);
  const products = useProducts();

  const [code, setCode] = useState(coupon?.code ?? "");
  const [discount, setDiscount] = useState(coupon ? String(coupon.discount_amount) : "");
  const [from, setFrom] = useState(toLocalInput(coupon?.valid_from));
  const [until, setUntil] = useState(toLocalInput(coupon?.valid_until));
  const [maxUses, setMaxUses] = useState(coupon?.max_uses != null ? String(coupon.max_uses) : "");
  const [appliesTo, setAppliesTo] = useState<number[]>(coupon?.applies_to ?? []);
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code: code.trim(),
        discount_amount: Number(discount),
        valid_from: fromLocalInput(from, coupon?.valid_from),
        valid_until: fromLocalInput(until, coupon?.valid_until),
        max_uses: maxUses ? Number(maxUses) : null,
        applies_to: appliesTo,
        is_active: isActive,
      };
      return isEdit ? couponsApi.update(coupon!.id, payload) : couponsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
      toast.success(isEdit ? "Coupon updated" : "Coupon added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="md"
      title={isEdit ? "Edit coupon" : "New coupon"}
      description={isEdit ? coupon!.code : "A code students enter at checkout for a flat discount."}
      submitLabel={isEdit ? "Save changes" : "Add coupon"}
      pending={save.isPending}
      canSubmit={Boolean(code.trim()) && Number(discount) > 0}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="coupon-code" label="Code" required hint="Students can type it in any case.">
          <Input
            id="coupon-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. EID50"
            className="font-mono"
            autoFocus
          />
        </Field>
        <Field id="coupon-discount" label="Discount (৳)" required hint="At least ৳10 must be left to pay.">
          <Input
            id="coupon-discount"
            type="number"
            min={1}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </Field>
        <Field
          id="coupon-max-uses"
          label="Use limit"
          hint={coupon?.times_used ? `Used ${coupon.times_used} times so far. Blank: unlimited.` : "Blank: unlimited."}
        >
          <Input
            id="coupon-max-uses"
            type="number"
            min={coupon?.times_used || 1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="coupon-from" label="Starts" hint="Blank: from now.">
          <Input id="coupon-from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field id="coupon-until" label="Ends" hint="Blank: never expires.">
          <Input id="coupon-until" type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
        </Field>
      </div>

      <ChipSelect
        label="Plans"
        options={products.data}
        value={appliesTo}
        onChange={setAppliesTo}
        empty="No plans exist yet."
      />
      <p className="-mt-2 text-xs text-muted-foreground">None picked: it works on every plan that accepts coupons.</p>

      <label htmlFor="coupon-active" className="flex items-center gap-3">
        <Switch id="coupon-active" checked={isActive} onCheckedChange={setIsActive} />
        <span className="text-sm text-foreground">Switched on</span>
      </label>
    </FormDialog>
  );
}

export function CouponsPage() {
  const products = useProducts();
  const [active, setActive] = useUrlState("active");
  const [editing, setEditing] = useState<Coupon | null | "new">(null);

  const {
    rows,
    isLoading,
    isFetching,
    search,
    onSearch,
    setPage,
    deleting,
    setDeleting,
    remove,
    pagination,
    total,
    sort,
    onSort,
  } = useCrudList<Coupon>({
    key: couponKeys.all[0],
    path: COUPONS,
    params: { is_active: active },
    onDeleted: () => toast.success("Coupon deleted"),
  });

  const planNames = (ids: number[]) =>
    ids.length === 0
      ? "All plans"
      : (products.data ?? [])
          .filter((p) => ids.includes(p.id))
          .map((p) => p.name)
          .join(", ") || `${ids.length} plans`;

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-mono font-medium text-foreground">{c.code}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{planNames(c.applies_to)}</p>
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      align: "right",
      sortKey: "discount_amount",
      sortFirst: "desc",
      width: "110px",
      cell: (c) => <span className="text-sm font-medium text-foreground">{money(c.discount_amount)}</span>,
    },
    {
      key: "validity",
      header: "Valid",
      sortKey: "valid_until",
      secondary: true,
      width: "230px",
      cell: (c) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {c.valid_from || c.valid_until
            ? `${c.valid_from ? date(c.valid_from) : "Now"} – ${c.valid_until ? date(c.valid_until) : "no end"}`
            : "Always"}
        </span>
      ),
    },
    {
      key: "uses",
      header: "Used",
      align: "right",
      sortKey: "times_used",
      sortFirst: "desc",
      width: "100px",
      cell: (c) => (
        <span className="text-sm text-foreground tabular-nums">
          {c.times_used}
          {c.max_uses != null && <span className="text-muted-foreground"> / {c.max_uses}</span>}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
      cell: (c) => <Badge variant={STATUS[c.status].variant}>{STATUS[c.status].label}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "56px",
      cell: (c) => (
        <div className="flex justify-end">
          <RowActions
            name={c.code}
            actions={[
              { icon: <Pencil className="h-4 w-4" />, label: "Edit", onClick: () => setEditing(c) },
              {
                icon: <Trash2 className="h-4 w-4" />,
                label: "Delete",
                onClick: () => setDeleting(c),
                destructive: true,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const filtered = Boolean(search || active);

  function clearFilters() {
    onSearch("");
    setActive("");
  }
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New coupon
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Discount codes students enter when they buy a plan">
        {newButton("lg")}
      </PageHeader>

      <ListToolbar total={isLoading ? undefined : total} noun="coupons" filtered={filtered} onClear={clearFilters}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search codes…" />
        <LookupSelect
          ariaLabel="Filter by switched on or off"
          value={active}
          onChange={(v) => {
            setActive(v);
            setPage(1);
          }}
          options={ACTIVE_FILTER}
          placeholder="All coupons"
          allLabel="All coupons"
          className="w-40 bg-card"
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        sort={sort}
        onSort={onSort}
        onRowClick={setEditing}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<TicketPercent className="h-5 w-5" />}
              title="No coupons match these filters"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No coupons yet"
              description="A coupon takes a fixed amount off a plan's price when a student enters its code."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <CouponDialog
          key={editing === "new" ? "new" : editing.id}
          coupon={editing === "new" ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this coupon?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.code}</span> will be removed. A coupon that has
            been used cannot be deleted. Switch it off instead.
          </>
        }
        confirmLabel="Delete coupon"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
