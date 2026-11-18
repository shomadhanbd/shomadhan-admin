/**
 * Django REST Framework error bodies. A validation failure is `{field: [msg], non_field_errors: [msg]}`; anything
 * else is `{detail: msg}`, sometimes in problem+json form with `type`, `title` and `status` beside it.
 */
type ErrorBody = Record<string, unknown>;

/** Fields whose name doesn't read well once humanized. */
const FIELD_LABELS: Record<string, string> = {
  product_id: "Product ID",
  url: "URL",
  pdf_url: "PDF URL",
  icon_url: "Icon URL",
};

/** Errors about the request as a whole, not one field. */
const FORM_WIDE = new Set(["non_field_errors", "__all__", "detail"]);

/** problem+json members that describe the error rather than carry a message for a field. */
const META = new Set(["type", "title", "status", "code", "instance"]);

const FALLBACK = "Something went wrong. Please try again.";

function fieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const words = field
    .replace(/_ids?$/, "")
    .replace(/_/g, " ")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function body(err: unknown): ErrorBody | undefined {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  return data && typeof data === "object" && !Array.isArray(data) ? (data as ErrorBody) : undefined;
}

/** The first message from the backend's error body, prefixed with its field when it belongs to one. */
export function apiError(err: unknown): string {
  const response = (err as { response?: unknown })?.response;
  if (!response) {
    // No response at all: the request never reached the API (server down, offline, CORS).
    return err instanceof Error && !("isAxiosError" in err)
      ? err.message
      : "Could not reach the server. Check your connection and try again.";
  }
  const data = body(err);
  if (!data) return FALLBACK;
  if (typeof data.detail === "string") return data.detail;
  for (const [field, messages] of Object.entries(data)) {
    if (META.has(field)) continue;
    const first = Array.isArray(messages) ? messages.find((m) => typeof m === "string") : messages;
    if (typeof first !== "string") continue;
    return FORM_WIDE.has(field) ? first : `${fieldLabel(field)}: ${first}`;
  }
  return typeof data.title === "string" ? data.title : FALLBACK;
}

type ErrorTree = string | ErrorTree[] | { [field: string]: ErrorTree };

/**
 * The validation errors, keyed by field name; empty for any other failure.
 * A nested serializer's errors (`{question: {marks: [...]}}`, or wrapped in a list) are lifted to the
 * top, so the input that caused them shows the message.
 */
export function fieldErrors(err: unknown): Record<string, string> {
  const flat: Record<string, string> = {};
  const walk = (field: string, value: ErrorTree) => {
    if (typeof value === "string") flat[field] ??= value;
    else if (Array.isArray(value)) value.forEach((item) => walk(field, item));
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([inner, nested]) => walk(inner, nested));
  };
  Object.entries(body(err) ?? {}).forEach(([field, value]) => {
    if (!FORM_WIDE.has(field) && !META.has(field)) walk(field, value as ErrorTree);
  });
  return flat;
}
