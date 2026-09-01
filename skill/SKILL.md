---
name: ninenine
description: >
  Unofficial 99 passenger rides in Brazil (99Pop + 99Moto). Fare estimates, ride
  history and tracking without opening the 99 app. Use when the user wants a 99
  quote, to compare Pop vs Moto, to track a ride, or says "chama um 99". Prefer
  MCP tools if connected; otherwise the package CLI. Never pays unless both
  gates are already on and the user said to request the car.
---

# 99 — skill or MCP

Unofficial. Not 99Food, 99Pay, 99Entrega, or corp B2B.

Same binary either way. Mutation gates live in the server, not in this file.

## Choose a surface

**MCP** — tools appear natively after stdio/HTTP config:

```json
{ "mcpServers": { "ninenine": { "command": "npx", "args": ["-y", "ninenine-mcp-unofficial"] } } }
```

Do not put mutation flags in that snippet.

**Skill / CLI** — no MCP client required. Same tools:

```bash
npx -y ninenine-mcp-unofficial doctor --json
npx -y ninenine-mcp-unofficial call ninenine_capabilities --json '{}'
npx -y ninenine-mcp-unofficial call ninenine_estimate --json '{"from_lat":-3.73,"from_lng":-38.52,"to_lat":-3.74,"to_lng":-38.54}'
```

If MCP tools named `ninenine_*` are already available, use them. Do not also shell out.

## Setup (once)

```bash
npx -y ninenine-mcp-unofficial setup
npx -y ninenine-mcp-unofficial auth --from-header "Bearer …"
```

Token is a captured passenger `Authorization` to `api.99taxis.mobi`, stored at `~/.ninenine-mcp/tokens.json` (0600). Estimates work without a token; request-ride stays blocked.

## Loop

1. `ninenine_connection_status` (or `doctor --json`). Expect `unofficial` and `never_pays_by_default`.
2. `ninenine_estimate` with origin/destination. Always show **99Pop and 99Moto** with price/ETA. Optional `ninenine_multi_estimate`. Never request a car.
3. History / track only if asked. GPS, street, phone stay redacted.
4. **Stop.** Do not call `ninenine_request_ride` or `ninenine_cancel_ride` unless the user clearly asked to request/cancel **this** ride. If the tool returns `USER_ACTION_REQUIRED`, report that and stop. Do not invent env flags.

## Never

- Enable mutations from this skill
- Paste tokens into git, chat logs, or the prompt
- Treat guest as able to pay
- Open 99Food
