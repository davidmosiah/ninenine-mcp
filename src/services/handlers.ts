import type { PrivacyMode, ResponseFormat } from "../types.js";
import { peekConfig } from "./config.js";
import { NinenineClient, NinenineClientError } from "./ninenine-client.js";
import { TokenStore } from "./token-store.js";
import { applyPrivacy } from "./privacy.js";
import { bulletList, makeError, makeResponse } from "./format.js";
import {
  MutationGateError,
  assertCancelRideAllowed,
  assertExplicitIntent,
  assertLogoutAllowed,
  assertNotGuestForCharge,
  assertRequestRideAllowed
} from "./mutation-gate.js";
import { buildConnectionStatus } from "./connection-status.js";
import { buildCapabilities } from "./capabilities.js";
import { buildPrivacyAudit } from "./audit.js";

export interface HandlerDeps {
  client?: NinenineClient;
  tokens?: TokenStore;
  allowMutations?: boolean;
  fetchImpl?: typeof fetch;
}

function deps(extra: HandlerDeps = {}) {
  const config = peekConfig();
  const tokens = extra.tokens ?? new TokenStore(config.tokenPath);
  const client = extra.client ?? new NinenineClient(config, tokens, extra.fetchImpl);
  const allowMutations = extra.allowMutations ?? config.allowMutations;
  return { config, tokens, client, allowMutations };
}

function gateError(error: unknown) {
  if (error instanceof MutationGateError || error instanceof NinenineClientError) {
    return makeError(error.message);
  }
  return makeError((error as Error).message);
}

function wrap<T>(payload: T, format: ResponseFormat, title: string, fields: Record<string, unknown>) {
  return makeResponse(payload, format, bulletList(title, fields));
}

export async function handleConnectionStatus(input: { response_format?: ResponseFormat } = {}) {
  const status = await buildConnectionStatus();
  return wrap(status, input.response_format ?? "markdown", "99 MCP · connection", {
    ok: status.ok,
    mutations_enabled: status.mutations_enabled,
    unofficial: true,
    never_pays_by_default: true
  });
}

export async function handleCapabilities(input: { response_format?: ResponseFormat } = {}) {
  const caps = buildCapabilities();
  return wrap(caps, input.response_format ?? "markdown", "99 MCP · capabilities", {
    unofficial: caps.unofficial,
    mutations_enabled: caps.mutations_enabled,
    never_pays_by_default: true
  });
}

export async function handlePrivacyAudit(input: { response_format?: ResponseFormat } = {}) {
  const audit = buildPrivacyAudit();
  return wrap(audit, input.response_format ?? "markdown", "99 MCP · privacy", {
    privacy_mode: audit.privacy_mode,
    mutations_enabled: audit.mutations_enabled,
    redacts_by_default: (audit.redacts_by_default as string[]).join(", ")
  });
}

export async function handleEstimate(
  input: {
    from_lat: number;
    from_lng: number;
    to_lat: number;
    to_lng: number;
    privacy_mode?: PrivacyMode;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.estimate(input);
    const payload = applyPrivacy({ unofficial: true, estimate: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "99 estimate · Pop + Moto", {
      unofficial: true,
      categories: "99Pop, 99Moto"
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleListAddresses(
  input: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {},
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.listAddresses();
    const payload = applyPrivacy({ unofficial: true, addresses: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "99 addresses", {
      unofficial: true,
      redacted: true,
      note: "Dedicated address URLs 404; this reads pGetConfig."
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleRideHistory(
  input: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {},
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.rideHistory();
    const payload = applyPrivacy({ unofficial: true, rides: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "99 ride history", { unofficial: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleTrackRide(
  input: { ride_id?: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.trackRide(input.ride_id);
    const payload = applyPrivacy(
      { unofficial: true, status: raw, ride_id: input.ride_id },
      input.privacy_mode ?? config.privacyMode
    );
    return wrap(payload, input.response_format ?? "markdown", "99 ride status", {
      unofficial: true,
      gps_redacted: true
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleRequestRide(
  input: {
    from_lat: number;
    from_lng: number;
    to_lat: number;
    to_lng: number;
    category?: "pop" | "moto";
    explicit_user_intent?: boolean;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { tokens, client, allowMutations } = deps(extra);
  try {
    assertRequestRideAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const stored = await tokens.read();
    assertNotGuestForCharge(stored?.source);
    const raw = await client.requestRide(input);
    return wrap({ unofficial: true, ride: raw }, input.response_format ?? "json", "99 request ride", {
      unofficial: true
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleCancelRide(
  input: { ride_id: string; explicit_user_intent?: boolean; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { tokens, client, allowMutations } = deps(extra);
  try {
    assertCancelRideAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const stored = await tokens.read();
    assertNotGuestForCharge(stored?.source);
    const raw = await client.cancelRide(input.ride_id);
    return wrap({ unofficial: true, cancel: raw }, input.response_format ?? "json", "99 cancel ride", {
      ride_id: input.ride_id
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleLogout(
  input: { explicit_user_intent?: boolean; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { tokens } = deps(extra);
  try {
    assertLogoutAllowed(input.explicit_user_intent);
    assertExplicitIntent(input.explicit_user_intent, "clear the local 99 token");
    await tokens.clear();
    return wrap({ unofficial: true, cleared: true }, input.response_format ?? "json", "99 logout", {
      unofficial: true
    });
  } catch (error) {
    return gateError(error);
  }
}
