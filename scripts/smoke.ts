// Calls every Meta and Baseten endpoint once with real keys. Fails loudly. Not part of `pnpm check`.
import { BASETEN_BASE_URL, httpModelClient } from "#/models/client";
import { MODELS } from "#/models/ids";
import { encodeWav } from "#/lib/wav-recorder";

const modelApiKey = process.env.MODEL_API_KEY ?? "";
const basetenApiKey = process.env.BASETEN_API_KEY ?? "";
if (!modelApiKey || !basetenApiKey) {
  console.error("MODEL_API_KEY and BASETEN_API_KEY must be set (.dev.vars)");
  process.exit(1);
}
const client = httpModelClient({ modelApiKey, basetenApiKey });
const schema = {
  name: "ok",
  schema: {
    type: "object",
    properties: { ok: { type: "boolean" } },
    required: ["ok"],
    additionalProperties: false,
  },
};
const say = [{ role: "user" as const, content: 'Reply with {"ok": true}' }];
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

await step(`baseten GET /v1/models has ${MODELS.sparkOpen}`, async () => {
  const res = await fetch(`${BASETEN_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${basetenApiKey}` },
  });
  const body = (await res.json()) as { data?: { id: string }[] };
  const ids = (body.data ?? []).map((m) => m.id);
  if (!ids.includes(MODELS.sparkOpen)) throw new Error(`not listed; have ${ids.join(", ")}`);
  return "";
});
await step(`planner ${MODELS.wonder} responses`, async () => {
  const r = await client.respond({ model: MODELS.wonder, messages: say, effort: "low", schema });
  return `${r.model} ${r.text}`;
});
await step(`writer/judge ${MODELS.spark} chat`, async () => {
  const r = await client.chat({ provider: "meta", model: MODELS.spark, messages: say, schema });
  return `${r.model} ${r.text}`;
});
await step(`second judge ${MODELS.sparkOpen} chat`, async () => {
  const r = await client.chat({
    provider: "baseten",
    model: MODELS.sparkOpen,
    messages: say,
    effort: "low",
    schema,
  });
  return `${r.model} ${r.text}`;
});
let imageUrl = "";
await step(`illustrator ${MODELS.image}`, async () => {
  const r = await client.image({
    model: MODELS.image,
    prompt: "three red apples on a white table, flat storybook style, no text",
  });
  imageUrl = `data:${r.contentType};base64,${Buffer.from(r.bytes).toString("base64")}`;
  return `${r.bytes.byteLength} bytes`;
});
await step(`segmenter ${MODELS.sam}`, async () => {
  if (!imageUrl) throw new Error("no image from illustrator step");
  const r = await client.segment({ model: MODELS.sam, phrase: "apple", imageUrl });
  return `${(r.raw.match(/<\|box;/g) ?? []).length} apples`;
});
await step(`second judge image input`, async () => {
  if (!imageUrl) throw new Error("no image from illustrator step");
  const r = await client.chat({
    provider: "baseten",
    model: MODELS.sparkOpen,
    effort: "low",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "How many apples? One word." },
          { type: "image", url: imageUrl },
        ],
      },
    ],
  });
  return r.text.slice(0, 40);
});
await step(`transcriber ${MODELS.voice}`, async () => {
  const silence = new Float32Array(16000);
  const wav = new Uint8Array(await encodeWav(silence, 16000).arrayBuffer());
  const r = await client.transcribe({
    model: MODELS.voice,
    wav,
    languageBias: ["Indonesian", "Arabic", "English"],
  });
  return `${r.audioDurationMs} ms audio`;
});

if (failed) {
  console.error(`${failed} step(s) failed`);
  process.exit(1);
}
