import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

// Run the compiled HTTP entrypoint with in-memory req/res and fake SDK. No
// socket, CLI credential store, consumer API, or MCP tool is opened or called.
let callback;
let servers = 0;
let transports = 0;
const dispatched = [];
const context = createContext({
  Buffer,
  process: { argv: ["node", "synthetic-entrypoint", "--http"], env: {} },
  console: { error() {} }
});

function synthetic(exports) {
  return new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context });
}

class FakeServer {
  constructor() { servers += 1; }
  async connect() {}
  async close() {}
}
class FakeHttpTransport {
  constructor() { transports += 1; }
  async close() {}
  async handleRequest(req, res, body) {
    dispatched.push(body);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", result: {}, id: body.id ?? null }));
  }
}

const modules = {
  "node:http": synthetic({ createServer: (handler) => {
    callback = handler;
    return { listen(port, host, ready) {
      assert.equal(host, "127.0.0.1");
      ready();
    } };
  } }),
  "@modelcontextprotocol/sdk/server/mcp.js": synthetic({ McpServer: FakeServer }),
  "@modelcontextprotocol/sdk/server/stdio.js": synthetic({ StdioServerTransport: class {} }),
  "@modelcontextprotocol/sdk/server/streamableHttp.js": synthetic({ StreamableHTTPServerTransport: FakeHttpTransport }),
  "./cli/commands.js": synthetic({ runCliCommand: async () => undefined }),
  "./tools/ninenine-tools.js": synthetic({ registerNinenineTools() {} })
};
for (const path of ["./constants.js", "./services/http-origin.js"]) {
  modules[path] = new SourceTextModule(readFileSync(new URL(`../dist/${path.slice(2)}`, import.meta.url), "utf8"), { context });
}
const entrypoint = new SourceTextModule(readFileSync(new URL("../dist/index.js", import.meta.url), "utf8"), { context });
await entrypoint.link((specifier) => {
  assert.ok(modules[specifier], `Unexpected entrypoint dependency: ${specifier}`);
  return modules[specifier];
});
await entrypoint.evaluate();
assert.equal(typeof callback, "function");

async function request(body, { streamError = false } = {}) {
  const req = {
    method: "POST", url: "/mcp", headers: {},
    async *[Symbol.asyncIterator]() {
      if (streamError) throw new Error("synthetic aborted stream");
      yield Buffer.from(body);
    }
  };
  const res = {
    headersSent: false,
    writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true; },
    end(body) { this.body = body; },
    on() {}
  };
  await assert.doesNotReject(() => callback(req, res));
  return res;
}

for (const body of ["{", "not-json"]) {
  const res = await request(body);
  assert.equal(res.status, 400);
  assert.deepEqual(JSON.parse(res.body), { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null });
  assert.equal(servers, 0, "invalid JSON must not allocate an MCP server");
  assert.equal(transports, 0, "invalid JSON must not allocate an MCP transport");
  assert.equal(dispatched.length, 0);
}

const aborted = await request("", { streamError: true });
assert.equal(aborted.status, 400);
assert.equal(dispatched.length, 0);

const valid = { jsonrpc: "2.0", id: 7, method: "tools/list" };
const res = await request(JSON.stringify(valid));
assert.equal(res.status, 200, "a request following malformed JSON must still work");
assert.deepEqual(JSON.parse(JSON.stringify(dispatched)), [valid]);
assert.equal(servers, 1);
assert.equal(transports, 1);

const empty = await request("");
assert.equal(empty.status, 200, "preserve existing empty-body fallback");
assert.deepEqual(JSON.parse(JSON.stringify(dispatched[1])), {});
console.log("HTTP JSON: malformed/aborted bodies contained; valid and following requests preserved (no sockets)");
