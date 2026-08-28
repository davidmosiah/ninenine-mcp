const IDENTITY_KEY_PATTERN =
  /^(street|address|address_line|address_line_1|address_line_2|addressLine|full_address|fullAddress|phone|phone_number|phoneNumber|mobile|email|e_mail|last_four|lastFour|lastFourDigits|last4|card_last4|cardLast4|cvv|cvc|card_number|cardNumber|pan|lat|lng|latitude|longitude|from_lat|from_lng|to_lat|to_lng|flat|flng|tlat|tlng|polyline|gps|driver_phone|driverPhone|cell)$/i;

const SECRET_KEY_PATTERN =
  /^(access[_-]?token|refresh[_-]?token|id[_-]?token|authorization|password|api[_-]?key|client[_-]?secret|bearer|ticket)$/i;

export const REDACTED = "[REDACTED]";

export function redactIdentity(value: unknown): unknown {
  return walk(value, "identity");
}

export function redactSecrets(value: unknown): unknown {
  return walk(value, "secrets");
}

export function redactSensitive(value: unknown): unknown {
  return walk(value, "all");
}

function walk(value: unknown, mode: "identity" | "secrets" | "all"): unknown {
  if (Array.isArray(value)) return value.map((item) => walk(item, mode));
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? redactSecretStrings(value) : value;
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const hitIdentity = IDENTITY_KEY_PATTERN.test(key);
    const hitSecret = SECRET_KEY_PATTERN.test(key);
    if ((mode === "identity" || mode === "all") && hitIdentity) {
      out[key] = REDACTED;
      continue;
    }
    if ((mode === "secrets" || mode === "all") && hitSecret) {
      out[key] = REDACTED;
      continue;
    }
    out[key] = walk(nested, mode);
  }
  return out;
}

function redactSecretStrings(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/(access_token["'=:\s]+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/(refresh_token["'=:\s]+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/(ticket["'=:\s]+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]");
}

export function redactErrorMessage(message: string): string {
  return redactSecretStrings(message);
}
