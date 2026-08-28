const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1"]);

export function defaultMcpBindHost(env: Record<string, string | undefined> = process.env): string {
  return env.NINENINE_MCP_HOST?.trim() || "127.0.0.1";
}

export function defaultAllowedOrigin(host: string, port: number, env: Record<string, string | undefined> = process.env): string {
  return env.NINENINE_MCP_ALLOWED_ORIGIN?.trim() || `http://${host}:${port}`;
}

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK.has(host);
}

/** DNS-rebinding mitigation for optional Streamable HTTP. Missing Origin is allowed (local stdio-like clients). */
export function isAllowedMcpOrigin(origin: string | undefined, allowedOrigin: string): boolean {
  if (!origin) return true;
  return origin === allowedOrigin;
}
