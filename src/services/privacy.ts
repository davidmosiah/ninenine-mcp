import type { PrivacyMode } from "../types.js";
import { redactIdentity, redactSensitive } from "./redaction.js";

const SUMMARY_KEEPERS = new Set([
  "id",
  "name",
  "title",
  "status",
  "eta",
  "category",
  "product_id",
  "label",
  "fare",
  "currency",
  "count",
  "ok",
  "unofficial",
  "errno",
  "categories"
]);

export function applyPrivacy(payload: unknown, mode: PrivacyMode): unknown {
  if (mode === "raw") return redactSensitive(payload);
  if (mode === "summary") return summarize(redactIdentity(payload));
  return redactIdentity(payload);
}

function summarize(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 8).map(summarize);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SUMMARY_KEEPERS.has(key) || Array.isArray(nested) || (nested && typeof nested === "object")) {
      out[key] = summarize(nested);
    }
  }
  return out;
}
