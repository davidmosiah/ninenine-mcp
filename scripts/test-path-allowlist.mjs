import assert from "node:assert/strict";
import { PATHS } from "../dist/constants.js";
import { isAllowedConsumerPath, isAllowedNinenineHost } from "../dist/services/path-allowlist.js";
import { consumerRequestUrl, NinenineClientError } from "../dist/services/ninenine-client.js";

assert.equal(isAllowedConsumerPath(PATHS.estimate), true);
assert.equal(isAllowedConsumerPath(PATHS.multiEstimate), true);
assert.equal(isAllowedConsumerPath(PATHS.history), true);
assert.equal(isAllowedConsumerPath(PATHS.track), true);
assert.equal(isAllowedConsumerPath(PATHS.request), true);
assert.equal(isAllowedConsumerPath(PATHS.cancel), true);
assert.equal(isAllowedNinenineHost("https://api.99taxis.mobi/gulfstream/passenger/v2/core/pEstimatePrice"), true);
assert.equal(isAllowedNinenineHost("https://evil.example/gulfstream/passenger/v2/core/pEstimatePrice"), false);
assert.equal(isAllowedConsumerPath("/v2/rides"), false);
assert.equal(isAllowedConsumerPath("https://evil.example/x"), false);
assert.equal(isAllowedConsumerPath("/gulfstream/passenger/v2/core/pEstimatePrice/../evil"), false);

const base = "https://api.99taxis.mobi";
assert.equal(consumerRequestUrl(base, PATHS.estimate), `${base}${PATHS.estimate}`);
assert.throws(
  () => consumerRequestUrl(base, "https://evil.example/steal"),
  (err) => err instanceof NinenineClientError && err.code === "PATH_NOT_ALLOWED"
);
assert.throws(
  () => consumerRequestUrl(base, "/v2/rides"),
  (err) => err instanceof NinenineClientError && err.code === "PATH_NOT_ALLOWED"
);
assert.throws(
  () => consumerRequestUrl("https://evil.example", PATHS.estimate),
  (err) => err instanceof NinenineClientError && err.code === "PATH_NOT_ALLOWED"
);

console.log(JSON.stringify({ ok: true, suite: "path-allowlist" }, null, 2));
