// Runs the app's real model modules once against Meta and Baseten with real keys, with the same
// prompts and strict schemas the app sends, and checks the answers make sense. Fails loudly.
// Needs macOS `say` for the voice step. Not part of `pnpm check`.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SamFinding } from "#/db/schema";
import { BASETEN_BASE_URL, ModelError, httpModelClient } from "#/models/client";
import { MODELS } from "#/models/ids";
import { drawCover } from "#/models/illustrator";
import { judge } from "#/models/judge";
import type { JudgeInput, JudgeOutput } from "#/models/judging";
import type { CallContext } from "#/models/log";
import { plan, type Brief } from "#/models/planner";
import { secondJudge } from "#/models/second-judge";
import { segment } from "#/models/segmenter";
import { transcribe } from "#/models/transcriber";
import { writeQuest } from "#/models/writer";

const modelApiKey = process.env.MODEL_API_KEY ?? "";
const basetenApiKey = process.env.BASETEN_API_KEY ?? "";
if (!modelApiKey || !basetenApiKey) {
  console.error("MODEL_API_KEY and BASETEN_API_KEY must be set (.dev.vars)");
  process.exit(1);
}

// Every model call writes its model log row here, as it would to D1.
const ctx: CallContext = {
  client: httpModelClient({ modelApiKey, basetenApiKey }),
  familyId: "smoke",
  runId: "smoke",
  write: async (row) => {
    const cost = row.costUsd == null ? "no price" : `$${row.costUsd.toFixed(5)}`;
    const tail = row.status === "ok" ? cost : row.error;
    console.log(`     log ${row.agent} ${row.model} ${row.status} ${row.latencyMs} ms ${tail}`);
  },
};
let failed = 0;

async function step(name: string, fn: () => Promise<string>) {
  const started = Date.now();
  try {
    const detail = await fn();
    console.log(`ok   ${name} (${Date.now() - started} ms) ${detail}`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

function check(ok: boolean, message: string) {
  if (!ok) throw new Error(message);
}

function checkVerdict(v: JudgeOutput) {
  check(v.confidence >= 0 && v.confidence <= 1, `confidence ${v.confidence} is not on a 0–1 scale`);
  return `${v.decision} ${v.confidence} "${v.reason}"`;
}

const planText = `Belajar berhitung sampai 10 dan nama-nama buah dalam bahasa Inggris.
Jangan ada makhluk fantasi.
Hadiah: es krim = 100, taman bermain = 300`;
const age = 6;

await step(`baseten GET /v1/models lists ${MODELS.sparkOpen}`, async () => {
  const res = await fetch(`${BASETEN_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${basetenApiKey}` },
  });
  check(res.ok, `HTTP ${res.status}`);
  const body = (await res.json()) as { data?: { id: string }[] };
  const ids = (body.data ?? []).map((m) => m.id);
  check(ids.includes(MODELS.sparkOpen), `not listed; have ${ids.join(", ")}`);
  return "";
});

await step("a bad Baseten key comes back as 401, not a rejected photo", async () => {
  const bad = httpModelClient({ modelApiKey, basetenApiKey: "invalid" });
  try {
    await bad.chat({
      provider: "baseten",
      model: MODELS.sparkOpen,
      messages: [{ role: "user", content: "hi" }],
    });
  } catch (e) {
    check(e instanceof ModelError && e.status === 401, `got ${e instanceof ModelError ? e.status : e}`);
    return "";
  }
  throw new Error("call succeeded with an invalid key");
});

let brief: Brief | undefined;
await step(`planner ${MODELS.wonder} (responses, quest_plan schema)`, async () => {
  const out = await plan(
    ctx,
    { planText, age, recent: [] },
    { primary: MODELS.wonder, fallback: MODELS.wonder },
  );
  check(out.quests.length > 0, "no Quests");
  check(
    out.rewards.some((r) => r.price === 100),
    `Rewards not read from the Plan: ${JSON.stringify(out.rewards)}`,
  );
  brief = out.quests[0];
  return `${out.quests.length} Quests, rewards ${out.rewards.map((r) => `${r.name}=${r.price}`).join(", ")}`;
});

await step(`planner fallback ${MODELS.spark} (responses, quest_plan schema)`, async () => {
  const out = await plan(
    ctx,
    { planText, age, recent: [] },
    { primary: MODELS.spark, fallback: MODELS.spark },
  );
  check(out.quests.length > 0, "no Quests");
  return `${out.quests.length} Quests`;
});

await step(`writer ${MODELS.spark} (chat, effort medium, quest schema)`, async () => {
  const b: Brief = brief ?? {
    topic: "count apples",
    proof_kind: "photo",
    look_for: [{ phrase: "apple", count: 3 }],
    answer: "three apples",
    recitation: false,
    points: 10,
  };
  const q = await writeQuest(ctx, { brief: b, planText, age });
  check(q.title.trim() !== "" && q.read_aloud.trim() !== "", "empty title or read_aloud");
  return `"${q.title}": ${q.read_aloud.slice(0, 80)}`;
});

let imageUrl = "";
await step(`illustrator ${MODELS.image}`, async () => {
  const r = await drawCover(ctx, "three red apples on a white table, soft flat storybook style, no text");
  check(r.bytes.byteLength > 1000, `only ${r.bytes.byteLength} bytes`);
  imageUrl = `data:${r.contentType};base64,${Buffer.from(r.bytes).toString("base64")}`;
  return `${r.contentType}, ${r.bytes.byteLength} bytes`;
});

const findings: SamFinding[] = [];
await step(`segmenter ${MODELS.sam} finds apples`, async () => {
  check(imageUrl !== "", "no image from illustrator step");
  const r = await segment(ctx, { phrase: "apple", imageUrl });
  // Shows the raw format when counting fails, so countObjects can be fixed against the real output.
  check(r.found > 0, `0 apples counted; raw starts: ${JSON.stringify(r.raw.slice(0, 300))}`);
  findings.push({ phrase: "apple", wanted: 3, found: r.found, raw: r.raw });
  return `${r.found} apples`;
});

const photoInput = (): JudgeInput => ({
  age,
  readAloud: "Find three apples and take a photo of them.",
  answer: "three apples",
  lookFor: [{ phrase: "apple", count: 3 }],
  evidence: { kind: "photo", imageUrl, findings },
});

let firstDescription = "";
await step(`judge ${MODELS.spark} (chat + image, verdict schema)`, async () => {
  check(imageUrl !== "", "no image from illustrator step");
  const v = await judge(ctx, photoInput());
  check(v.description.trim() !== "", "no photo description");
  firstDescription = v.description;
  return checkVerdict(v);
});

await step(`second judge ${MODELS.sparkOpen} (chat + image, verdict schema)`, async () => {
  check(imageUrl !== "", "no image from illustrator step");
  const v = await secondJudge(ctx, photoInput(), async () => firstDescription);
  check(!v.textOnly, "Baseten rejected the image and fell back to text only");
  return checkVerdict(v);
});

await step(`transcriber ${MODELS.voice} hears speech`, async () => {
  const file = join(mkdtempSync(join(tmpdir(), "smoke-")), "speech.wav");
  execFileSync("say", ["-o", file, "--file-format=WAVE", "--data-format=LEI16@16000", "The cat is red."]);
  const turns = await transcribe(ctx, new Uint8Array(readFileSync(file)));
  const text = turns.map((t) => t.text).join(" ");
  check(/cat/i.test(text), `transcript: ${JSON.stringify(text)}`);
  return `${turns.length} turn(s): ${text}`;
});

if (failed) {
  console.error(`${failed} step(s) failed`);
  process.exit(1);
}
