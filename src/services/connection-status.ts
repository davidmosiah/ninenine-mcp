import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { envAccessToken, peekConfig } from "./config.js";
import { TokenStore } from "./token-store.js";

type Env = Record<string, string | undefined>;

export interface ConnectionStatus extends Record<string, unknown> {
  ok: boolean;
  unofficial: true;
  mutations_enabled: boolean;
  privacy_mode: string;
  country: string;
  api_base: string;
  missing_env: string[];
  token: {
    path: string;
    exists: boolean;
    source?: string;
    guest?: boolean;
  };
  next_steps: string[];
  never_pays_by_default: true;
  auth_methods: string[];
}

export async function buildConnectionStatus(options: { env?: Env; homeDir?: string } = {}): Promise<ConnectionStatus> {
  const env = options.env ?? process.env;
  const homeDir = options.homeDir ?? homedir();
  const config = peekConfig(env, homeDir);
  const store = new TokenStore(config.tokenPath);
  const fileToken = await store.read();
  const envToken = Boolean(envAccessToken(env));
  let exists = Boolean(fileToken?.access_token) || envToken;
  if (!exists) {
    try {
      await fs.access(config.tokenPath);
      exists = true;
    } catch {
      exists = false;
    }
  }
  const guest = fileToken?.source === "guest";
  const missing: string[] = [];
  if (!exists) missing.push("NINENINE_ACCESS_TOKEN");
  const next: string[] = [];
  if (!exists) {
    next.push("99 passenger has no consumer OAuth. Open the 99 app or a captured passenger request.");
    next.push("DevTools / mitm → copy Authorization, then ninenine-mcp-unofficial auth --from-header \"Bearer …\".");
  }
  if (!config.allowMutations) {
    next.push("Reads only. Request/cancel stay blocked until NINENINE_ALLOW_MUTATIONS is enabled AND explicit_user_intent.");
  }
  if (guest) next.push("Guest token cannot request or charge a ride. Replace with a personal token.");

  return {
    ok: exists && Number(process.versions.node.split(".")[0] ?? 0) >= 20,
    unofficial: true,
    mutations_enabled: config.allowMutations,
    privacy_mode: config.privacyMode,
    country: config.country,
    api_base: config.apiBase,
    missing_env: missing,
    token: {
      path: config.tokenPath,
      exists,
      source: fileToken?.source,
      guest
    },
    next_steps: next,
    never_pays_by_default: true,
    auth_methods: ["auth --from-header", "auth --token", "NINENINE_ACCESS_TOKEN"]
  };
}
