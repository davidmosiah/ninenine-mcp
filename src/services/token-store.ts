import { randomUUID } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import { dirname } from "node:path";
import type { NinenineTokenSet } from "../types.js";

const LOCK_RETRY_MS = 250;
const LOCK_TIMEOUT_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TokenStore {
  constructor(private readonly tokenPath: string) {}

  private get lockPath(): string {
    return `${this.tokenPath}.lock`;
  }

  async read(): Promise<NinenineTokenSet | null> {
    try {
      const text = await fs.readFile(this.tokenPath, "utf8");
      return JSON.parse(text) as NinenineTokenSet;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      if (error instanceof SyntaxError) throw new Error("Stored token file contains invalid JSON");
      throw new Error("Unable to read stored token file");
    }
  }

  async write(tokens: NinenineTokenSet): Promise<void> {
    await fs.mkdir(dirname(this.tokenPath), { recursive: true, mode: 0o700 });
    const tmp = `${this.tokenPath}.tmp-${process.pid}-${randomUUID()}`;
    // Exclusive unique files keep simultaneous writers isolated and never follow
    // a pre-existing temporary-file symlink. Rename publishes a complete 0600 file.
    const handle = await fs.open(tmp, "wx", 0o600);
    try {
      await handle.writeFile(JSON.stringify(tokens, null, 2));
      await handle.close();
      await fs.rename(tmp, this.tokenPath);
    } finally {
      await handle.close().catch(() => undefined);
      await fs.unlink(tmp).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }

  async clear(): Promise<void> {
    await fs.unlink(this.tokenPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await fs.mkdir(dirname(this.lockPath), { recursive: true, mode: 0o700 });
    const start = Date.now();
    let handle: fs.FileHandle | null = null;

    while (!handle) {
      try {
        handle = await fs.open(this.lockPath, constants.O_CREAT | constants.O_EXCL | constants.O_RDWR, 0o600);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        if (Date.now() - start > LOCK_TIMEOUT_MS) {
          throw new Error(`Timed out waiting for token lock: ${this.lockPath}`);
        }
        await sleep(LOCK_RETRY_MS);
      }
    }

    try {
      await handle.writeFile(`${process.pid}\n${new Date().toISOString()}\n`);
      return await fn();
    } finally {
      await handle.close().catch(() => undefined);
      await fs.unlink(this.lockPath).catch(() => undefined);
    }
  }
}
