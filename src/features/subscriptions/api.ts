import api from "@/lib/api";
import type { GrantBody, Subscription, SubscriptionChange } from "./types";

/** `/admin/subscriptions/`: who has VIP and until when. Granted and changed here, never deleted. */
export const SUBSCRIPTIONS = "/admin/subscriptions/";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
};

export const subscriptionsApi = {
  grant: async (body: GrantBody) => (await api.post<Subscription>(SUBSCRIPTIONS, body)).data,
  update: async (id: number, body: SubscriptionChange) =>
    (await api.patch<Subscription>(`${SUBSCRIPTIONS}${id}/`, body)).data,
};
