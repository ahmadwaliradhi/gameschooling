import { describe, expect, it } from "vitest";
import { ModelError, type Message, type ModelClient } from "#/models/client";
import {
  deps,
  familyWithChild,
  fakeClient,
  json,
  memoryBlobs,
  questFor,
  rewardFor,
  testDb,
} from "#/test/harness";
import {
  checkProof,
  decideAsParent,
  giveRewardTo,
  ProofKindError,
  WaitingForParentError,
} from "./check-proof";
import { NotFoundError } from "./deps";
import { childRewards, childView, modelLog, parentView, sidebar } from "./views";

const verdict = (decision: "pass" | "fail", confidence: number) => ({
  decision,
  confidence,
  reason: `${decision} because`,
  description: "three leaves on a table",
});

const photo = { kind: "photo" as const, bytes: new Uint8Array([255, 216, 255]), contentType: "image/jpeg" };
const samLeaves =
  "<0f>1<|box;x1=1;y1=2;x2=3;y2=4;w=10;h=10;c=0.9|><|mask;x=0;y=0;data=2,2,!abc|>,2<|box;x1=5;y1=5;x2=8;y2=8;w=10;h=10|>";

function judges(first: object, second: object): Pick<ModelClient, "chat"> {
  return {
    chat: async ({ provider }) =>
      provider === "meta" ? json(first) : json(second, "meta-models/muse-spark-open-1026"),
  };
}

function text(messages: Message[]) {
  return JSON.stringify(messages);
}

describe("Proof check", () => {
  it("pays Points and moves the Quest out of the way when both models accept a photo", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const seen: string[] = [];
    const client = fakeClient({
      segment: async ({ phrase }) => (phrase === "leaf" ? { raw: samLeaves } : { raw: "" }),
      chat: async ({ provider, messages }) => {
        seen.push(text(messages));
        return provider === "meta"
          ? json(verdict("pass", 0.9))
          : json(verdict("pass", 0.8), "meta-models/muse-spark-open-1026");
      },
    });

    const result = await checkProof(deps(db, client), { familyId, questId, proof: photo });

    expect(result.outcome).toBe("accepted");
    const view = await childView(db, familyId, childId);
    expect(view.points).toBe(12);
    expect(view.quests).toEqual([]);
    expect(seen.every((m) => m.includes("SAM 3.1 found 2") && m.includes("data:image/jpeg;base64,"))).toBe(
      true,
    );
    const log = await modelLog(db, familyId, { verdictId: result.verdictId });
    expect(log.map((c) => c.agent).sort()).toEqual(["judge", "second_judge", "segmenter"]);
  });

  it("treats an empty SAM result as nothing found, not an error", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const seen: string[] = [];
    const client = fakeClient({
      segment: async () => ({ raw: "" }),
      chat: async ({ provider, messages }) => {
        seen.push(text(messages));
        return json(
          verdict("fail", 0.9),
          provider === "meta" ? "muse-spark-1.3" : "meta-models/muse-spark-open-1026",
        );
      },
    });

    const result = await checkProof(deps(db, client), { familyId, questId, proof: photo });

    expect(result.outcome).toBe("not_yet");
    expect(seen[0]).toContain("SAM 3.1 found 0");
    const log = await modelLog(db, familyId, { verdictId: result.verdictId });
    expect(log.find((c) => c.agent === "segmenter")?.status).toBe("ok");
    expect((await childView(db, familyId, childId)).quests.map((q) => q.state)).toEqual(["try_again"]);
  });

  it("lets the second judge work from text when Baseten rejects the photo, and says so", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const client = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      chat: async ({ provider, messages }) => {
        if (provider === "meta") return json(verdict("pass", 0.9));
        if (text(messages).includes("image_url") || text(messages).includes('"type":"image"')) {
          throw new ModelError("400 image input not supported", 400);
        }
        expect(text(messages)).toContain("three leaves on a table");
        return json(verdict("pass", 0.85), "meta-models/muse-spark-open-1026");
      },
    });

    const result = await checkProof(deps(db, client), { familyId, questId, proof: photo });

    expect(result.outcome).toBe("accepted");
    const log = await modelLog(db, familyId, { verdictId: result.verdictId });
    const second = log.filter((c) => c.agent === "second_judge");
    expect(second.map((c) => c.status)).toEqual(["error", "ok"]);
    expect(second[1]!.inputSummary).toMatch(/^text only/);
    const [q] = (await parentView(db, familyId, childId)).quests;
    expect(q!.verdict!.judges[1]!.textOnly).toBe(true);
  });

  it("does not hide a bad Baseten key behind the text-only fallback", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const client = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      chat: async ({ provider }) => {
        if (provider === "meta") return json(verdict("pass", 0.9));
        throw new ModelError("401 invalid api key", 401);
      },
    });

    const result = await checkProof(deps(db, client), { familyId, questId, proof: photo });

    expect(result.outcome).toBe("needs_parent");
    const log = await modelLog(db, familyId, { verdictId: result.verdictId });
    expect(log.filter((c) => c.agent === "second_judge").map((c) => c.status)).toEqual(["error"]);
  });

  it("feeds the diarized transcript to both judges and keeps no audio", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId, {
      proofKind: "voice",
      lookFor: [],
      answer: "satu dua tiga",
    });
    const blobs = memoryBlobs();
    const seen: string[] = [];
    const client = fakeClient({
      transcribe: async ({ languageBias }) => {
        expect(languageBias).toEqual(["Indonesian", "Arabic", "English"]);
        return {
          transcript: "Ayo hitung. Satu dua tiga",
          audioDurationMs: 4000,
          turns: [
            { speaker: "A", text: "Ayo hitung.", startMs: 0, endMs: 1000 },
            { speaker: "B", text: "Satu dua tiga", startMs: 1200, endMs: 4000 },
          ],
        };
      },
      chat: async ({ provider, messages }) => {
        seen.push(text(messages));
        return json(
          verdict("pass", 0.9),
          provider === "meta" ? "muse-spark-1.3" : "meta-models/muse-spark-open-1026",
        );
      },
    });

    const result = await checkProof(deps(db, client, blobs), {
      familyId,
      questId,
      proof: { kind: "voice", wav: new Uint8Array(44) },
    });

    expect(result.outcome).toBe("accepted");
    expect(seen).toHaveLength(2);
    expect(seen.every((m) => m.includes("B: Satu dua tiga") && m.includes("A: Ayo hitung."))).toBe(true);
    expect(blobs.keys()).toEqual([]);
    const log = await modelLog(db, familyId, { verdictId: result.verdictId });
    expect(log.find((c) => c.agent === "transcriber")?.costUsd).toBeCloseTo((0.18 * 4) / 3600);
  });

  it("sends a typed answer to both judges", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db, {
      nickname: "Ali",
      birthYear: new Date().getFullYear() - 10,
    });
    const questId = await questFor(db, familyId, childId, {
      proofKind: "text",
      lookFor: [],
      answer: "Jakarta",
    });
    const client = fakeClient(judges(verdict("pass", 0.95), verdict("pass", 0.9)));

    const result = await checkProof(deps(db, client), {
      familyId,
      questId,
      proof: { kind: "text", text: "Jakarta" },
    });

    expect(result.outcome).toBe("accepted");
  });

  it("sends disagreement to the Parent, who accepts with one tap", async () => {
    const db = await testDb();
    const { familyId, childId, parentId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const client = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("pass", 0.9), verdict("fail", 0.9)),
    });

    const result = await checkProof(deps(db, client), { familyId, questId, proof: photo });

    expect(result.outcome).toBe("needs_parent");
    expect((await childView(db, familyId, childId)).quests.map((q) => q.state)).toEqual(["waiting"]);
    expect((await sidebar(db, familyId))[0]!.needsParent).toBe(true);
    expect((await childView(db, familyId, childId)).points).toBe(0);

    await decideAsParent(db, { familyId, parentId, verdictId: result.verdictId, choice: "accept" });

    expect((await childView(db, familyId, childId)).points).toBe(12);
    expect((await childView(db, familyId, childId)).quests).toEqual([]);
    expect((await sidebar(db, familyId))[0]!.needsParent).toBe(false);
  });

  it("records a Parent overruling an automatic Verdict and moves the balance back", async () => {
    const db = await testDb();
    const { familyId, childId, parentId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const client = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("pass", 0.9), verdict("pass", 0.9)),
    });
    const result = await checkProof(deps(db, client), { familyId, questId, proof: photo });
    expect((await childView(db, familyId, childId)).points).toBe(12);

    await decideAsParent(db, { familyId, parentId, verdictId: result.verdictId, choice: "reject" });

    const view = await parentView(db, familyId, childId);
    expect(view.points).toBe(0);
    expect(view.quests[0]!.verdict).toMatchObject({
      outcome: "not_yet",
      modelOutcome: "accepted",
      decidedBy: parentId,
    });
    expect((await childView(db, familyId, childId)).quests.map((q) => q.state)).toEqual(["try_again"]);
  });

  it("always sends recitation to the Parent", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId, {
      proofKind: "text",
      lookFor: [],
      recitation: true,
    });
    const client = fakeClient(judges(verdict("pass", 1), verdict("pass", 1)));

    const result = await checkProof(deps(db, client), {
      familyId,
      questId,
      proof: { kind: "text", text: "..." },
    });

    expect(result.outcome).toBe("needs_parent");
  });

  it("sends the Proof to the Parent when a judge fails, with the failure logged", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId, { proofKind: "text", lookFor: [] });
    const client = fakeClient({
      chat: async ({ provider }) => {
        if (provider === "baseten") throw new ModelError("500 backend_unavailable", 500);
        return json(verdict("pass", 0.99));
      },
    });

    const result = await checkProof(deps(db, client), {
      familyId,
      questId,
      proof: { kind: "text", text: "x" },
    });

    expect(result.outcome).toBe("needs_parent");
    const log = await modelLog(db, familyId, { verdictId: result.verdictId });
    expect(log.find((c) => c.agent === "second_judge")).toMatchObject({
      status: "error",
      error: "500 backend_unavailable",
    });
  });

  it("refuses a Proof of a different kind than the Quest asks for", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const client = fakeClient(judges(verdict("pass", 0.9), verdict("pass", 0.9)));

    await expect(
      checkProof(deps(db, client), { familyId, questId, proof: { kind: "text", text: "three" } }),
    ).rejects.toBeInstanceOf(ProofKindError);

    const view = await childView(db, familyId, childId);
    expect(view.points).toBe(0);
    expect(view.quests.map((q) => q.state)).toEqual(["open"]);
    expect((await parentView(db, familyId, childId)).quests.map((q) => q.verdict)).toEqual([null]);
  });

  it("refuses a new Proof while the last one waits for the Parent", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const disagree = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("pass", 0.9), verdict("fail", 0.9)),
    });
    const agree = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("pass", 0.9), verdict("pass", 0.9)),
    });
    await checkProof(deps(db, disagree), { familyId, questId, proof: photo });

    await expect(checkProof(deps(db, agree), { familyId, questId, proof: photo })).rejects.toBeInstanceOf(
      WaitingForParentError,
    );

    expect((await childView(db, familyId, childId)).quests.map((q) => q.state)).toEqual(["waiting"]);
    expect((await sidebar(db, familyId))[0]!.needsParent).toBe(true);
  });

  it("asks for the Parent only about the latest Verdict, even when two Proofs crossed", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    let reached!: () => void;
    const judging = new Promise<void>((r) => (reached = r));
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const slowDisagree = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      chat: async ({ provider }) => {
        reached();
        await gate;
        return provider === "meta"
          ? json(verdict("pass", 0.9))
          : json(verdict("fail", 0.9), "meta-models/muse-spark-open-1026");
      },
    });
    const refuse = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("fail", 0.9), verdict("fail", 0.9)),
    });

    const first = checkProof(deps(db, slowDisagree), { familyId, questId, proof: photo });
    await judging;
    await checkProof(deps(db, refuse), { familyId, questId, proof: photo });
    release();
    expect((await first).outcome).toBe("needs_parent");

    expect((await childView(db, familyId, childId)).quests.map((q) => q.state)).toEqual(["try_again"]);
    expect((await sidebar(db, familyId))[0]!.needsParent).toBe(false);
  });

  it("refuses to decide a Verdict that is no longer the Quest's latest", async () => {
    const db = await testDb();
    const { familyId, parentId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId);
    const refuse = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("fail", 0.9), verdict("fail", 0.9)),
    });
    const agree = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("pass", 0.9), verdict("pass", 0.9)),
    });
    const old = await checkProof(deps(db, refuse), { familyId, questId, proof: photo });
    await checkProof(deps(db, agree), { familyId, questId, proof: photo });

    await expect(
      decideAsParent(db, { familyId, parentId, verdictId: old.verdictId, choice: "accept" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const view = await childView(db, familyId, childId);
    expect(view.points).toBe(12);
    expect(view.quests).toEqual([]);
  });

  it("keeps one Family's Quests and Verdicts out of another Family's reach", async () => {
    const db = await testDb();
    const a = await familyWithChild(db);
    const b = await familyWithChild(db);
    const questId = await questFor(db, a.familyId, a.childId);
    const disagree = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("pass", 0.9), verdict("fail", 0.9)),
    });
    const agree = fakeClient({
      segment: async () => ({ raw: samLeaves }),
      ...judges(verdict("pass", 0.9), verdict("pass", 0.9)),
    });
    const { verdictId } = await checkProof(deps(db, disagree), {
      familyId: a.familyId,
      questId,
      proof: photo,
    });

    await expect(
      decideAsParent(db, { familyId: b.familyId, parentId: b.parentId, verdictId, choice: "accept" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      checkProof(deps(db, agree), { familyId: b.familyId, questId, proof: photo }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const view = await childView(db, a.familyId, a.childId);
    expect(view.points).toBe(0);
    expect(view.quests.map((q) => q.state)).toEqual(["waiting"]);
    expect((await sidebar(db, a.familyId))[0]!.needsParent).toBe(true);
    expect((await sidebar(db, b.familyId))[0]!.points).toBe(0);
  });

  it("gives a Reward by subtracting its Points", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId, { proofKind: "text", lookFor: [], points: 20 });
    await rewardFor(db, familyId, childId, "sticker", 15);
    const client = fakeClient(judges(verdict("pass", 0.9), verdict("pass", 0.9)));
    await checkProof(deps(db, client), { familyId, questId, proof: { kind: "text", text: "ok" } });
    const [sticker] = await childRewards(db, familyId, childId);

    await giveRewardTo(db, { familyId, childId, rewardId: sticker!.id });

    expect((await childView(db, familyId, childId)).points).toBe(5);
    await expect(giveRewardTo(db, { familyId, childId, rewardId: sticker!.id })).rejects.toThrow();
  });
});
