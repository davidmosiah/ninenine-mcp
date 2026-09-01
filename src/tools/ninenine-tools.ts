import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ActiveRideInputSchema,
  CancelRideInputSchema,
  EstimateInputSchema,
  LogoutInputSchema,
  ReadInputSchema,
  RequestRideInputSchema,
  ResponseOnlyInputSchema,
  RideIdInputSchema
} from "../schemas/common.js";
import {
  handleCancelRide,
  handleCapabilities,
  handleConnectionStatus,
  handleDriverTrack,
  handleEstimate,
  handleListAddresses,
  handleLogout,
  handleMultiEstimate,
  handlePrivacyAudit,
  handleRequestRide,
  handleRideCategories,
  handleRideHistory,
  handleTrackRide
} from "../services/handlers.js";
import type { ToolResponse } from "../types.js";

type CallFn = (args: Record<string, unknown>) => Promise<ToolResponse>;
const call =
  <T,>(fn: (input: T) => Promise<ToolResponse>): CallFn =>
  (args) =>
    fn(args as T);

/** Same handlers as MCP tools — CLI `call` uses this so skill-only clients hit the identical gates. */
export const TOOL_CALLS: Record<string, CallFn> = {
  ninenine_connection_status: call(handleConnectionStatus),
  ninenine_capabilities: call(handleCapabilities),
  ninenine_privacy_audit: call(handlePrivacyAudit),
  ninenine_estimate: call(handleEstimate),
  ninenine_multi_estimate: call(handleMultiEstimate),
  ninenine_ride_categories: call(handleRideCategories),
  ninenine_list_addresses: call(handleListAddresses),
  ninenine_ride_history: call(handleRideHistory),
  ninenine_track_ride: call(handleTrackRide),
  ninenine_driver_track: call(handleDriverTrack),
  ninenine_active_ride: call(handleTrackRide),
  ninenine_request_ride: call(handleRequestRide),
  ninenine_cancel_ride: call(handleCancelRide),
  ninenine_logout: call(handleLogout)
};

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const gatedWrite = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true } as const;

export function registerNinenineTools(server: McpServer): void {
  server.registerTool(
    "ninenine_connection_status",
    {
      title: "99 connection status",
      description: "Local doctor: token present, mutations off by default, unofficial passenger surface.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handleConnectionStatus(args)
  );

  server.registerTool(
    "ninenine_capabilities",
    {
      title: "99 capabilities",
      description: "What this unofficial MCP can read and which writes stay gated. Not 99Food or 99Pay.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handleCapabilities(args)
  );

  server.registerTool(
    "ninenine_privacy_audit",
    {
      title: "99 privacy audit",
      description: "Shows redaction defaults (street/phone/GPS) and that request-ride is off unless both gates are set.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handlePrivacyAudit(args)
  );

  server.registerTool(
    "ninenine_multi_estimate",
    {
      title: "99 multi-estimate (pMultiEstimatePrice)",
      description: "Read-only POST pMultiEstimatePrice (JSON 200 errno without token). Does not request a car.",
      inputSchema: EstimateInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleMultiEstimate(args)
  );

  server.registerTool(
    "ninenine_ride_categories",
    {
      title: "99 ride categories",
      description: "Shipped 99Pop + 99Moto plus any extra product list in pGetConfig. Not 99Food/99Pay.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleRideCategories(args)
  );

  server.registerTool(
    "ninenine_estimate",
    {
      title: "Estimate 99Pop and 99Moto fares",
      description:
        "Read-only fare quotes for origin/destination on the unofficial 99 passenger surface. Always includes 99Pop and 99Moto. Does not request a car.",
      inputSchema: EstimateInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleEstimate(args)
  );

  server.registerTool(
    "ninenine_list_addresses",
    {
      title: "List saved 99 addresses",
      description:
        "Read saved/home addresses from pGetConfig when present. Dedicated address URLs 404 and are not shipped. GPS/street redacted by default.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleListAddresses(args)
  );

  server.registerTool(
    "ninenine_ride_history",
    {
      title: "99 ride history",
      description: "Past passenger rides. Read-only. GPS polylines redacted.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleRideHistory(args)
  );

  server.registerTool(
    "ninenine_track_ride",
    {
      title: "Track a 99 ride",
      description: "Active ride status/ETA/category only. Does not return GPS polylines or driver phone.",
      inputSchema: RideIdInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleTrackRide(args)
  );

  server.registerTool(
    "ninenine_driver_track",
    {
      title: "99 driver track (GPS redacted)",
      description: "Dedicated driver URLs 404 HTML. Reads pOrderStatus; lat/lng redacted.",
      inputSchema: ActiveRideInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleDriverTrack(args)
  );

  server.registerTool(
    "ninenine_active_ride",
    {
      title: "Active 99 ride status",
      description: "Same as track without requiring a ride id. Status/ETA/category only.",
      inputSchema: ActiveRideInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleTrackRide(args)
  );

  server.registerTool(
    "ninenine_request_ride",
    {
      title: "Request a 99 ride (gated)",
      description:
        "Fail-closed. Needs NINENINE_ALLOW_MUTATIONS and explicit_user_intent. Guest tokens cannot charge. Default examples never enable this.",
      inputSchema: RequestRideInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleRequestRide(args)
  );

  server.registerTool(
    "ninenine_cancel_ride",
    {
      title: "Cancel a 99 ride (gated)",
      description: "Fail-closed. Needs NINENINE_ALLOW_MUTATIONS and explicit_user_intent. Guest tokens cannot charge.",
      inputSchema: CancelRideInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleCancelRide(args)
  );

  server.registerTool(
    "ninenine_logout",
    {
      title: "Clear local 99 token",
      description: "Deletes ~/.ninenine-mcp/tokens.json. Requires explicit_user_intent.",
      inputSchema: LogoutInputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
    },
    async (args) => handleLogout(args)
  );
}
