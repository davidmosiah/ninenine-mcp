# Agent notes

Unofficial local-first 99 passenger MCP. Personal ride hail for David / Life / Grok Bot.

## Commands

- `npm ci`
- `npm test` (typecheck, build, smoke, mutation gate, redaction, handlers, secret-scan)
- `npx ninenine-mcp-unofficial doctor`
- `npx ninenine-mcp-unofficial call ninenine_capabilities --json '{}'`
- Skill: `skill/SKILL.md` (copy into the agent's skills dir; do not duplicate the API client)

## Rules

- Never commit tokens or `~/.ninenine-mcp/`.
- Never enable `NINENINE_ALLOW_MUTATIONS` in default examples.
- `ninenine_request_ride` must stay fail-closed in tests without both gates.
- Do not add this connector to the Delx Wellness registry (mobility, not wellness).
- Do not ship 99Food, 99Pay, 99Entrega, or corp `/v2/rides`.
- Live 99 login is not required for CI.
