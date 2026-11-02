/** Cap raw CLI arguments before schema parsing, matching the MCP element budget. */
export function assertToolInputBudget(value: unknown): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_INPUT: arguments must be a JSON object");
  }
  const stack: unknown[] = [value];
  let count = 0;
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    for (const key in node) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
      const child = (node as Record<string, unknown>)[key];
      if (++count > 10_000) throw new Error("INVALID_INPUT: arguments exceed 10000 elements");
      if (child && typeof child === "object") stack.push(child);
    }
  }
}
