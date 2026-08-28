import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { promises as fs } from "node:fs";
import { APP_USER_AGENT, PATHS, REQUEST_TIMEOUT_MS, RIDE_CATEGORIES, WEB_ORIGIN } from "../constants.js";
import type { FetchLike, NinenineConfig, NinenineTokenSet } from "../types.js";
import { TokenStore } from "./token-store.js";
import { assertAllowedConsumerPath, isAllowedNinenineHost } from "./path-allowlist.js";
import { envAccessToken } from "./config.js";

export class NinenineClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "NinenineClientError";
  }
}

export interface EstimateInput {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
}

export interface RequestRideInput {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  category?: "pop" | "moto";
}

export function consumerHeaders(origin: string, deviceId: string): Record<string, string> {
  return {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
    "user-agent": APP_USER_AGENT,
    origin,
    referer: `${origin}/`,
    lang: "pt-BR",
    location_country: "BR",
    deviceid: deviceId
  };
}

export class NinenineClient {
  constructor(
    private readonly config: NinenineConfig,
    private readonly tokens: TokenStore,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async estimate(input: EstimateInput): Promise<unknown> {
    const pop = await this.requestForm(PATHS.multiEstimate, {
      ...this.pointFields(input),
      product_id: RIDE_CATEGORIES.pop.id,
      category: RIDE_CATEGORIES.pop.label
    });
    const moto = await this.requestForm(PATHS.estimate, {
      ...this.pointFields(input),
      product_id: RIDE_CATEGORIES.moto.id,
      category: RIDE_CATEGORIES.moto.label
    });
    return {
      unofficial: true,
      categories: [
        { id: RIDE_CATEGORIES.pop.id, label: RIDE_CATEGORIES.pop.label, quote: pop },
        { id: RIDE_CATEGORIES.moto.id, label: RIDE_CATEGORIES.moto.label, quote: moto }
      ]
    };
  }

  async listAddresses(): Promise<unknown> {
    // Dedicated address URLs 404 HTML on the live 99 passenger host.
    // pGetConfig is JSON 200; extract address-shaped keys when a token is present.
    const config = await this.requestForm(PATHS.config, { location_country: "BR", lang: "pt-BR" });
    return extractAddresses(config);
  }

  async rideHistory(): Promise<unknown> {
    return this.requestForm(PATHS.history, { location_country: "BR", lang: "pt-BR" }, { auth: true });
  }

  async trackRide(orderId?: string): Promise<unknown> {
    const body: Record<string, string | number> = { location_country: "BR", lang: "pt-BR" };
    if (orderId) {
      body.oid = orderId;
      body.order_id = orderId;
    }
    return this.requestForm(PATHS.track, body, { auth: true });
  }

  async requestRide(input: RequestRideInput): Promise<unknown> {
    const category = input.category === "moto" ? RIDE_CATEGORIES.moto : RIDE_CATEGORIES.pop;
    return this.requestForm(
      PATHS.request,
      {
        ...this.pointFields(input),
        product_id: category.id,
        category: category.label
      },
      { auth: true }
    );
  }

  async cancelRide(orderId: string): Promise<unknown> {
    return this.requestForm(
      PATHS.cancel,
      { oid: orderId, order_id: orderId, location_country: "BR", lang: "pt-BR" },
      { auth: true }
    );
  }

  async deviceId(): Promise<string> {
    const fromEnv = process.env.NINENINE_DEVICE_ID?.trim();
    if (fromEnv) return fromEnv;
    try {
      const existing = (await fs.readFile(this.config.deviceIdPath, "utf8")).trim();
      if (existing) return existing;
    } catch {
      // create
    }
    const id = randomUUID();
    await fs.mkdir(dirname(this.config.deviceIdPath), { recursive: true, mode: 0o700 });
    await fs.writeFile(this.config.deviceIdPath, `${id}\n`, { mode: 0o600 });
    return id;
  }

  private pointFields(input: EstimateInput): Record<string, string | number> {
    return {
      from_lat: input.from_lat,
      from_lng: input.from_lng,
      to_lat: input.to_lat,
      to_lng: input.to_lng,
      flat: input.from_lat,
      flng: input.from_lng,
      tlat: input.to_lat,
      tlng: input.to_lng,
      location_country: "BR",
      lang: "pt-BR"
    };
  }

  private async requestForm(
    path: string,
    body: Record<string, string | number>,
    options: { auth?: boolean } = {}
  ): Promise<unknown> {
    const url = consumerRequestUrl(this.config.apiBase, path);
    const deviceId = await this.deviceId();
    const headers: Record<string, string> = {
      ...consumerHeaders(this.config.origin, deviceId)
    };
    const token = await this.resolveAccess();
    if (options.auth && !token) {
      throw new NinenineClientError(
        "No 99 access token. Run `ninenine-mcp-unofficial auth --from-header \"Bearer …\"` or set NINENINE_ACCESS_TOKEN.",
        undefined,
        "AUTH_REQUIRED"
      );
    }
    if (token) {
      headers.authorization = `Bearer ${token.access_token}`;
      body.ticket = token.access_token;
      body.token = token.access_token;
    }

    const encoded = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      encoded.set(key, String(value));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers,
        body: encoded.toString(),
        signal: controller.signal
      });
      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { raw: text.slice(0, 400) };
      }
      if (!response.ok) {
        throw new NinenineClientError(
          `Unofficial 99 passenger surface returned HTTP ${response.status} for POST ${path}. The consumer API is undocumented and may change.`,
          response.status,
          "NINENINE_UPSTREAM_UNAVAILABLE"
        );
      }
      return parsed;
    } catch (error) {
      if (error instanceof NinenineClientError) throw error;
      throw new NinenineClientError(
        `99 request failed: ${(error as Error).message}`,
        undefined,
        "NINENINE_UPSTREAM_UNAVAILABLE"
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async resolveAccess(): Promise<NinenineTokenSet | null> {
    const file = await this.tokens.read();
    if (file?.access_token) return file;
    const envToken = envAccessToken();
    if (envToken) return { access_token: envToken, source: "user", token_type: "Bearer" };
    return null;
  }
}

export function consumerRequestUrl(apiBase: string, path: string): string {
  try {
    assertAllowedConsumerPath(path);
  } catch (error) {
    throw new NinenineClientError((error as Error).message, undefined, "PATH_NOT_ALLOWED");
  }
  const url = apiBase.replace(/\/$/, "") + path;
  if (!isAllowedNinenineHost(url)) {
    throw new NinenineClientError(
      `HOST_NOT_ALLOWED: refusing unofficial 99 host ${apiBase}`,
      undefined,
      "PATH_NOT_ALLOWED"
    );
  }
  return url;
}

function extractAddresses(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["common_address", "addresses", "address_list", "home_company", "user_address"]) {
    if (Array.isArray(record[key])) return record[key];
  }
  const nested = record.data;
  if (nested && typeof nested === "object") {
    return extractAddresses(nested);
  }
  return [];
}

void WEB_ORIGIN;
