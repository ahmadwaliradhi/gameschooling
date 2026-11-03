import OpenAI from "openai";

// The one boundary between GameSchooling and model APIs. Tests swap in a fake.

export type Usage = { inputTokens: number; outputTokens: number };
export type Effort = "low" | "medium" | "high";
export type JsonSchema = { name: string; schema: Record<string, unknown> };
export type Part = { type: "text"; text: string } | { type: "image"; url: string };
export type Message = { role: "system" | "user"; content: string | Part[] };
export type TextResult = { text: string; usage: Usage; model: string };
export type Turn = { speaker: string | null; text: string; startMs: number; endMs: number };

export interface ModelClient {
  // Meta Responses API, streamed so long reasoning never hits a gateway timeout.
  respond(req: {
    model: string;
    messages: Message[];
    effort?: Effort;
    schema?: JsonSchema;
  }): Promise<TextResult>;
  // Chat Completions on Meta or Baseten.
  chat(req: {
    provider: "meta" | "baseten";
    model: string;
    messages: Message[];
    effort?: Effort;
    schema?: JsonSchema;
  }): Promise<TextResult>;
  image(req: { model: string; prompt: string }): Promise<{ bytes: Uint8Array; contentType: string }>;
  // SAM: raw segmentation text for one noun phrase; "" when nothing is found.
  segment(req: { model: string; phrase: string; imageUrl: string }): Promise<{ raw: string }>;
  transcribe(req: {
    model: string;
    wav: Uint8Array;
    languageBias: string[];
  }): Promise<{ transcript: string; turns: Turn[]; audioDurationMs: number }>;
}

export class ModelError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
  }
}

export const META_BASE_URL = "https://api.meta.ai/v1";
export const BASETEN_BASE_URL = "https://inference.baseten.co/v1";

type Keys = { modelApiKey: string; basetenApiKey: string };

function toResponsesInput(messages: Message[]) {
  return messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : m.content.map((p) =>
            p.type === "text"
              ? { type: "input_text" as const, text: p.text }
              : { type: "input_image" as const, image_url: p.url, detail: "auto" as const },
          ),
  }));
}

function toChatMessages(messages: Message[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((m) =>
    m.role === "system"
      ? { role: "system", content: typeof m.content === "string" ? m.content : partsText(m.content) }
      : {
          role: "user",
          content:
            typeof m.content === "string"
              ? m.content
              : m.content.map((p) =>
                  p.type === "text"
                    ? { type: "text" as const, text: p.text }
                    : { type: "image_url" as const, image_url: { url: p.url } },
                ),
        },
  );
}

function partsText(parts: Part[]) {
  return parts.map((p) => (p.type === "text" ? p.text : "")).join("\n");
}

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ModelError) throw e;
    if (e instanceof OpenAI.APIError) throw new ModelError(e.message, e.status ?? null);
    throw new ModelError(e instanceof Error ? e.message : String(e), null);
  }
}

async function failOnBadStatus(res: Response) {
  if (!res.ok) throw new ModelError(`${res.status} ${(await res.text()).slice(0, 500)}`, res.status);
}

export function httpModelClient(keys: Keys): ModelClient {
  // Built on first use so a missing key fails one logged call, not the whole request.
  let metaSdk: OpenAI | undefined;
  let basetenSdk: OpenAI | undefined;
  const meta = () => (metaSdk ??= new OpenAI({ baseURL: META_BASE_URL, apiKey: keys.modelApiKey }));
  const baseten = () =>
    (basetenSdk ??= new OpenAI({ baseURL: BASETEN_BASE_URL, apiKey: keys.basetenApiKey }));

  return {
    respond: (req) =>
      wrap(async () => {
        const stream = await meta().responses.create({
          model: req.model,
          input: toResponsesInput(req.messages),
          stream: true,
          ...(req.effort ? { reasoning: { effort: req.effort } } : {}),
          ...(req.schema
            ? {
                text: {
                  format: {
                    type: "json_schema",
                    name: req.schema.name,
                    schema: req.schema.schema,
                    strict: true,
                  },
                },
              }
            : {}),
        });
        let text = "";
        let usage: Usage = { inputTokens: 0, outputTokens: 0 };
        let model = req.model;
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") text += event.delta;
          if (event.type === "response.completed") {
            model = event.response.model;
            usage = {
              inputTokens: event.response.usage?.input_tokens ?? 0,
              outputTokens: event.response.usage?.output_tokens ?? 0,
            };
          }
          if (event.type === "response.failed") {
            throw new ModelError(event.response.error?.message ?? "response failed", null);
          }
        }
        return { text, usage, model };
      }),

    chat: (req) =>
      wrap(async () => {
        const client = req.provider === "meta" ? meta() : baseten();
        const res = await client.chat.completions.create({
          model: req.model,
          messages: toChatMessages(req.messages),
          ...(req.effort ? { reasoning_effort: req.effort } : {}),
          ...(req.schema
            ? {
                response_format: {
                  type: "json_schema",
                  json_schema: { name: req.schema.name, schema: req.schema.schema, strict: true },
                },
              }
            : {}),
        });
        return {
          text: res.choices[0]?.message.content ?? "",
          usage: {
            inputTokens: res.usage?.prompt_tokens ?? 0,
            outputTokens: res.usage?.completion_tokens ?? 0,
          },
          model: res.model,
        };
      }),

    image: (req) =>
      wrap(async () => {
        const res = await meta().images.generate({
          model: req.model,
          prompt: req.prompt,
          n: 1,
          size: "1024x1024",
          output_format: "webp",
          // Meta extensions: one fast pass, no web lookups.
          ...({
            reasoning_strength: "low",
            tool_enablement: { enable_web_search: false, enable_image_search: false, enable_shell: false },
          } as object),
        });
        const b64 = res.data?.[0]?.b64_json;
        if (!b64) throw new ModelError("no image returned", null);
        return { bytes: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), contentType: "image/webp" };
      }),

    segment: (req) =>
      wrap(async () => {
        const res = await fetch(`${META_BASE_URL}/responses`, {
          method: "POST",
          headers: { Authorization: `Bearer ${keys.modelApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: req.model,
            stream: false,
            metadata: { mask_encoding: "one_bit", include_confidence: "true" },
            input: [
              {
                type: "message",
                role: "user",
                content: [
                  { type: "input_text", text: req.phrase },
                  { type: "input_image", image_url: req.imageUrl },
                ],
              },
            ],
          }),
        });
        await failOnBadStatus(res);
        const body = (await res.json()) as {
          output_text?: string;
          output?: { content?: { type: string; text?: string }[] }[];
        };
        const raw =
          body.output_text ??
          (body.output ?? [])
            .flatMap((o) => o.content ?? [])
            .filter((c) => c.type === "output_text")
            .map((c) => c.text ?? "")
            .join("");
        return { raw };
      }),

    transcribe: (req) =>
      wrap(async () => {
        const form = new FormData();
        form.append(
          "request",
          new Blob(
            [
              JSON.stringify({
                model: req.model,
                audioEncoding: "WAV",
                mode: "DIARIZATION",
                languageBias: req.languageBias,
              }),
            ],
            { type: "application/json" },
          ),
        );
        form.append("audio", new Blob([req.wav as BlobPart], { type: "audio/wav" }), "proof.wav");
        const res = await fetch(`${META_BASE_URL}/asr/transcribe`, {
          method: "POST",
          headers: { Authorization: `Bearer ${keys.modelApiKey}`, Accept: "application/json" },
          body: form,
        });
        await failOnBadStatus(res);
        const body = (await res.json()) as {
          transcript: string;
          audioDurationMs: number;
          turns?: { transcript: string; speaker?: string; startMs: number; endMs: number }[];
        };
        return {
          transcript: body.transcript,
          audioDurationMs: body.audioDurationMs,
          turns: (body.turns ?? []).map((t) => ({
            speaker: t.speaker ?? null,
            text: t.transcript,
            startMs: t.startMs,
            endMs: t.endMs,
          })),
        };
      }),
  };
}
