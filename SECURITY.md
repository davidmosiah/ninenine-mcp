# Security Policy

## Reporting

Report vulnerabilities privately. Never paste 99 tokens, addresses, phone numbers, driver phones, or GPS polylines in public issues.

## Data this server may touch

- Personal 99 passenger ticket in `NINENINE_ACCESS_TOKEN` or `~/.ninenine-mcp/tokens.json` (0600).
- Fare quotes, saved addresses (from config), ride history and active-ride status from the unofficial passenger surface.

## Fail-closed money rules

- Default is read-only. Requesting a car does **not** run.
- `ninenine_request_ride` and `ninenine_cancel_ride` require **both** `NINENINE_ALLOW_MUTATIONS` enabled and `explicit_user_intent`.
- Guest tokens cannot request, cancel, or charge.
- Logout requires `explicit_user_intent` only.
- Default privacy mode redacts street, phone, email, lat/lng and polylines (status / ETA / category only).

## Local hardening

- Store tokens on a trusted machine only, outside iCloud/Dropbox.
- Do not put `NINENINE_ACCESS_TOKEN` in a committed MCP config; prefer `ninenine-mcp-unofficial auth --token`.
- Keep `NINENINE_ALLOW_MUTATIONS` unset unless you intentionally want an agent to be able to charge you.
- The npm tarball does not include `~/.ninenine-mcp`, `.env`, or live credentials.

## Optional HTTP

`--http` listens on `127.0.0.1` by default. Requests with an `Origin` header must match `NINENINE_MCP_ALLOWED_ORIGIN` or `http://127.0.0.1:<port>`. Binding a non-loopback host is an operator choice; Origin checks are DNS-rebinding mitigation, not a remote multi-tenant product.

The HTTP client only calls allowlisted unofficial passenger paths (config, estimate, history, track, request, cancel). Arbitrary URLs are rejected in-process.

## Unofficial surface

99 does not publish a personal passenger API. This package talks to the same undocumented gulfstream endpoints (`api.99taxis.mobi` by default). They can change without notice. This is **not** 99Food, 99Pay, 99Entrega, or the 99 corp B2B API.

## Consumer transport restrictions

API-base overrides must be bare HTTPS origins on the provider allowlist and default port 443, without URL credentials, query, or fragment. Redirects fail closed rather than forwarding requests outside the reviewed origin/path. For the 99 passenger connector specifically, this also protects ticket/token body credentials on 307/308 redirects. Overrides are local configuration, not agent input.

CLI tool calls validate the shared field/type/default schemas before handlers. CLI unknown fields are now rejected (the MCP SDK may strip them), so error behavior is intentionally stricter, with a 10,000-element argument budget and 1 MiB JSON text cap. Provider responses are limited to 4 MiB of decoded bytes, including streams without trustworthy Content-Length; over-limit or aborted readers are cancelled.
