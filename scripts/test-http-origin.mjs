import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  defaultAllowedOrigin,
  defaultMcpBindHost,
  isAllowedMcpOrigin,
  isLoopbackHost
} from "../dist/services/http-origin.js";

assert.equal(defaultMcpBindHost({}), "127.0.0.1");
assert.equal(isLoopbackHost("127.0.0.1"), true);
assert.equal(isLoopbackHost("0.0.0.0"), false);
assert.equal(defaultAllowedOrigin("127.0.0.1", 3000, {}), "http://127.0.0.1:3000");
assert.equal(isAllowedMcpOrigin(undefined, "http://127.0.0.1:3000"), true);
assert.equal(isAllowedMcpOrigin("http://127.0.0.1:3000", "http://127.0.0.1:3000"), true);
assert.equal(isAllowedMcpOrigin("https://evil.example", "http://127.0.0.1:3000"), false);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "dist/index.js");

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitHealth(url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  throw new Error(`HTTP server did not become ready at ${url}`);
}

const port = await freePort();
const env = { ...process.env, NINENINE_MCP_HOST: "127.0.0.1", NINENINE_MCP_PORT: String(port) };
delete env.NINENINE_ALLOW_MUTATIONS;
delete env.NINENINE_ACCESS_TOKEN;
const child = spawn(process.execPath, [bin, "--http"], {
  env,
  stdio: ["ignore", "ignore", "pipe"]
});
child.stderr.on("data", () => undefined);

try {
  const health = `http://127.0.0.1:${port}/health`;
  const ready = await waitHealth(health);
  const body = await ready.json();
  assert.equal(body.ok, true);
  assert.equal(body.bind, "127.0.0.1");

  const denied = await fetch(health, { headers: { Origin: "https://evil.example" } });
  assert.equal(denied.status, 403);
  const deniedBody = await denied.json();
  assert.equal(deniedBody.error, "origin_not_allowed");

  const allowed = await fetch(health, { headers: { Origin: `http://127.0.0.1:${port}` } });
  assert.equal(allowed.status, 200);
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
}

console.log(JSON.stringify({ ok: true, suite: "http-origin", live_http: true, port }, null, 2));
