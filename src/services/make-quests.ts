import { and, desc, eq, ne } from "drizzle-orm";
import { quests, rewards } from "#/db/schema";
import { ageOf, proofKindFor, questPoints } from "#/domain/quest";
import { guardQuest } from "#/models/guardian";
import { drawCover } from "#/models/illustrator";
import { plan, type Brief } from "#/models/planner";
import { writeQuest, type QuestDraft } from "#/models/writer";
import { callContext, type Deps } from "./deps";
import { getChild, getPlanText } from "./family";
import { questStates } from "./views";

const COVER_COLORS = ["#F6D365", "#A8E6CF", "#FFD3B6", "#B5D8FF", "#E2C2FF", "#FFAAA5"];

// Runs the tasks at once and yields the lines they report, in the order they report them.
async function* reported(
  tasks: ((report: (line: string) => void) => Promise<void>)[],
): AsyncGenerator<string> {
  const queue: string[] = [];
  let wake: (() => void) | undefined;
  const nudge = () => {
    wake?.();
    wake = undefined;
  };
  let running = true;
  const all = Promise.all(
    tasks.map((task) =>
      task((line) => {
        queue.push(line);
        nudge();
      }),
    ),
  ).finally(() => {
    running = false;
    nudge();
  });
  while (running || queue.length) {
    if (queue.length) yield queue.shift()!;
    else await new Promise<void>((resolve) => (wake = resolve));
  }
  await all;
}

// One Make quests press. Yields progress lines; Quests that finish are kept even if later steps fail.
export async function* makeQuests(
  deps: Deps,
  input: { familyId: string; childId: string },
): AsyncGenerator<string> {
  const { db } = deps;
  const { familyId, childId } = input;
  const runId = crypto.randomUUID();
  const child = await getChild(db, familyId, childId);
  const age = ageOf(child.birthYear);
  const planText = await getPlanText(db, familyId, childId);

  const recentQuests = await db.query.quests.findMany({
    where: and(eq(quests.familyId, familyId), eq(quests.childId, childId), ne(quests.status, "deleted")),
    orderBy: desc(quests.createdAt),
    limit: 15,
  });
  const states = await questStates(
    db,
    familyId,
    recentQuests.map((q) => q.id),
  );
  const recent = recentQuests.map((q) => ({
    title: q.title,
    outcome: q.status === "open" ? (states.get(q.id) ?? null) : q.status,
  }));

  yield "Reading the Plan";
  let planned;
  try {
    planned = await plan(
      callContext(deps, { familyId, runId }),
      { planText, age, recent },
      { primary: deps.config.plannerModel, fallback: deps.config.plannerFallback },
    );
  } catch (e) {
    console.error("make-quests: plan failed", e);
    yield "Could not plan Quests. Try again in a minute.";
    return;
  }

  await db.delete(rewards).where(and(eq(rewards.familyId, familyId), eq(rewards.childId, childId)));
  if (planned.rewards.length) {
    await db
      .insert(rewards)
      .values(planned.rewards.map((r) => ({ familyId, childId, name: r.name, price: Math.max(1, r.price) })));
  }
  yield `Planned ${planned.quests.length} Quests`;

  const briefs = planned.quests.map((brief) => ({ brief, questId: crypto.randomUUID() }));
  let made = 0;
  // Each Quest runs on its own: written, checked, saved, then given a cover without waiting for the others.
  const tasks = briefs.map(({ brief, questId }, i) => async (report: (line: string) => void) => {
    const ctx = callContext(deps, { familyId, runId, questId });
    let draft: QuestDraft;
    let check: Awaited<ReturnType<typeof guard>>;
    try {
      // Written, then checked by the Guardian; one rewrite, then the Quest is dropped for the Parent.
      draft = await writeQuest(ctx, { brief, planText, age });
      check = await guard(ctx, draft, { age, planText });
      if (!check.safe) {
        draft = await writeQuest(ctx, { brief, planText, age, feedback: check.reason });
        check = await guard(ctx, draft, { age, planText });
      }
      await saveQuest(deps, {
        familyId,
        childId,
        questId,
        brief,
        draft,
        age,
        color: COVER_COLORS[i % COVER_COLORS.length],
        droppedReason: check.safe ? null : check.reason,
      });
    } catch (e) {
      console.error("make-quests: write failed", e);
      report("Could not write one Quest");
      return;
    }
    if (!check.safe) {
      report(`Dropped "${draft.title}"`);
      return;
    }
    made++;
    report(`Wrote "${draft.title}"`);

    // Muse Image allows 150 requests a minute, so a run's covers (about five) can all draw at once.
    try {
      const image = await drawCover(ctx, draft.cover_prompt);
      const key = `covers/${familyId}/${questId}.webp`;
      await deps.blobs.put(key, image.bytes, image.contentType);
      await db
        .update(quests)
        .set({ coverKey: key })
        .where(and(eq(quests.id, questId), eq(quests.familyId, familyId)));
      report(`Drew a cover for "${draft.title}"`);
    } catch {
      report(`No cover for "${draft.title}"`);
    }
  });
  yield* reported(tasks);

  yield made === 0 ? "Could not make any Quests. Try again." : `Made ${made} Quests`;
}

async function guard(
  ctx: ReturnType<typeof callContext>,
  draft: QuestDraft,
  input: { age: number; planText: string },
) {
  try {
    const check = await guardQuest(ctx, {
      title: draft.title,
      readAloud: draft.read_aloud,
      coverPrompt: draft.cover_prompt,
      ...input,
    });
    return check.safe ? check : { safe: false, reason: check.reason.trim() || "Not safe for this Child" };
  } catch {
    return { safe: false, reason: "Could not be checked for safety" };
  }
}

async function saveQuest(
  deps: Deps,
  q: {
    familyId: string;
    childId: string;
    questId: string;
    brief: Brief;
    draft: QuestDraft;
    age: number;
    color: string;
    droppedReason: string | null;
  },
) {
  const proofKind = proofKindFor(q.brief.proof_kind, q.age);
  await deps.db.insert(quests).values({
    id: q.questId,
    familyId: q.familyId,
    childId: q.childId,
    title: q.draft.title,
    readAloud: q.draft.read_aloud,
    proofKind,
    lookFor: proofKind === "photo" ? q.draft.look_for : [],
    answer: q.draft.answer,
    recitation: q.brief.recitation,
    points: questPoints(q.brief.points),
    coverColor: q.color,
    status: q.droppedReason === null ? "open" : "dropped",
    droppedReason: q.droppedReason,
  });
}
