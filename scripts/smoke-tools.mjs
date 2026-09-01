import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const expected = [
  "ninenine_active_ride",
  "ninenine_cancel_ride",
  "ninenine_capabilities",
  "ninenine_connection_status",
  "ninenine_driver_track",
  "ninenine_estimate",
  "ninenine_list_addresses",
  "ninenine_logout",
  "ninenine_multi_estimate",
  "ninenine_privacy_audit",
  "ninenine_request_ride",
  "ninenine_ride_categories",
  "ninenine_ride_history",
  "ninenine_track_ride"
];

const homeDir = mkdtempSync(join(tmpdir(), "ninenine-mcp-smoke-"));
const env = { ...process.env, HOME: homeDir };
delete env.NINENINE_ACCESS_TOKEN;
delete env.NINENINE_ALLOW_MUTATIONS;
delete env.NINENINE_TOKEN_PATH;

const client = new Client({ name: "ninenine-mcp-smoke", version: "0.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env
});
await client.connect(transport);
try {
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  assert.deepEqual(names, expected.sort());

  const place = await client.callTool({
    name: "ninenine_request_ride",
    arguments: {
      from_lat: -3.73,
      from_lng: -38.52,
      to_lat: -3.77,
      to_lng: -38.53,
      response_format: "json"
    }
  });
  const text = JSON.stringify(place.structuredContent ?? {}) + (place.content?.map((c) => c.text || "").join("") || "");
  assert.match(text, /USER_ACTION_REQUIRED|NINENINE_ALLOW_MUTATIONS|explicit_user_intent/i);
  assert.equal(place.isError, true);

  const status = await client.callTool({
    name: "ninenine_connection_status",
    arguments: { response_format: "json" }
  });
  assert.equal(status.structuredContent?.unofficial, true);
  assert.equal(status.structuredContent?.mutations_enabled, false);
  assert.equal(status.structuredContent?.never_pays_by_default, true);

  console.log(JSON.stringify({ ok: true, tools: names.length, gated_request_ride: true }, null, 2));
} finally {
  await client.close();
}
