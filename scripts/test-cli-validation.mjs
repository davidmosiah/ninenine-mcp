import assert from "node:assert/strict";
import { TOOL_CALLS } from "../dist/tools/ninenine-tools.js";
// Unexpected inputs must stop before a provider handler can observe them.
for (const value of [null, [], 1, "text", { response_format: "bad-fixture-secret" }]) {
  await assert.rejects(() => TOOL_CALLS.ninenine_capabilities(value), error => {
    assert.match(error.message, /INVALID_INPUT/);
    assert.doesNotMatch(error.message, /bad-fixture-secret/);
    return true;
  });
}
await assert.rejects(() => TOOL_CALLS.ninenine_capabilities({ excess: Array(10_001).fill(0) }), /10000 elements/);
const valid = await TOOL_CALLS.ninenine_capabilities({ response_format: "json" });
assert.notEqual(valid.isError, true);
console.log('CLI dispatch schema, budget, safe errors and valid recovery passed');

const { runCliCommand } = await import('../dist/cli/commands.js');
await assert.rejects(() => runCliCommand(['call', 'ninenine_capabilities', '--json', ' '.repeat(1024 * 1024 + 1)]), /exceed 1 MiB/);
