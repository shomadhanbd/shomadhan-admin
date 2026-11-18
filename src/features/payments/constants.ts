import type { AppleStatus, PaymentStatus } from "./types";

type Variant = "default" | "secondary" | "outline" | "destructive";

export const PAYMENT_STATUSES: { id: PaymentStatus; name: string; variant: Variant }[] = [
  { id: "VALID", name: "Paid", variant: "default" },
  { id: "INITIATED", name: "Started", variant: "secondary" },
  { id: "FAILED", name: "Failed", variant: "destructive" },
  { id: "CANCELLED", name: "Cancelled", variant: "outline" },
  { id: "EXPIRED", name: "Expired", variant: "outline" },
];

export const APPLE_STATUSES: { id: AppleStatus; name: string; variant: Variant }[] = [
  { id: "VERIFIED", name: "Paid", variant: "default" },
  { id: "REFUNDED", name: "Refunded", variant: "destructive" },
  { id: "REVOKED", name: "Revoked", variant: "outline" },
];

export const paymentStatus = (id: PaymentStatus) => PAYMENT_STATUSES.find((s) => s.id === id)!;
export const appleStatus = (id: AppleStatus) => APPLE_STATUSES.find((s) => s.id === id)!;
