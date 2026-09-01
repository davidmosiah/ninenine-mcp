## 0.1.2 - 2026-09-01

`ninenine_multi_estimate`, `ninenine_ride_categories` (pGetConfig extras), `ninenine_driver_track` (pOrderStatus, GPS redacted). Honest gaps for payment/receipt/schedule/rate/tip/dedicated driver URLs (404 HTML). Surface still excludes 99Food/99Pay.

## 0.1.1 - 2026-08-28

Skill layer ships in-package (`skill/SKILL.md`). Agents can use MCP tools **or** `call <tool> --json` on the same binary; mutation gates are identical. Default docs still do not contain a copyable mutations assignment.

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
