import type { ResponseFormat, ToolResponse } from "../types.js";
import { redactErrorMessage, redactSensitive } from "./redaction.js";

function asRecord(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
  return { value: data };
}

export function makeResponse(data: unknown, format: ResponseFormat, markdown: string): ToolResponse {
  const safeData = asRecord(redactSensitive(data));
  const safeMarkdown = redactErrorMessage(markdown);
  return {
    content: [{ type: "text", text: format === "json" ? JSON.stringify(safeData, null, 2) : safeMarkdown }],
    structuredContent: safeData
  };
}

export function makeError(message: string): ToolResponse {
  const safeMessage = redactErrorMessage(message);
  return {
    isError: true,
    content: [{ type: "text", text: `Error: ${safeMessage}` }],
    structuredContent: { error: safeMessage }
  };
}

export function bulletList(title: string, fields: Record<string, unknown>): string {
  const lines = [`# ${title}`, ""];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    lines.push(`- **${key}**: ${String(value)}`);
  }
  return lines.join("\n");
}
