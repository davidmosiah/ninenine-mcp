export class ResponseBodyError extends Error {}

/** Bound decoded upstream bytes even when Content-Length is missing or false. */
export async function readResponseText(response: Response, signal: AbortSignal, maxBytes = 4 * 1024 * 1024): Promise<string> {
  const fail = () => new ResponseBodyError("Upstream response exceeds the allowed size");
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    void response.body?.cancel().catch(() => undefined);
    throw fail();
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let rejectAbort: (error: Error) => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  const onAbort = () => rejectAbort(new ResponseBodyError("Upstream response timed out"));
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    if (signal.aborted) throw new ResponseBodyError("Upstream response timed out");
    while (true) {
      const { done, value } = await Promise.race([reader.read(), aborted]);
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw fail();
      chunks.push(value);
    }
    return Buffer.concat(chunks, total).toString("utf8");
  } catch (error) {
    if (error instanceof ResponseBodyError) throw error;
    throw new ResponseBodyError("Upstream response could not be read");
  } finally {
    signal.removeEventListener("abort", onAbort);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
