import type { Agent, modelCalls } from "#/db/schema";
import type { z } from "zod";
import type { ModelClient, TextResult, Usage } from "./client";
import { ModelError } from "./client";
import { parseJson } from "./json";
import { costUsd } from "./pricing";

export type CallRow = Omit<typeof modelCalls.$inferInsert, "id" | "createdAt">;

// What every model module needs: the client, where to write its log row, and what the call belongs to.
export type CallContext = {
  client: ModelClient;
  write: (row: CallRow) => Promise<void>;
  familyId: string;
  runId: string;
  questId?: string | null;
  proofId?: string | null;
  verdictId?: string | null;
};

export type Recorded<T> = {
  value: T;
  output: string;
  model?: string;
  usage?: Usage;
  images?: number;
  audioMs?: number;
};

// A text model's reply as a Recorded: the parsed JSON as the value, the raw text as the log output.
export function parsed<T>(schema: z.ZodType<T>, res: TextResult): Recorded<T> {
  return { value: parseJson(schema, res.text), output: res.text, model: res.model, usage: res.usage };
}

// Runs one model call and writes its model log row, on success and on failure.
export async function recorded<T>(
  ctx: CallContext,
  call: { agent: Agent; model: string; endpoint: string; inputSummary: string },
  fn: () => Promise<Recorded<T>>,
): Promise<T> {
  const started = Date.now();
  const base = {
    familyId: ctx.familyId,
    runId: ctx.runId,
    questId: ctx.questId ?? null,
    proofId: ctx.proofId ?? null,
    verdictId: ctx.verdictId ?? null,
    agent: call.agent,
    endpoint: call.endpoint,
    inputSummary: call.inputSummary.slice(0, 500),
  };
  try {
    const result = await fn();
    const model = result.model ?? call.model;
    await ctx.write({
      ...base,
      model,
      output: result.output.slice(0, 4000),
      inputTokens: result.usage?.inputTokens ?? null,
      outputTokens: result.usage?.outputTokens ?? null,
      costUsd: costUsd(model, result),
      latencyMs: Date.now() - started,
      status: "ok",
      error: null,
    });
    return result.value;
  } catch (e) {
    await ctx.write({
      ...base,
      model: call.model,
      output: null,
      latencyMs: Date.now() - started,
      status: "error",
      error: e instanceof Error ? e.message.slice(0, 1000) : String(e),
    });
    throw e instanceof ModelError ? e : new ModelError(String(e), null);
  }
}
