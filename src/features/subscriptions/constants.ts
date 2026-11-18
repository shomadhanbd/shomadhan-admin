import type { SubscriptionSource, SubscriptionStatus } from "./types";

type Variant = "default" | "secondary" | "outline" | "destructive";

export const SUBSCRIPTION_STATUSES: { id: SubscriptionStatus; name: string; variant: Variant }[] = [
  { id: "active", name: "Active", variant: "default" },
  { id: "expired", name: "Expired", variant: "outline" },
  { id: "revoked", name: "Revoked", variant: "destructive" },
];

export const SUBSCRIPTION_SOURCES: { id: SubscriptionSource; name: string }[] = [
  { id: "sslcommerz", name: "SSLCommerz" },
  { id: "apple", name: "App Store" },
  { id: "admin", name: "Granted by admin" },
];

export const subscriptionStatus = (status: SubscriptionStatus) =>
  SUBSCRIPTION_STATUSES.find((s) => s.id === status) ?? SUBSCRIPTION_STATUSES[0];

export const subscriptionSource = (source: SubscriptionSource) =>
  SUBSCRIPTION_SOURCES.find((s) => s.id === source)?.name ?? source;
