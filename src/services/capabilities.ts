import { PATHS, RIDE_CATEGORIES, SERVER_VERSION } from "../constants.js";
import { peekConfig } from "./config.js";

export function buildCapabilities() {
  const config = peekConfig();
  return {
    unofficial: true as const,
    version: SERVER_VERSION,
    surface: "99 passenger gulfstream APIs — not 99Food, 99Pay, 99Entrega, or corp B2B",
    api_base: config.apiBase,
    documented_paths: PATHS,
    ride_categories: RIDE_CATEGORIES,
    mutations_enabled: config.allowMutations,
    never_pays_by_default: true,
    read_tools: [
      "ninenine_estimate",
      "ninenine_multi_estimate",
      "ninenine_ride_categories",
      "ninenine_list_addresses",
      "ninenine_ride_history",
      "ninenine_track_ride",
      "ninenine_driver_track",
      "ninenine_active_ride"
    ],
    gated_pay: ["ninenine_request_ride", "ninenine_cancel_ride"],
    gated_intent_only: ["ninenine_logout"],
    not_in_surface: ["99Food", "99Pay", "99Entrega", "corp B2B"],
    honest_gaps: [
      { wanted: "payment methods", probe: "pGetPayMethods / pPaymentMethods → HTTP 404 HTML" },
      { wanted: "ride receipt", probe: "pOrderReceipt / pGetReceipt → HTTP 404 HTML" },
      { wanted: "schedule ride", probe: "pBookingOrder / pReserveOrder → HTTP 404 HTML" },
      { wanted: "rate / tip", probe: "pComment / pEvaluateOrder / pTip → HTTP 404 HTML" },
      { wanted: "dedicated driver GPS URL", probe: "pDriverLocation / pGetDriver → HTTP 404 HTML; use ninenine_driver_track" }
    ],
    recommended_agent_flow: [
      "ninenine_connection_status",
      "ninenine_estimate (99Pop + 99Moto)",
      "ninenine_ride_history / ninenine_track_ride (read, GPS redacted)",
      "Never call ninenine_request_ride unless the user explicitly asked AND NINENINE_ALLOW_MUTATIONS=true"
    ]
  };
}
