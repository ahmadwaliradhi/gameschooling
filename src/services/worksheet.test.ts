import { describe, expect, it } from "vitest";
import type { ModelClient } from "#/models/client";
import { deps, familyWithChild, fakeClient, json, questFor, testDb } from "#/test/harness";
import { checkProof, decideAnswer } from "./check-proof";
import { childView, modelLog, parentView } from "./views";

const sheet = {
  kind: "worksheet" as const,
  bytes: new Uint8Array([255, 216, 255]),
  contentType: "image/jpeg",
  width: 800,
  height: 1000,
};

const answers = [
  { question: "2 + 3", expected: "5", reading: "5", legible: true, x1: 100, y1: 100, x2: 200, y2: 150 },
  { question: "4 + 4", expected: "8", reading: "8", legible: true, x1: 100, y1: 300, x2: 200, y2: 350 },
  { question: "6 + 1", expected: "7", reading: "9", legible: true, x1: 100, y1: 500, x2: 200, y2: 550 },
];
const samRefined =
  "<0f>1<|box;x1=105;y1=102;x2=190;y2=148;w=800;h=1000|><|mask;x=0;y=0;data=2,2,!abc|>,2<|box;x1=104;y1=301;x2=195;y2=349;w=800;h=1000|>,3<|box;x1=101;y1=505;x2=180;y2=540;w=800;h=1000|>";

// The reader finds the answers; both judges pass an answer only when its reading matches.
function worksheetClient(
  found: object[] = answers,
  opts: { judged?: string[]; segment?: ModelClient["segment"] } = {},
) {
  return fakeClient({
    segment: opts.segment ?? (async () => ({ raw: samRefined })),
    chat: async ({ provider, schema, messages }) => {
      if (schema?.name === "worksheet_answers") return json({ answers: found });
      const prompt = JSON.stringify(messages);
      opts.judged?.push(prompt);
      const right = /Question: 2 \+ 3|Question: 4 \+ 4/.test(prompt);
      const verdict = {
        decision: right ? "pass" : "fail",
        confidence: 0.9,
        reason: "checked",
        description: "",
      };
      return provider === "meta" ? json(verdict) : json(verdict, "meta-models/muse-spark-open-1026");
    },
  });
}

async function worksheetQuest() {
  const db = await testDb();
  const family = await familyWithChild(db, { nickname: "Ali", birthYear: new Date().getFullYear() - 9 });
  const questId = await questFor(db, family.familyId, family.childId, {
    proofKind: "worksheet",
    lookFor: [],
    readAloud: "Do the addition sheet and take one photo!",
    answer: "5, 8, 7",
    points: 12,
  });
  return { db, ...family, questId };
}

describe("Worksheet Proof", () => {
  it("gives each answer its own two-model Verdict and pays for the right ones", async () => {
    const { db, familyId, childId, questId } = await worksheetQuest();
    const judged: string[] = [];

    const result = await checkProof(deps(db, worksheetClient(answers, { judged })), {
      familyId,
      questId,
      proof: sheet,
    });

    expect(result.outcome).toBe("accepted");
    expect(judged).toHaveLength(6);
    expect((await childView(db, familyId, childId)).points).toBe(8);
    const [q] = (await parentView(db, familyId, childId)).quests;
    expect(q!.verdict!.answers.map((a) => [a.question, a.reading, a.outcome])).toEqual([
      ["2 + 3", "5", "accepted"],
      ["4 + 4", "8", "accepted"],
      ["6 + 1", "9", "not_yet"],
    ]);
  });

  it("crops each answer with SAM 3.1 box prompts and shows the Parent the refined boxes", async () => {
    const { db, familyId, childId, questId } = await worksheetQuest();
    const prompts: string[] = [];

    const { verdictId } = await checkProof(
      deps(
        db,
        worksheetClient(answers, {
          segment: async ({ phrase }) => {
            prompts.push(phrase);
            return { raw: samRefined };
          },
        }),
      ),
      { familyId, questId, proof: sheet },
    );

    expect(prompts).toEqual([
      "<0f>1<|box;x1=100;y1=100;x2=200;y2=150;w=800;h=1000|>,2<|box;x1=100;y1=300;x2=200;y2=350;w=800;h=1000|>,3<|box;x1=100;y1=500;x2=200;y2=550;w=800;h=1000|>",
    ]);
    const [q] = (await parentView(db, familyId, childId)).quests;
    expect(q!.verdict!.answers[0]!.box).toEqual({ x1: 105, y1: 102, x2: 190, y2: 148 });
    expect(q!.verdict!.proof).toMatchObject({ photoWidth: 800, photoHeight: 1000 });
    const agents = (await modelLog(db, familyId, { verdictId })).map((c) => c.agent);
    expect(agents.filter((a) => a === "worksheet_reader")).toHaveLength(1);
    expect(agents.filter((a) => a === "segmenter")).toHaveLength(1);
  });

  it("keeps the reader's boxes when SAM fails", async () => {
    const { db, familyId, childId, questId } = await worksheetQuest();

    await checkProof(
      deps(
        db,
        worksheetClient(answers, {
          segment: async () => {
            throw new Error("503");
          },
        }),
      ),
      { familyId, questId, proof: sheet },
    );

    const [q] = (await parentView(db, familyId, childId)).quests;
    expect(q!.verdict!.answers[2]!.box).toEqual({ x1: 100, y1: 500, x2: 200, y2: 550 });
  });

  it("sends an answer the models cannot read to the Parent instead of marking it wrong", async () => {
    const { db, familyId, childId, parentId, questId } = await worksheetQuest();
    const judged: string[] = [];
    const unclear = [answers[0]!, { ...answers[1]!, reading: "", legible: false }];

    const result = await checkProof(deps(db, worksheetClient(unclear, { judged })), {
      familyId,
      questId,
      proof: sheet,
    });

    expect(result.outcome).toBe("needs_parent");
    expect(judged).toHaveLength(2);
    expect((await childView(db, familyId, childId)).points).toBe(0);
    const [q] = (await parentView(db, familyId, childId)).quests;
    const waiting = q!.verdict!.answers.find((a) => a.outcome === "needs_parent")!;

    await decideAnswer(db, { familyId, parentId, answerId: waiting.id, choice: "accept" });

    expect((await childView(db, familyId, childId)).points).toBe(12);
    expect((await childView(db, familyId, childId)).quests).toEqual([]);
  });

  it("lets the Parent overrule one answer and moves the balance with it", async () => {
    const { db, familyId, childId, parentId, questId } = await worksheetQuest();
    await checkProof(deps(db, worksheetClient()), { familyId, questId, proof: sheet });
    const [q] = (await parentView(db, familyId, childId)).quests;
    const wrong = q!.verdict!.answers.find((a) => a.outcome === "not_yet")!;

    await decideAnswer(db, { familyId, parentId, answerId: wrong.id, choice: "accept" });

    expect((await childView(db, familyId, childId)).points).toBe(12);
    const after = (await parentView(db, familyId, childId)).quests[0]!.verdict!;
    expect(after.answers.find((a) => a.id === wrong.id)).toMatchObject({
      outcome: "accepted",
      modelOutcome: "not_yet",
      decidedBy: parentId,
    });
    expect((await parentView(db, familyId, childId)).pointsLog.map((e) => [e.kind, e.amount])).toEqual([
      ["earned", 8],
      ["overrule", 4],
    ]);
  });

  it("sends a sheet with no answers found to the Parent", async () => {
    const { db, familyId, questId } = await worksheetQuest();

    const result = await checkProof(deps(db, worksheetClient([])), { familyId, questId, proof: sheet });

    expect(result.outcome).toBe("needs_parent");
  });
  it("pays what the answers add up to when two Parents decide different answers at once", async () => {
    // A rejects a right answer and is slow to write its Points; B accepts the wrong one meanwhile.
    // A read the answers before B changed one, so A's total is stale by the time it writes.
    let hold: { gate: Promise<void>; reached: () => void } | null = null;
    const db = await testDb({
      beforeStatement: async (statement) => {
        if (hold && /^insert into "points_log"/i.test(statement)) {
          const { gate, reached } = hold;
          hold = null;
          reached();
          await gate;
        }
      },
    });
    const family = await familyWithChild(db, { nickname: "Ali", birthYear: new Date().getFullYear() - 9 });
    const { familyId, childId, parentId } = family;
    const questId = await questFor(db, familyId, childId, {
      proofKind: "worksheet",
      lookFor: [],
      answer: "5, 8, 7",
      points: 12,
    });
    await checkProof(deps(db, worksheetClient()), { familyId, questId, proof: sheet });
    const [right, , wrong] = (await parentView(db, familyId, childId)).quests[0]!.verdict!.answers;
    let release = () => {};
    const reached = new Promise<void>((r) => {
      hold = { gate: new Promise((g) => (release = g)), reached: r };
    });

    const a = decideAnswer(db, { familyId, parentId, answerId: right!.id, choice: "reject" });
    await reached;
    await decideAnswer(db, { familyId, parentId, answerId: wrong!.id, choice: "accept" });
    release();
    await a;

    const view = await parentView(db, familyId, childId);
    const verdict = view.quests[0]!.verdict!;
    expect(verdict.answers.map((x) => x.outcome)).toEqual(["not_yet", "accepted", "accepted"]);
    expect(view.points).toBe(8);
    expect(verdict.outcome).toBe("accepted");
  });
});
