import assert from "node:assert/strict";
import {
  MutationGateError,
  assertCancelRideAllowed,
  assertChargeWriteAllowed,
  assertLogoutAllowed,
  assertNotGuestForCharge,
  assertRequestRideAllowed
} from "../dist/services/mutation-gate.js";

function throws(fn, re) {
  try {
    fn();
    assert.fail("expected MutationGateError");
  } catch (error) {
    assert.equal(error instanceof MutationGateError, true);
    assert.match(error.message, re);
  }
}

throws(() => assertRequestRideAllowed({ allowMutations: false, explicitUserIntent: true }), /NINENINE_ALLOW_MUTATIONS/);
throws(() => assertRequestRideAllowed({ allowMutations: true, explicitUserIntent: false }), /explicit_user_intent/);
throws(() => assertRequestRideAllowed({ allowMutations: true }), /explicit_user_intent/);
assertRequestRideAllowed({ allowMutations: true, explicitUserIntent: true });

throws(() => assertCancelRideAllowed({ allowMutations: false, explicitUserIntent: true }), /NINENINE_ALLOW_MUTATIONS/);
throws(() => assertChargeWriteAllowed({ allowMutations: true, explicitUserIntent: false }), /explicit_user_intent/);
throws(() => assertLogoutAllowed(false), /explicit_user_intent/);
assertLogoutAllowed(true);
throws(() => assertNotGuestForCharge("guest"), /guest token cannot request/i);

console.log(JSON.stringify({ ok: true, suite: "mutation-gate" }, null, 2));
