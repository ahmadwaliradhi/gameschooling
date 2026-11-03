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

// Muse Image allows 150 requests a minute.
export const COVER_SPACING_MS = 500;

const COVER_COLORS = ["#F6D365", "#A8E6CF", "#FFD3B6", "#B5D8FF", "#E2C2FF", "#FFAAA5"];

async function* inCompletionOrder<T>(promises: Promise<T>[]): AsyncGenerator<PromiseSettledResult<T>> {
  const pending = new Map(
    promises.map((p, i) => [
      i,
      p.then(
        (value) => ({ i, result: { status: "fulfilled", value } as PromiseSettledResult<T> }),
        (reason) => ({ i, result: { status: "rejected", reason } as PromiseSettledResult<T> }),
      ),
    ]),
  );
  while (pending.size) {
    const { i, result } = await Promise.race(pending.values());
    pending.delete(i);
    yield result;
  }
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
  } catch {
    yield "Could not plan Quests";
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
  const written: { questId: string; title: string; coverPrompt: string }[] = [];
  const drafts = briefs.map(async ({ brief, questId }, i) => {
    const ctx = callContext(deps, { familyId, runId, questId });
    // Written, then checked by the Guardian; one rewrite, then the Quest is dropped for the Parent.
    let draft = await writeQuest(ctx, { brief, planText, age });
    let check = await guard(ctx, draft, { age, planText });
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
    return { questId, title: draft.title, coverPrompt: draft.cover_prompt, safe: check.safe };
  });
  for await (const result of inCompletionOrder(drafts)) {
    if (result.status === "rejected") {
      yield "Could not write one Quest";
    } else if (result.value.safe) {
      written.push(result.value);
      yield `Wrote "${result.value.title}"`;
    } else {
      yield `Dropped "${result.value.title}"`;
    }
  }

  for (const [i, quest] of written.entries()) {
    if (i > 0) await deps.pause(COVER_SPACING_MS);
    try {
      const image = await drawCover(
        callContext(deps, { familyId, runId, questId: quest.questId }),
        quest.coverPrompt,
      );
      const key = `covers/${familyId}/${quest.questId}.webp`;
      await deps.blobs.put(key, image.bytes, image.contentType);
      await db
        .update(quests)
        .set({ coverKey: key })
        .where(and(eq(quests.id, quest.questId), eq(quests.familyId, familyId)));
      yield `Drew a cover for "${quest.title}"`;
    } catch {
      yield `No cover for "${quest.title}"`;
    }
  }

  yield `Made ${written.length} Quests`;
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
