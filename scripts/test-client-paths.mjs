import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PATHS, RIDE_CATEGORIES } from "../dist/constants.js";
import { peekConfig } from "../dist/services/config.js";
import { NinenineClient } from "../dist/services/ninenine-client.js";
import { TokenStore } from "../dist/services/token-store.js";

const home = mkdtempSync(join(tmpdir(), "ninenine-client-paths-"));
const tokenPath = join(home, ".ninenine-mcp", "tokens.json");
mkdirSync(join(home, ".ninenine-mcp"), { recursive: true, mode: 0o700 });
writeFileSync(tokenPath, JSON.stringify({ access_token: "fixture-token", source: "user" }), { mode: 0o600 });
process.env.HOME = home;
process.env.NINENINE_TOKEN_PATH = tokenPath;
process.env.NINENINE_DEVICE_ID = "11111111-1111-1111-1111-111111111111";
delete process.env.NINENINE_ACCESS_TOKEN;
delete process.env.NINENINE_ALLOW_MUTATIONS;

const captured = [];

function headerMap(headers) {
  if (!headers) return {};
  if (typeof headers.forEach === "function") {
    const out = {};
    headers.forEach((value, key) => {
      out[String(key).toLowerCase()] = String(value);
    });
    return out;
  }
  return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
}

const fetchImpl = async (url, init = {}) => {
  captured.push({
    url: String(url),
    method: String(init.method || "GET").toUpperCase(),
    headers: headerMap(init.headers),
    body: String(init.body || "")
  });
  return new Response(JSON.stringify({ errno: 1010, errmsg: "fixture" }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const config = peekConfig(process.env, home);
const tokens = new TokenStore(tokenPath);
const client = new NinenineClient(config, tokens, fetchImpl);
const coords = { from_lat: -3.7, from_lng: -38.5, to_lat: -3.77, to_lng: -38.53 };

await client.estimate(coords);
await client.listAddresses();
await client.rideHistory();
await client.trackRide("ride-1");
await client.requestRide({ ...coords, category: "pop" });
await client.cancelRide("ride-1");

function hit(suffix) {
  return captured.find((row) => row.url === `${config.apiBase}${suffix}` && row.method === "POST");
}

assert.ok(hit(PATHS.multiEstimate), `Pop estimate must POST ${PATHS.multiEstimate}`);
assert.ok(hit(PATHS.estimate), `Moto estimate must POST ${PATHS.estimate}`);
assert.ok(hit(PATHS.config), `addresses must POST ${PATHS.config}`);
assert.ok(hit(PATHS.history), `history must POST ${PATHS.history}`);
assert.ok(hit(PATHS.track), `track must POST ${PATHS.track}`);
assert.ok(hit(PATHS.request), `request must POST ${PATHS.request}`);
assert.ok(hit(PATHS.cancel), `cancel must POST ${PATHS.cancel}`);

const popBody = captured.find((row) => row.url.endsWith(PATHS.multiEstimate))?.body || "";
assert.match(popBody, new RegExp(RIDE_CATEGORIES.pop.id));
const motoBody = captured.find((row) => row.url.endsWith(PATHS.estimate))?.body || "";
assert.match(motoBody, new RegExp(RIDE_CATEGORIES.moto.id));

for (const row of captured) {
  assert.match(row.headers.deviceid || "", /11111111/);
  assert.equal(row.headers.origin, "https://99app.com");
  assert.equal(row.method, "POST");
  assert.doesNotMatch(row.url, /\/v2\/rides/);
  assert.doesNotMatch(row.url, /api-corp/);
  assert.doesNotMatch(row.url, /99food/i);
  assert.doesNotMatch(row.url, /99pay/i);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      suite: "client-paths",
      estimate: PATHS.estimate,
      history: PATHS.history,
      track: PATHS.track,
      captured: captured.map((row) => `${row.method} ${row.url.replace(config.apiBase, "")}`)
    },
    null,
    2
  )
);
