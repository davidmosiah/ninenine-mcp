/** Strip DevTools `Authorization: Bearer …` paste into a raw access token. */
export function normalizeAccessToken(raw: string | undefined): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/^Bearer\s+/i, "").trim();
}
