import { z } from "zod";
import type { LookFor, SamFinding, TranscriptTurn } from "#/db/schema";
import type { Message, Part } from "./client";
import { jsonSchema } from "./json";
import { parsed, recorded, type CallContext } from "./log";

// Shared by both judges: same input, same output.

export const JudgeOutput = z.strictObject({
  decision: z.enum(["pass", "fail"]),
  // Out of range fails parsing, so the judge counts as failed and the Parent decides.
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  // What the judge saw in the photo, in one or two sentences; "" for other Proofs.
  description: z.string(),
});
export type JudgeOutput = z.infer<typeof JudgeOutput>;
export const judgeSchema = jsonSchema("verdict", JudgeOutput);

export type Evidence =
  | { kind: "photo"; imageUrl: string; findings: SamFinding[] }
  | { kind: "voice"; turns: TranscriptTurn[] }
  | { kind: "text"; text: string };

export type JudgeInput = {
  age: number;
  readAloud: string;
  answer: string;
  lookFor: LookFor[];
  evidence: Evidence;
};

const SYSTEM = `You check a child's Proof for a learning Quest their parent set.
Decide "pass" if the Proof shows the child did what the Quest asked, otherwise "fail".
confidence is 0 to 1: how sure you are. Be honest; unclear Proof means low confidence.
reason is one short line a parent can read.
For voice Proofs, speakers are labelled; one may be a parent prompting. Judge only the child's own answer.`;

export function findingsText(findings: SamFinding[]): string {
  return findings.map((f) => `- "${f.phrase}": wanted ${f.wanted}, SAM 3.1 found ${f.found}`).join("\n");
}

export function judgeMessages(input: JudgeInput, opts: { photoDescription?: string } = {}): Message[] {
  const lookFor = input.lookFor.map((l) => `${l.count} × ${l.phrase}`).join(", ");
  const quest = `Child's age: ${input.age}\nQuest: ${input.readAloud}\nExpected answer or rubric: ${input.answer}${
    lookFor ? `\nThe photo should show: ${lookFor}` : ""
  }`;
  const e = input.evidence;
  let parts: Part[];
  if (e.kind === "photo") {
    const header = `${quest}\n\nProof: a photo.\nSegmentation findings:\n${findingsText(e.findings) || "none"}`;
    parts =
      opts.photoDescription === undefined
        ? [
            { type: "text", text: header },
            { type: "image", url: e.imageUrl },
          ]
        : [
            {
              type: "text",
              text: `${header}\n\nYou cannot see the photo. Another judge described it as: ${opts.photoDescription}`,
            },
          ];
  } else if (e.kind === "voice") {
    const transcript = e.turns.map((t) => `${t.speaker ?? "Speaker"}: ${t.text}`).join("\n");
    parts = [{ type: "text", text: `${quest}\n\nProof: a voice recording, transcribed:\n${transcript}` }];
  } else {
    parts = [{ type: "text", text: `${quest}\n\nProof: the child typed:\n${e.text}` }];
  }
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: parts },
  ];
}

export function summarize(input: JudgeInput): string {
  const e = input.evidence;
  if (e.kind === "photo") return `photo + ${e.findings.length} SAM findings`;
  if (e.kind === "voice") return `transcript, ${e.turns.length} turns`;
  return `typed answer, ${e.text.length} chars`;
}

// One judging call, logged. Each judge module picks its own model, provider and log label.
export function runJudge(
  ctx: CallContext,
  input: JudgeInput,
  call: {
    agent: "judge" | "second_judge";
    provider: "meta" | "baseten";
    model: string;
    inputSummary: string;
    photoDescription?: string;
  },
): Promise<JudgeOutput> {
  return recorded(
    ctx,
    {
      agent: call.agent,
      model: call.model,
      endpoint: `${call.provider} /v1/chat/completions`,
      inputSummary: call.inputSummary,
    },
    async () => {
      const res = await ctx.client.chat({
        provider: call.provider,
        model: call.model,
        effort: "medium",
        schema: judgeSchema,
        messages: judgeMessages(input, { photoDescription: call.photoDescription }),
      });
      return parsed(JudgeOutput, res);
    },
  );
}
