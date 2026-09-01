export const SERVER_NAME = "ninenine-mcp-server";
export const SERVER_VERSION = "0.1.2";
export const NPM_PACKAGE_NAME = "ninenine-mcp-unofficial";
export const PINNED_NPM_PACKAGE = `${NPM_PACKAGE_NAME}@${SERVER_VERSION}`;

/**
 * Default Brazil 99 passenger surface.
 * Live-probed 2026-08-28: JSON 200 (errno body) on gulfstream passenger paths, not 403 HTML.
 * Override with NINENINE_API_BASE.
 */
export const DEFAULT_API_BASE = "https://api.99taxis.mobi";

export const PASSENGER_HOSTS: Record<string, string> = {
  BR: "https://api.99taxis.mobi",
  DIDI: "https://api.didiglobal.com",
  UDACHE: "https://api.udache.com"
};

/**
 * Unofficial 99/DiDi passenger paths verified as JSON 200 (errno 1010/1026/0)
 * against api.99taxis.mobi / api.didiglobal.com / api.udache.com.
 * Dedicated address URLs returned 404 HTML and are not shipped.
 * Saved addresses are read from pGetConfig when the payload includes them.
 */
export const PATHS = {
  config: "/gulfstream/passenger/v2/other/pGetConfig",
  estimate: "/gulfstream/passenger/v2/core/pEstimatePrice",
  multiEstimate: "/gulfstream/passenger/v2/core/pMultiEstimatePrice",
  history: "/gulfstream/passenger/v2/other/pHistoryOrder",
  track: "/gulfstream/passenger/v2/core/pOrderStatus",
  request: "/gulfstream/passenger/v2/core/pNewOrder",
  cancel: "/gulfstream/passenger/v2/core/pCancelOrder"
} as const;

export const RIDE_CATEGORIES = {
  pop: { id: "pop99", label: "99Pop" },
  moto: { id: "moto99", label: "99Moto" }
} as const;

export const WEB_ORIGIN = "https://99app.com";
export const WEB_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
export const APP_USER_AGENT = "99Passageiro/6.63.0 (Linux; Android 13)";

export const REQUEST_TIMEOUT_MS = 20_000;
export const TOKEN_DIR_NAME = ".ninenine-mcp";
