import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { SERVER_VERSION } from "../constants.js";
import { peekConfig } from "../services/config.js";
import { buildConnectionStatus } from "../services/connection-status.js";
import { TokenStore } from "../services/token-store.js";
import { normalizeAccessToken } from "../services/auth-token.js";

export async function runCliCommand(args: string[]): Promise<number | undefined> {
  const [command, ...rest] = args;
  if (!command || command === "--http") return undefined;
  if (command === "setup") return runSetup(rest);
  if (command === "auth" || command === "login") return runAuth(rest);
  if (command === "doctor" || command === "status") return runDoctor(rest);
  if (command === "version" || command === "--version" || command === "-v") {
    console.log(SERVER_VERSION);
    return 0;
  }
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }
  if (!command.startsWith("--")) {
    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  }
  return undefined;
}

async function runSetup(args: string[]): Promise<number> {
  const allow = args.includes("--allow-mutations");
  const config = peekConfig();
  mkdirSync(dirname(config.configPath), { recursive: true, mode: 0o700 });
  writeFileSync(
    config.configPath,
    JSON.stringify(
      {
        unofficial: true,
        country: config.country,
        api_base: config.apiBase,
        allow_mutations: allow,
        never_pays_by_default: !allow
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
  console.log(`Wrote ${config.configPath} (0600). Mutations ${allow ? "ENABLED — you can be charged" : "disabled (default)"}.`);
  console.log("Next: ninenine-mcp-unofficial auth --from-header \"Bearer …\"");
  return 0;
}

async function runAuth(args: string[]): Promise<number> {
  const headerIdx = args.indexOf("--from-header");
  const idx = args.indexOf("--token");
  const raw =
    headerIdx >= 0 ? args[headerIdx + 1] : idx >= 0 ? args[idx + 1] : process.env.NINENINE_ACCESS_TOKEN;
  const token = normalizeAccessToken(raw);
  if (!token || token.startsWith("--")) {
    console.error(`99 has no consumer OAuth. Capture a passenger ticket:

  1. Open the 99 passenger app (or a captured request to api.99taxis.mobi)
  2. Copy Authorization then:
     ninenine-mcp-unofficial auth --from-header "Bearer eyJ…"
     ninenine-mcp-unofficial auth --token <ticket>

Estimates still work without a token; request-ride stays blocked.
Do not paste tokens into git.`);
    return 1;
  }
  const config = peekConfig();
  const store = new TokenStore(config.tokenPath);
  await store.write({ access_token: token, source: "user", token_type: "Bearer" });
  console.log(`Stored personal token at ${config.tokenPath} (0600).`);
  return 0;
}

async function runDoctor(args: string[]): Promise<number> {
  const status = await buildConnectionStatus();
  if (args.includes("--json")) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(`99 MCP · Doctor  ${status.ok ? "READY" : "NEEDS AUTH"}`);
    console.log(`Unofficial: yes   Mutations: ${status.mutations_enabled}   Privacy: ${status.privacy_mode}`);
    console.log(`Token file: ${status.token.path} exists=${status.token.exists}`);
    if (status.missing_env.length) console.log(`Missing: ${status.missing_env.join(", ")}`);
    for (const step of status.next_steps) console.log(`- ${step}`);
  }
  return args.includes("--strict") && !status.ok ? 1 : 0;
}

function printHelp(): void {
  console.log(`ninenine-mcp-unofficial ${SERVER_VERSION}
Unofficial local-first 99 passenger MCP. Never pays unless NINENINE_ALLOW_MUTATIONS and explicit_user_intent.

Commands:
  setup [--allow-mutations]   write ~/.ninenine-mcp/config.json (0600)
  auth --token <token>              store personal access token (0600)
  auth --from-header "Bearer …"     same, from DevTools Authorization
  doctor [--json] [--strict]
  version

Default transport: stdio. Optional: --http (loopback only).`);
}
