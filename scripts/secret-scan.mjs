import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(new URL(".", import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const files = pkg.files;
for (const banned of ["fixtures", ".ninenine-mcp", ".env", "tokens.json", "src"]) {
  assert.equal(files.includes(banned), false, `package files must not include ${banned}`);
}
assert.ok(files.includes("dist"));
assert.ok(files.includes("README.md"));
assert.equal(existsSync(join(root, "src/services/handlers.ts")), true);
const handlers = readFileSync(join(root, "src/services/handlers.ts"), "utf8");
assert.match(handlers, /assertRequestRideAllowed/);
assert.doesNotMatch(handlers, /NINENINE_ACCESS_TOKEN\s*=\s*['"]npm_/);

for (const rel of ["examples/claude-desktop.json", "examples/grok-bot.md", "README.md", "llms.txt", "SECURITY.md", "AGENTS.md"]) {
  const text = readFileSync(join(root, rel), "utf8");
  assert.doesNotMatch(text, /NINENINE_ALLOW_MUTATIONS\s*=\s*true/);
}

console.log(JSON.stringify({ ok: true, suite: "secret-scan", files }, null, 2));
