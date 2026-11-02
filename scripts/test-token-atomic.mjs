import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TokenStore } from "../dist/services/token-store.js";

const dir = await fs.mkdtemp(join(tmpdir(), "token-atomic-"));
try {
  const path = join(dir, "tokens.json");
  const store = new TokenStore(path);
  const values = Array.from({ length: 32 }, (_, i) => ({ access_token: `fixture-${i}`, source: "user", padding: "x".repeat(i * 100) }));
  await Promise.all(values.map(value => store.write(value)));
  const result = await store.read();
  assert.ok(values.some(value => JSON.stringify(value) === JSON.stringify(result)));
  assert.equal((await fs.stat(path)).mode & 0o777, 0o600);
  assert.deepEqual(await fs.readdir(dir), ["tokens.json"]);
  // A legacy predictable temporary symlink must never be followed or overwritten.
  const target = join(dir, "sentinel");
  await fs.writeFile(target, "unchanged");
  const legacy = `${path}.tmp-${process.pid}`;
  await fs.symlink(target, legacy);
  await store.write(values[0]);
  assert.equal(await fs.readFile(target, "utf8"), "unchanged");
  assert.equal((await fs.lstat(legacy)).isSymbolicLink(), true);
  await fs.writeFile(path, "synthetic-sensitive-token-not-json");
  await assert.rejects(() => store.read(), error => {
    assert.equal(error.message, "Stored token file contains invalid JSON");
    assert.doesNotMatch(error.message, /synthetic-sensitive|synthetic-/);
    return true;
  });
  assert.equal(await fs.readFile(path, "utf8"), "synthetic-sensitive-token-not-json");
  // A failed rename must clean up its own temporary file.
  const blocked = join(dir, "directory");
  await fs.mkdir(blocked);
  await assert.rejects(() => new TokenStore(blocked).write(values[0]));
  assert.equal((await fs.readdir(dir)).some(name => name.startsWith("directory.tmp-")), false);
} finally {
  await fs.rm(dir, { recursive: true, force: true });
}
console.log("TokenStore concurrent writes, 0600, symlink isolation and failure cleanup passed");
