import { z } from "zod";
import type { JsonSchema } from "./client";

// Strict JSON schema from a Zod schema: every key required, nullable instead of optional.
export function jsonSchema(name: string, schema: z.ZodType): JsonSchema {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return { name, schema: rest };
}

export function parseJson<T>(schema: z.ZodType<T>, text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return schema.parse(JSON.parse(start >= 0 ? text.slice(start, end + 1) : text));
}
