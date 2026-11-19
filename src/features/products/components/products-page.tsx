"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { money } from "@/lib/format";
import { useProducts } from "@/lib/lookups";
import { PRODUCTS, productKeys, productsApi } from "@/features/products/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, Field, ListToolbar, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RowActions } from "@/components/shared/row-actions";
import type { Product } from "@/features/products/types";

/** `6 months`, `1 month`. */
const months = (n: number) => `${n} ${n === 1 ? "month" : "months"}`;

function ProductDialog({ product, onOpenChange }: { product: Product | null; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(product);
  const products = useProducts();

  const [code, setCode] = useState(product?.code ?? "");
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [basePrice, setBasePrice] = useState(product ? String(product.base_price) : "");
  const [duration, setDuration] = useState(product ? String(product.duration_months) : "");
  const [addon, setAddon] = useState(product?.addon ? String(product.addon) : "");
  const [couponApplicable, setCouponApplicable] = useState(product?.coupon_applicable ?? true);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(product ? String(product.sort_order) : "0");
  const [error, setError] = useState<string | null>(null);

  // Any plan but this one can be offered beside it.
  const addonOptions = useMemo(() => products.data?.filter((p) => p.id !== product?.id), [products.data, product]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code: code.trim(),
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        // Left blank, the struck-through price is the selling price: no marketing discount shown.
        base_price: Number(basePrice || price),
        duration_months: Number(duration),
        addon: addon ? Number(addon) : null,
        coupon_applicable: couponApplicable,
        is_active: isActive,
        sort_order: Number(sortOrder) || 0,
      };
      return isEdit ? productsApi.update(product!.id, payload) : productsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.lookup });
      toast.success(isEdit ? "Plan updated" : "Plan added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="md"
      title={isEdit ? "Edit plan" : "New plan"}
      description={isEdit ? product!.title : "A VIP plan students can buy in the app."}
      submitLabel={isEdit ? "Save changes" : "Add plan"}
      pending={save.isPending}
      canSubmit={Boolean(code.trim() && title.trim() && Number(price) >= 0 && price !== "" && Number(duration) >= 1)}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <Field id="product-title" label="Title" required>
        <Input
          id="product-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. VIP 6 months"
          autoFocus
        />
      </Field>

      <Field
        id="product-code"
        label="Code"
        required
        hint={
          isEdit
            ? "The app and the App Store refer to the plan by this code, so it cannot change."
            : "e.g. vip_6_month. Fixed once saved."
        }
      >
        <Input
          id="product-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isEdit}
          className="font-mono"
        />
      </Field>

      <Field id="product-description" label="Description">
        <Input id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="product-price" label="Price (৳)" required>
          <Input id="product-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field id="product-base-price" label="Was (৳)" hint="Struck through beside the price.">
          <Input
            id="product-base-price"
            type="number"
            min={0}
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder={price || "Same as price"}
          />
        </Field>
        <Field id="product-duration" label="Months" required>
          <Input
            id="product-duration"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field id="product-addon" label="Add-on" hint="Another plan offered alongside this one.">
          <LookupSelect
            id="product-addon"
            value={addon}
            onChange={setAddon}
            options={addonOptions}
            placeholder="None"
            allLabel="None"
            className="w-full"
          />
        </Field>
        <Field id="product-sort" label="Order" hint="Lower first.">
          <Input
            id="product-sort"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-24"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor="product-coupons" className="flex items-center gap-3">
          <Switch id="product-coupons" checked={couponApplicable} onCheckedChange={setCouponApplicable} />
          <span className="text-sm text-foreground">Accepts coupons</span>
        </label>
        <label htmlFor="product-active" className="flex items-center gap-3">
          <Switch id="product-active" checked={isActive} onCheckedChange={setIsActive} />
          <span className="text-sm text-foreground">On sale</span>
        </label>
      </div>
    </FormDialog>
  );
}

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null | "new">(null);

  const {
    rows,
    isLoading,
    isFetching,
    search,
    onSearch,
    deleting,
    setDeleting,
    remove,
    pagination,
    total,
    sort,
    onSort,
  } = useCrudList<Product>({
    key: productKeys.all[0],
    path: PRODUCTS,
    onDeleted: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lookup });
      toast.success("Plan deleted");
    },
  });

  const columns: Column<Product>[] = [
    {
      key: "plan",
      header: "Plan",
      cell: (p) => (
        <div className="min-w-0">
          <p className="line-clamp-1 font-medium text-foreground">{p.title}</p>
          <p className="line-clamp-1 font-mono text-xs text-muted-foreground">{p.code}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortKey: "price",
      width: "130px",
      cell: (p) => (
        <div>
          <p className="text-sm font-medium text-foreground">{money(p.price)}</p>
          {p.base_price > p.price && (
            <p className="text-xs text-muted-foreground line-through">{money(p.base_price)}</p>
          )}
        </div>
      ),
    },
    {
      key: "duration",
      header: "Length",
      sortKey: "duration_months",
      width: "110px",
      cell: (p) => <span className="text-sm text-foreground">{months(p.duration_months)}</span>,
    },
    {
      key: "sales",
      header: "Sales",
      align: "right",
      sortKey: "sales",
      sortFirst: "desc",
      secondary: true,
      width: "90px",
      cell: (p) => <span className="text-sm text-muted-foreground">{p.sales}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "150px",
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.is_active ? <Badge variant="secondary">On sale</Badge> : <Badge variant="outline">Hidden</Badge>}
          {!p.coupon_applicable && <Badge variant="outline">No coupons</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "110px",
      cell: (p) => (
        <div className="flex justify-end">
          <RowActions
            actions={[
              { icon: <Pencil className="h-4 w-4" />, label: `Edit ${p.title}`, onClick: () => setEditing(p) },
              {
                icon: <Trash2 className="h-4 w-4" />,
                label: `Delete ${p.title}`,
                onClick: () => setDeleting(p),
                destructive: true,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const filtered = Boolean(search);
  function clearFilters() {
    onSearch("");
  }
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New plan
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Plans" description="The VIP plans students can buy, in the order the app lists them">
        {newButton("lg")}
      </PageHeader>

      <ListToolbar total={isLoading ? undefined : total} noun="plans" filtered={filtered} onClear={clearFilters}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search plans…" />
      </ListToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        sort={sort}
        onSort={onSort}
        onRowClick={setEditing}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          search ? (
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="No plans match this search"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No plans yet"
              description="A plan is what a student buys to unlock VIP content for a number of months."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <ProductDialog
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this plan?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.title}</span> will be removed. A plan that has been
            bought cannot be deleted. Switch off &ldquo;On sale&rdquo; to hide it instead.
          </>
        }
        confirmLabel="Delete plan"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
