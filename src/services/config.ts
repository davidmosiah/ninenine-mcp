import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_API_BASE, PASSENGER_HOSTS, TOKEN_DIR_NAME, WEB_ORIGIN } from "../constants.js";
import type { NinenineConfig, PrivacyMode } from "../types.js";

type Env = Record<string, string | undefined>;

function env(name: string, source: Env = process.env): string | undefined {
  const value = source[name];
  return value && value.trim() ? value.trim() : undefined;
}

function parseBool(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parsePrivacyMode(value: string | undefined): PrivacyMode {
  if (value === "summary" || value === "structured" || value === "raw") return value;
  return "summary";
}

function parseCoord(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function tokenDir(homeDir = homedir()): string {
  return join(homeDir, TOKEN_DIR_NAME);
}

export function peekConfig(source: Env = process.env, homeDir = homedir()): NinenineConfig {
  const country = (env("NINENINE_COUNTRY", source) ?? "BR").toUpperCase();
  const apiBase = env("NINENINE_API_BASE", source) ?? PASSENGER_HOSTS[country] ?? DEFAULT_API_BASE;
  const dir = tokenDir(homeDir);
  return {
    apiBase: apiBase.replace(/\/$/, ""),
    country,
    origin: env("NINENINE_ORIGIN", source) ?? WEB_ORIGIN,
    tokenPath: env("NINENINE_TOKEN_PATH", source) ?? join(dir, "tokens.json"),
    configPath: env("NINENINE_CONFIG_PATH", source) ?? join(dir, "config.json"),
    deviceIdPath: env("NINENINE_DEVICE_ID_PATH", source) ?? join(dir, "device-id"),
    privacyMode: parsePrivacyMode(env("NINENINE_PRIVACY_MODE", source)),
    allowMutations: parseBool(env("NINENINE_ALLOW_MUTATIONS", source), false),
    latitude: parseCoord(env("NINENINE_LAT", source)),
    longitude: parseCoord(env("NINENINE_LNG", source))
  };
}

export function envAccessToken(source: Env = process.env): string | undefined {
  return env("NINENINE_ACCESS_TOKEN", source);
}
