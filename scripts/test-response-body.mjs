import assert from "node:assert/strict";
import { readResponseText } from "../dist/services/response-body.js";
const signal = new AbortController().signal;
const text = 'á😀';
assert.equal(await readResponseText(new Response(text), signal, 6), text);
await assert.rejects(() => readResponseText(new Response(text), signal, 5), /allowed size/);
let cancelled = 0;
function streamed(headers = {}) {
  return new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(4)); controller.enqueue(new Uint8Array(4)); },
    cancel() { cancelled++; }
  }), { headers });
}
for (const headers of [{}, { 'content-length': '1' }, { 'content-length': '999' }]) {
  await assert.rejects(() => readResponseText(streamed(headers), signal, 6), /allowed size/);
}
assert.equal(cancelled, 3);
const controller = new AbortController();
const hanging = readResponseText(new Response(new ReadableStream({ cancel() { cancelled++; } })), controller.signal, 6);
controller.abort();
await assert.rejects(() => hanging, /timed out/);
assert.equal(cancelled, 4);
const already = new AbortController(); already.abort();
await assert.rejects(() => readResponseText(new Response('safe'), already.signal), /timed out/);
assert.equal(await readResponseText(new Response(null), signal), '');
console.log('Bounded upstream UTF8, streamed and false-length overflow, cancellation and abort passed');

await assert.rejects(() => readResponseText(new Response(new ReadableStream({ start(controller) { controller.error(new Error('synthetic-private-stream-secret')); } })), signal), error => {
  assert.equal(error.message, 'Upstream response could not be read');
  assert.doesNotMatch(error.message, /synthetic-private/);
  return true;
});
