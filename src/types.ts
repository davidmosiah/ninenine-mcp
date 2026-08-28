export type ResponseFormat = "markdown" | "json";
export type PrivacyMode = "summary" | "structured" | "raw";
export type TokenSource = "user" | "guest";

export interface NinenineTokenSet {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: number;
  source: TokenSource;
}

export interface NinenineConfig {
  apiBase: string;
  country: string;
  origin: string;
  tokenPath: string;
  configPath: string;
  deviceIdPath: string;
  privacyMode: PrivacyMode;
  allowMutations: boolean;
  latitude?: number;
  longitude?: number;
}

export interface ToolResponse extends Record<string, unknown> {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export type FetchLike = typeof fetch;
