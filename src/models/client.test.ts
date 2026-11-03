import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelError, httpModelClient } from "./client";

// The HTTP client against a stubbed provider: what the rest of the app gets back from it.

const client = () => httpModelClient({ modelApiKey: "meta-key", basetenApiKey: "baseten-key" });
const htmlPage = `<html><head><title>502 Bad Gateway</title></head><body>${"x".repeat(2000)}</body></html>`;

function provider(status: number, body: string, contentType = "text/html") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status, headers: { "Content-Type": contentType } })),
  );
}

async function errorOf(call: Promise<unknown>): Promise<ModelError> {
  const e = await call.catch((err: unknown) => err);
  expect(e).toBeInstanceOf(ModelError);
  return e as ModelError;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("model client errors", () => {
  it("turns a provider's HTML error page into a short error", async () => {
    provider(502, htmlPage);

    const e = await errorOf(client().segment({ model: "sam-3.1", phrase: "leaf", imageUrl: "data:," }));

    expect(e.message).toBe("502 provider error");
    expect(e.status).toBe(502);
  });

  it("keeps the provider's own short reason for a chat call", async () => {
    provider(400, JSON.stringify({ error: { message: "image input not supported" } }), "application/json");

    const e = await errorOf(
      client().chat({ provider: "baseten", model: "m", messages: [{ role: "user", content: "hi" }] }),
    );

    expect(e.message).toBe("400 image input not supported");
    expect(e.status).toBe(400);
  });

  it("drops an HTML error page from a chat call too", async () => {
    provider(400, htmlPage);

    const e = await errorOf(
      client().chat({ provider: "meta", model: "m", messages: [{ role: "user", content: "hi" }] }),
    );

    expect(e.message).toBe("400 provider error");
  });
});

describe("model client chat", () => {
  it("streams a chat reply and returns the whole text with its usage", async () => {
    const chunk = (o: object) =>
      `data: ${JSON.stringify({ id: "c", object: "chat.completion.chunk", created: 0, model: "muse-spark-1.3", ...o })}\n\n`;
    provider(
      200,
      chunk({ choices: [{ index: 0, delta: { content: '{"ok":' } }] }) +
        chunk({ choices: [{ index: 0, delta: { content: " true}" } }] }) +
        chunk({ choices: [], usage: { prompt_tokens: 12, completion_tokens: 5 } }) +
        "data: [DONE]\n\n",
      "text/event-stream",
    );

    const r = await client().chat({
      provider: "meta",
      model: "muse-spark-1.3",
      effort: "medium",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(r).toEqual({
      text: '{"ok": true}',
      usage: { inputTokens: 12, outputTokens: 5 },
      model: "muse-spark-1.3",
    });
  });
});
