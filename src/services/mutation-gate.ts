export const USER_ACTION_REQUIRED = "USER_ACTION_REQUIRED";

export class MutationGateError extends Error {
  readonly code = USER_ACTION_REQUIRED;

  constructor(message: string) {
    super(message);
    this.name = "MutationGateError";
  }
}

export interface GateInput {
  allowMutations: boolean;
  explicitUserIntent?: boolean;
}

function intentOn(value: boolean | undefined): boolean {
  return value === true;
}

export function assertExplicitIntent(explicitUserIntent: boolean | undefined, action: string): void {
  if (!intentOn(explicitUserIntent)) {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: explicit_user_intent must be true to ${action}. Confirm with the user first.`
    );
  }
}

export function assertMutationsEnabled(allowMutations: boolean, action: string): void {
  if (!allowMutations) {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: NINENINE_ALLOW_MUTATIONS=true is required to ${action}. Default is read-only and never pays.`
    );
  }
}

export function assertRequestRideAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "request a 99 ride or charge money");
  assertExplicitIntent(input.explicitUserIntent, "request a 99 ride or charge money");
}

export function assertCancelRideAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "cancel a 99 ride");
  assertExplicitIntent(input.explicitUserIntent, "cancel a 99 ride");
}

export function assertChargeWriteAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "change 99 payment or charge money");
  assertExplicitIntent(input.explicitUserIntent, "change 99 payment or charge money");
}

export function assertLogoutAllowed(explicitUserIntent: boolean | undefined): void {
  assertExplicitIntent(explicitUserIntent, "clear the local 99 token");
}

export function assertNotGuestForCharge(source: string | undefined): void {
  if (source === "guest") {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: a guest token cannot request, cancel, or charge a 99 ride. Auth with a personal 99 access token first.`
    );
  }
}
