import { describe, expect, it } from "vitest";
import type { Message, ModelClient } from "#/models/client";
import { deps, familyWithChild, fakeClient, json, memoryBlobs, testDb, usage } from "#/test/harness";
import { makeQuests } from "./make-quests";
import { childView, modelLog, parentView } from "./views";

const brief = (topic: string, proof_kind: "photo" | "voice" | "text" = "voice") => ({
  topic,
  proof_kind,
  look_for: proof_kind === "photo" ? [{ phrase: "leaf", count: 3 }] : [],
  answer: `${topic} answer`,
  recitation: false,
  points: 10,
});

const plannerOutput = {
  quests: [brief("count leaves", "photo"), brief("say numbers")],
  rewards: [
    { name: "ice cream", price: 100 },
    { name: "park", price: 40 },
  ],
};

function userText(messages: Message[]) {
  const user = messages.find((m) => m.role === "user")!;
  return typeof user.content === "string" ? user.content : JSON.stringify(user.content);
}

const writer = (messages: Message[]) => {
  const topic = /"topic":"([^"]+)"/.exec(userText(messages))![1];
  return json({
    title: `Quest: ${topic}`,
    read_aloud: `Let's ${topic}!`,
    cover_prompt: `cover for ${topic}`,
    look_for: topic === "count leaves" ? [{ phrase: "leaf", count: 3 }] : [],
    answer: `${topic} answer`,
  });
};

type Chat = ModelClient["chat"];
const safe = { safe: true, reason: "" };

// Writer and Guardian both use chat; the Guardian passes everything unless told otherwise.
function chatWith(write: Chat, guard: Chat = async () => json(safe)): Chat {
  return async (req) => (req.schema?.name === "guardian_check" ? guard(req) : write(req));
}

async function drain(lines: AsyncIterable<string>) {
  const out: string[] = [];
  for await (const line of lines) out.push(line);
  return out;
}

describe("Make quests", () => {
  it("turns the Plan into Quests with covers and picks up the Plan's Rewards", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const blobs = memoryBlobs();
    const client = fakeClient({
      respond: async () => json(plannerOutput, "muse-wonder-1.0"),
      chat: chatWith(async ({ messages }) => writer(messages)),
      image: async () => ({ bytes: new Uint8Array([1, 2, 3]), contentType: "image/webp" }),
    });

    const lines = await drain(makeQuests(deps(db, client, blobs), { familyId, childId }));

    const view = await parentView(db, familyId, childId);
    expect(view.quests.map((q) => q.title).sort()).toEqual(["Quest: count leaves", "Quest: say numbers"]);
    expect(view.quests.every((q) => q.coverKey && blobs.keys().includes(q.coverKey))).toBe(true);
    expect(view.quests.find((q) => q.title === "Quest: count leaves")?.proofKind).toBe("photo");
    expect(view.rewards.map((r) => [r.name, r.price])).toEqual([
      ["park", 40],
      ["ice cream", 100],
    ]);
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.at(-1)).toMatch(/2 Quests/);
  });

  it("keeps the Quests that finished when a writer or an image fails, and logs the failures", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const client = fakeClient({
      respond: async () =>
        json(
          { ...plannerOutput, quests: [brief("count leaves", "photo"), brief("say numbers"), brief("sing")] },
          "muse-wonder-1.0",
        ),
      chat: chatWith(async ({ messages }) => {
        if (userText(messages).includes('"topic":"sing"')) throw new Error("writer timed out");
        return writer(messages);
      }),
      image: async ({ prompt }) => {
        if (prompt.includes("say numbers")) throw new Error("content_policy_violation");
        return { bytes: new Uint8Array([9]), contentType: "image/webp" };
      },
    });

    await drain(makeQuests(deps(db, client), { familyId, childId }));

    const view = await parentView(db, familyId, childId);
    expect(view.quests.map((q) => q.title).sort()).toEqual(["Quest: count leaves", "Quest: say numbers"]);
    const uncovered = view.quests.find((q) => q.title === "Quest: say numbers")!;
    expect(uncovered.coverKey).toBeNull();
    expect(uncovered.coverColor).toMatch(/^#/);

    const log = await modelLog(db, familyId, { questId: uncovered.id });
    expect(log.map((c) => [c.agent, c.status])).toEqual([
      ["planner", "ok"],
      ["writer", "ok"],
      ["guardian", "ok"],
      ["illustrator", "error"],
    ]);
    expect(log.at(-1)?.error).toContain("content_policy_violation");
  });

  it("falls back to Muse Spark when Muse Wonder fails, and the log shows the model actually used", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const client = fakeClient({
      respond: async ({ model }) => {
        if (model === "muse-wonder-1.0") throw new Error("503 service_overloaded");
        return json({ ...plannerOutput, quests: [brief("say numbers")] }, "muse-spark-1.3");
      },
      chat: chatWith(async ({ messages }) => writer(messages)),
      image: async () => ({ bytes: new Uint8Array([1]), contentType: "image/webp" }),
    });

    await drain(makeQuests(deps(db, client), { familyId, childId }));

    const [quest] = (await parentView(db, familyId, childId)).quests;
    const planners = (await modelLog(db, familyId, { questId: quest!.id })).filter(
      (c) => c.agent === "planner",
    );
    expect(planners.map((c) => [c.model, c.status])).toEqual([
      ["muse-wonder-1.0", "error"],
      ["muse-spark-1.3", "ok"],
    ]);
    expect(planners[1]!.costUsd).toBeCloseTo((100 * 1.25 + 50 * 4.25) / 1e6);
    expect(usage.inputTokens).toBe(100);
  });

  it("never asks a 6-year-old to type", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const client = fakeClient({
      respond: async () =>
        json({ ...plannerOutput, quests: [brief("spell cat", "text")] }, "muse-wonder-1.0"),
      chat: chatWith(async ({ messages }) => writer(messages)),
      image: async () => ({ bytes: new Uint8Array([1]), contentType: "image/webp" }),
    });

    await drain(makeQuests(deps(db, client), { familyId, childId }));

    expect((await parentView(db, familyId, childId)).quests.map((q) => q.proofKind)).toEqual(["voice"]);
  });

  it("checks every Quest's text and cover prompt in a separate call, with the Child's age and Plan", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const checked: string[] = [];
    const client = fakeClient({
      respond: async () => json({ ...plannerOutput, quests: [brief("say numbers")] }, "muse-wonder-1.0"),
      chat: chatWith(
        async ({ messages }) => writer(messages),
        async ({ messages }) => {
          checked.push(userText(messages));
          return json(safe);
        },
      ),
      image: async () => ({ bytes: new Uint8Array([1]), contentType: "image/webp" }),
    });

    await drain(makeQuests(deps(db, client), { familyId, childId }));

    expect(checked).toHaveLength(1);
    expect(checked[0]).toContain("Let's say numbers!");
    expect(checked[0]).toContain("cover for say numbers");
    expect(checked[0]).toContain("No fantasy creatures");
    expect(checked[0]).toMatch(/age: 6/);
    const [quest] = (await parentView(db, familyId, childId)).quests;
    const guardian = (await modelLog(db, familyId, { questId: quest!.id })).find(
      (c) => c.agent === "guardian",
    );
    expect(guardian).toMatchObject({ status: "ok", model: "muse-spark-1.3" });
    expect(guardian?.costUsd).toBeGreaterThan(0);
  });

  it("rewrites a Quest that fails the check once, and keeps it when the rewrite passes", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const writes: string[] = [];
    let checks = 0;
    const client = fakeClient({
      respond: async () => json({ ...plannerOutput, quests: [brief("say numbers")] }, "muse-wonder-1.0"),
      chat: chatWith(
        async ({ messages }) => {
          writes.push(userText(messages));
          return writer(messages);
        },
        async () => json(++checks === 1 ? { safe: false, reason: "mentions a dragon" } : safe),
      ),
      image: async () => ({ bytes: new Uint8Array([1]), contentType: "image/webp" }),
    });

    await drain(makeQuests(deps(db, client), { familyId, childId }));

    expect(writes).toHaveLength(2);
    expect(writes[1]).toContain("mentions a dragon");
    const view = await parentView(db, familyId, childId);
    expect(view.quests.map((q) => q.title)).toEqual(["Quest: say numbers"]);
    expect(view.dropped).toEqual([]);
  });

  it("drops a Quest that fails twice and shows the Parent why, never the Child", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const drawn: string[] = [];
    const client = fakeClient({
      respond: async () =>
        json(
          { ...plannerOutput, quests: [brief("say numbers"), brief("count leaves", "photo")] },
          "muse-wonder-1.0",
        ),
      chat: chatWith(
        async ({ messages }) => writer(messages),
        async ({ messages }) =>
          json(
            userText(messages).includes("say numbers") ? { safe: false, reason: "a stranger appears" } : safe,
          ),
      ),
      image: async ({ prompt }) => {
        drawn.push(prompt);
        return { bytes: new Uint8Array([1]), contentType: "image/webp" };
      },
    });

    const lines = await drain(makeQuests(deps(db, client), { familyId, childId }));

    const view = await parentView(db, familyId, childId);
    expect(view.quests.map((q) => q.title)).toEqual(["Quest: count leaves"]);
    expect(view.dropped).toMatchObject([
      { title: "Quest: say numbers", droppedReason: "a stranger appears" },
    ]);
    expect((await childView(db, familyId, childId)).quests.map((q) => q.title)).toEqual([
      "Quest: count leaves",
    ]);
    expect(drawn).toEqual(["cover for count leaves"]);
    expect(lines.at(-1)).toMatch(/1 Quests/);
  });

  it("draws each cover as soon as its Quest passes the check, alongside the other covers", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    // Resolves true once the promise settles, false if it is still waiting after a short while.
    const within = (p: Promise<unknown>) =>
      Promise.race([p.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 300))]);
    let fastCoverStarted!: () => void;
    let slowCoverStarted!: () => void;
    const fastCover = new Promise<void>((r) => (fastCoverStarted = r));
    const slowCover = new Promise<void>((r) => (slowCoverStarted = r));
    let slowWriterSawFastCover = false;
    let fastCoverSawSlowCover = false;
    const client = fakeClient({
      respond: async () =>
        json({ ...plannerOutput, quests: [brief("fast"), brief("slow")] }, "muse-wonder-1.0"),
      chat: chatWith(async ({ messages }) => {
        // The slow Quest is still being written when the fast Quest's cover should start.
        if (userText(messages).includes('"topic":"slow"')) slowWriterSawFastCover = await within(fastCover);
        return writer(messages);
      }),
      image: async ({ prompt }) => {
        if (prompt.includes("slow")) slowCoverStarted();
        else {
          fastCoverStarted();
          // The fast cover is still drawing when the slow one should start.
          fastCoverSawSlowCover = await within(slowCover);
        }
        return { bytes: new Uint8Array([1]), contentType: "image/webp" };
      },
    });

    const lines = await drain(makeQuests(deps(db, client), { familyId, childId }));

    expect(slowWriterSawFastCover).toBe(true);
    expect(fastCoverSawSlowCover).toBe(true);
    expect((await parentView(db, familyId, childId)).quests.every((q) => q.coverKey)).toBe(true);
    expect(lines.at(-1)).toMatch(/2 Quests/);
  });

  it("drops a Quest when the Guardian cannot be reached, since nothing unchecked reaches a Child", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const client = fakeClient({
      respond: async () => json({ ...plannerOutput, quests: [brief("say numbers")] }, "muse-wonder-1.0"),
      chat: chatWith(
        async ({ messages }) => writer(messages),
        async () => {
          throw new Error("503 unavailable");
        },
      ),
      image: async () => ({ bytes: new Uint8Array([1]), contentType: "image/webp" }),
    });

    await drain(makeQuests(deps(db, client), { familyId, childId }));

    const view = await parentView(db, familyId, childId);
    expect(view.quests).toEqual([]);
    expect(view.dropped[0]?.droppedReason).toMatch(/could not be checked/i);
  });
});
