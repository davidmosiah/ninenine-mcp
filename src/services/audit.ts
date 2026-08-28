import { peekConfig } from "./config.js";

export function buildPrivacyAudit() {
  const config = peekConfig();
  return {
    unofficial: true as const,
    privacy_mode: config.privacyMode,
    mutations_enabled: config.allowMutations,
    secret_env_vars: ["NINENINE_ACCESS_TOKEN"],
    token_path: config.tokenPath,
    redacts_by_default: ["street", "address", "phone", "email", "lat", "lng", "polyline", "gps"],
    tarball_excludes: [".ninenine-mcp/", ".env", "tokens.json"],
    never_pays_by_default: true
  };
}
