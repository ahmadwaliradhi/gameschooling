import { describe, expect, it } from "vitest";
import type { ModelClient } from "#/models/client";
import type { Db } from "#/db";
import { deps, familyWithChild, fakeClient, json, questFor, testDb } from "#/test/harness";
import { checkProof } from "./check-proof";
import { digestsFor, writeDigest, writeWeeklyDigests } from "./digest";
import { addChild } from "./family";
import { modelLog } from "./views";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const pass = { decision: "pass", confidence: 0.9, reason: "counted correctly", description: "" };
const judges = fakeClient({
  chat: async ({ provider }) =>
    provider === "meta" ? json(pass) : json(pass, "meta-models/muse-spark-open-1026"),
});

async function familyWithAVerdict(db: Db) {
  const family = await familyWithChild(db);
  const questId = await questFor(db, family.familyId, family.childId, {
    title: "Count to ten",
    proofKind: "text",
    lookFor: [],
  });
  const { verdictId } = await checkProof(deps(db, judges), {
    familyId: family.familyId,
    questId,
    proof: { kind: "text", text: "1 2 3 4 5 6 7 8 9 10" },
  });
  return { ...family, verdictId };
}

function wonder(reply: (prompt: string) => object): { client: ModelClient; prompts: string[] } {
  const prompts: string[] = [];
  return {
    prompts,
    client: fakeClient({
      respond: async ({ model, messages }) => {
        expect(model).toBe("muse-wonder-1.0");
        const prompt = JSON.stringify(messages);
        prompts.push(prompt);
        return json(reply(prompt), "muse-wonder-1.0");
      },
    }),
  };
}

describe("Weekly Digest", () => {
  it("writes each Parent a short summary per Child from the week's Verdicts", async () => {
    const db = await testDb();
    const { familyId, childId, verdictId } = await familyWithAVerdict(db);
    const { client, prompts } = wonder(() => ({
      children: [
        {
          child_id: childId,
          learned: "Counted to ten in Indonesian.",
          struggled: "Mixed up tujuh and delapan.",
          verdict_ids: [verdictId, "made-up-verdict"],
        },
      ],
    }));

    await writeDigest(deps(db, client), { familyId, week: new Date() });

    const [digest] = await digestsFor(db, familyId);
    expect(digest?.entries).toEqual([
      {
        childId,
        nickname: "Kiki",
        learned: "Counted to ten in Indonesian.",
        struggled: "Mixed up tujuh and delapan.",
        verdictIds: [verdictId],
      },
    ]);
    expect(prompts[0]).toContain(childId);
    expect(prompts[0]).toContain("Count to ten");
    expect(prompts[0]).toContain(verdictId);
    expect(prompts[0]).not.toContain("Kiki");
  });

  it("records the Digest's model call with its cost", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithAVerdict(db);
    const { client } = wonder(() => ({
      children: [{ child_id: childId, learned: "x", struggled: "", verdict_ids: [] }],
    }));

    await writeDigest(deps(db, client), { familyId, week: new Date() });

    const [digest] = await digestsFor(db, familyId);
    const [call] = await modelLog(db, familyId, { runId: digest!.runId });
    expect(call).toMatchObject({ agent: "digest", model: "muse-wonder-1.0", status: "ok" });
    expect(call?.costUsd).toBeGreaterThan(0);
  });

  it("writes nothing for a week with no activity", async () => {
    const db = await testDb();
    const { familyId } = await familyWithChild(db);
    const { client, prompts } = wonder(() => ({ children: [] }));

    await writeDigest(deps(db, client), { familyId, week: new Date() });

    expect(prompts).toEqual([]);
    expect(await digestsFor(db, familyId)).toEqual([]);
  });

  it("leaves out Children with nothing that week", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithAVerdict(db);
    const idleId = await addChild(db, familyId, { nickname: "Bo", birthYear: 2018 });
    const { client, prompts } = wonder(() => ({
      children: [
        { child_id: childId, learned: "x", struggled: "", verdict_ids: [] },
        { child_id: idleId, learned: "invented", struggled: "", verdict_ids: [] },
      ],
    }));

    await writeDigest(deps(db, client), { familyId, week: new Date() });

    expect(prompts[0]).not.toContain(idleId);
    expect((await digestsFor(db, familyId))[0]?.entries.map((e) => e.childId)).toEqual([childId]);
  });

  it("keeps one Digest per week, and the weekly run covers the week just ended", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithAVerdict(db);
    const { client, prompts } = wonder(() => ({
      children: [{ child_id: childId, learned: "x", struggled: "", verdict_ids: [] }],
    }));
    const nextWeek = new Date(Date.now() + WEEK);

    await writeWeeklyDigests(deps(db, client), nextWeek);
    await writeWeeklyDigests(deps(db, client), nextWeek);
    await writeWeeklyDigests(deps(db, client), new Date(Date.now() + 2 * WEEK));

    expect(prompts).toHaveLength(1);
    expect(await digestsFor(db, familyId)).toHaveLength(1);
  });
});
