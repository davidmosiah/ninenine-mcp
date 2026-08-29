import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeAccessToken } from "../dist/services/auth-token.js";

assert.equal(normalizeAccessToken("Bearer abc.def"), "abc.def");
assert.equal(normalizeAccessToken("  xyz  "), "xyz");
assert.equal(normalizeAccessToken(""), "");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "dist/index.js");
const home = mkdtempSync(join(tmpdir(), "ninenine-cli-"));

function run(args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], {
      env: { ...process.env, HOME: home, NINENINE_ACCESS_TOKEN: "", NINENINE_ALLOW_MUTATIONS: "", ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += c;
    });
    child.stderr.on("data", (c) => {
      stderr += c;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

const auth = await run(["auth", "--from-header", "Bearer ninenine-fixture-jwt"]);
assert.equal(auth.code, 0, auth.stderr);
const tokenPath = join(home, ".ninenine-mcp", "tokens.json");
const stored = JSON.parse(readFileSync(tokenPath, "utf8"));
assert.equal(stored.access_token, "ninenine-fixture-jwt");
assert.equal(statSync(tokenPath).mode & 0o777, 0o600);

const doctor = await run(["doctor", "--json"]);
assert.equal(doctor.code, 0, doctor.stderr);
const status = JSON.parse(doctor.stdout);
assert.equal(status.unofficial, true);
assert.equal(status.never_pays_by_default, true);
assert.equal(status.mutations_enabled, false);
assert.doesNotMatch(JSON.stringify(status), /NINENINE_ALLOW_MUTATIONS\s*=\s*true/);
assert.match(JSON.stringify(status.next_steps), /DevTools|auth --from-header|Reads only/i);

const empty = await run(["auth", "--from-header", "Bearer   "]);
assert.equal(empty.code, 1);

const caps = await run(["call", "ninenine_capabilities", "--json", "{}"]);
assert.equal(caps.code, 0, caps.stderr);
const cap = JSON.parse(caps.stdout);
assert.equal(cap.unofficial, true);
assert.equal(cap.never_pays_by_default, true);
assert.equal(cap.mutations_enabled, false);

const unknown = await run(["call", "ninenine_not_a_tool"]);
assert.equal(unknown.code, 1);

console.log(JSON.stringify({ ok: true, suite: "cli", from_header: true, token_0600: true, doctor: true, call: true }, null, 2));
