import { DEFAULT_API_BASE, PASSENGER_HOSTS, PATHS } from "../constants.js";

const PREFIXES = Object.values(PATHS);

export function isAllowedConsumerPath(path: string): boolean {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  if (path.includes("://") || path.includes("..") || path.includes("\\")) return false;
  return PREFIXES.some((base) => path === base || path.startsWith(`${base}/`));
}

export function assertAllowedConsumerPath(path: string): void {
  if (!isAllowedConsumerPath(path)) {
    throw new Error(`PATH_NOT_ALLOWED: refusing unofficial 99 path ${path}`);
  }
}

const ALLOWED_HOSTS = new Set(
  [DEFAULT_API_BASE, ...Object.values(PASSENGER_HOSTS)].map((base) => new URL(base).hostname)
);

export function isAllowedNinenineHost(url: string): boolean {
  try {
    return ALLOWED_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
