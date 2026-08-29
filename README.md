<h1 align="center">99 MCP</h1>

<h3 align="center">
  Give your AI agent 99Pop / 99Moto fare estimates, ride history and tracking.<br>
  Local-first MCP &mdash; <strong>credentials never leave your machine</strong>.<br>
  Requesting a car is <strong>fail-closed</strong> unless you opt in twice.
</h3>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-MIT-22C55E?style=for-the-badge&labelColor=0F172A" alt="License MIT" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/BUILT_FOR-MCP-7C3AED?style=for-the-badge&labelColor=0F172A" alt="Built for MCP" /></a>
</p>

> **Unofficial.** Not affiliated with, endorsed by, or supported by 99 or DiDi. Not 99Food, 99Pay, 99Entrega, metro tickets, or the 99 corp B2B API. The passenger gulfstream surface can change without notice.

> **Never pays by default.** `ninenine_request_ride` and `ninenine_cancel_ride` do nothing unless `NINENINE_ALLOW_MUTATIONS` is enabled **and** `explicit_user_intent` is true. Guest tokens cannot charge. Street, phone, email and GPS/latlng polylines are redacted (status / ETA / category only).

## Setup in 60 seconds

```bash
npx -y ninenine-mcp-unofficial setup
npx -y ninenine-mcp-unofficial auth --from-header "Bearer eyJ…"
npx -y ninenine-mcp-unofficial doctor
```

Token is **not** OAuth. Capture a passenger request to `api.99taxis.mobi` → copy the `Authorization` header. Fare estimates still run without a token; pay tools stay blocked.

Stdio snippet (Claude Desktop, Cursor, Grok Bot). Do **not** set mutations in the snippet:

```json
{
  "mcpServers": {
    "ninenine": {
      "command": "npx",
      "args": ["-y", "ninenine-mcp-unofficial"]
    }
  }
}
```

See [examples/claude-desktop.json](examples/claude-desktop.json) and [examples/grok-bot.md](examples/grok-bot.md).

## Skill or MCP

Same package, two doors. MCP registers tools on stdio/HTTP. The [skill](skill/SKILL.md) is the workflow (estimate → compare Pop/Moto → stop) and can drive the **same** tools through the CLI when the client has no MCP:

```bash
npx -y ninenine-mcp-unofficial call ninenine_estimate --json '{"from_lat":-3.73,"from_lng":-38.52,"to_lat":-3.74,"to_lng":-38.54}'
```

Gates are identical. Copy `skill/SKILL.md` into your agent skills dir (`~/.agents/skills/ninenine/` or Claude/Grok equivalent).

## Tools

| Kind | Tools |
| --- | --- |
| Read · fares | `ninenine_estimate` (always 99Pop + 99Moto) |
| Read · account | `ninenine_list_addresses`, `ninenine_ride_history` |
| Read · live | `ninenine_track_ride`, `ninenine_active_ride` |
| Meta | `ninenine_connection_status`, `ninenine_capabilities`, `ninenine_privacy_audit` |
| Gated pay (mutations **and** intent) | `ninenine_request_ride`, `ninenine_cancel_ride` |
| Intent only | `ninenine_logout` |

## HTTP (optional, loopback)

Default transport is **stdio**. Streamable HTTP binds `127.0.0.1` and checks `Origin` against `http://127.0.0.1:<port>` (override with `NINENINE_MCP_ALLOWED_ORIGIN`). This is DNS-rebinding mitigation, not a public server.

```bash
npx -y ninenine-mcp-unofficial --http
# GET  http://127.0.0.1:3000/health
# POST http://127.0.0.1:3000/mcp
```

## Security

Tokens live in `~/.ninenine-mcp/tokens.json` (0600). They are not in git, the npm tarball, or default examples. Full notes: [SECURITY.md](SECURITY.md). Agents: [llms.txt](llms.txt).

## Tests

```bash
npm test
```

No live 99 login required.
