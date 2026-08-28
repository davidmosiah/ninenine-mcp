import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { applyPrivacy } from "../dist/services/privacy.js";
import { REDACTED, redactIdentity } from "../dist/services/redaction.js";

const root = dirname(fileURLToPath(new URL(".", import.meta.url)));
const fixture = JSON.parse(readFileSync(join(root, "fixtures/ride-profile.json"), "utf8"));

const structured = applyPrivacy(fixture, "structured");
assert.equal(structured.profile.email, REDACTED);
assert.equal(structured.profile.phone, REDACTED);
assert.equal(structured.profile.street, REDACTED);
assert.equal(structured.profile.address, REDACTED);
assert.equal(structured.ride.lat, REDACTED);
assert.equal(structured.ride.lng, REDACTED);
assert.equal(structured.ride.polyline, REDACTED);
assert.equal(structured.ride.driver_phone, REDACTED);
assert.equal(structured.ride.status, "arriving");
assert.equal(structured.ride.category, "99Pop");
assert.equal(structured.ride.eta, 4);

const identity = redactIdentity(fixture);
assert.equal(identity.payment.card_number, REDACTED);

const summary = applyPrivacy(fixture, "summary");
assert.equal(summary.ride.status, "arriving");
assert.equal(summary.ride.category, "99Pop");
assert.equal(Object.prototype.hasOwnProperty.call(summary.ride, "polyline"), false);

console.log(JSON.stringify({ ok: true, suite: "redaction" }, null, 2));
