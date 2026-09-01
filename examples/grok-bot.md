# Grok Bot / local agent stdio

Read-only. Do **not** set `NINENINE_ALLOW_MUTATIONS` in the Bot environment.

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

Personal token stays in `~/.ninenine-mcp/tokens.json` on the machine that runs the Bot VM, or as `NINENINE_ACCESS_TOKEN` in Runtime Secrets — never in the prompt, Drive, or git.

Request-ride remains listed but returns `USER_ACTION_REQUIRED` until both gates are on **and** the user set `explicit_user_intent`.

Recipe — “99 pra casa, Pop vs Moto, não chama”: `ninenine_connection_status` → `ninenine_estimate` with origin/destination. Always show **99Pop and 99Moto**. Stop. Do not call `ninenine_request_ride`.

Skill path (no MCP client): copy `skill/SKILL.md` into the Bot skills dir and use `ninenine-mcp-unofficial call …`. Same gates. Do not set mutation flags in the Bot environment.
