## 0.1.0 - 2026-08-28

Unofficial local-first 99 **passenger** MCP (stdio + optional loopback HTTP).

### Live-probed paths (JSON 200 errno body, not 403 HTML)

Host `https://api.99taxis.mobi` (also `api.didiglobal.com` / `api.udache.com`):

- `/gulfstream/passenger/v2/other/pGetConfig`
- `/gulfstream/passenger/v2/core/pEstimatePrice`
- `/gulfstream/passenger/v2/core/pMultiEstimatePrice`
- `/gulfstream/passenger/v2/other/pHistoryOrder`
- `/gulfstream/passenger/v2/core/pOrderStatus`
- `/gulfstream/passenger/v2/core/pNewOrder`
- `/gulfstream/passenger/v2/core/pCancelOrder`

Dedicated address URLs returned 404 HTML and were **not** shipped. `ninenine_list_addresses` reads `pGetConfig`.

### Added

- Read: 99Pop + 99Moto estimate, ride history, active track/status, addresses-from-config.
- Request/cancel fail-closed unless `NINENINE_ALLOW_MUTATIONS` and `explicit_user_intent`. Guest cannot charge.
- Token file `~/.ninenine-mcp/tokens.json` mode 0600. `auth --from-header` strips Bearer.
- Host + path allowlist; Origin check on optional HTTP; default bind 127.0.0.1.
- Default privacy redacts street/phone/email/GPS polyline.

### Out of scope

99Food, 99Pay, 99Entrega, metro tickets, corp B2B, wellness registry.
