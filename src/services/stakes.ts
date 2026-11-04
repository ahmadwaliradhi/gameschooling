import { and, eq } from "drizzle-orm";
import type { Db } from "#/db";
import { quests } from "#/db/schema";
import { NotFoundError } from "./deps";
import { getChild } from "./family";
import { latestVerdict, offersFor } from "./views";

export class StakeError extends Error {}

// The Child opts into a Stake (or out, with null) for their next Proof on this Quest.
export async function chooseStake(
  db: Db,
  input: { familyId: string; questId: string; multiplier: number | null },
) {
  const { familyId, questId, multiplier } = input;
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, questId), eq(quests.familyId, familyId), eq(quests.status, "open")),
  });
  if (!quest) throw new NotFoundError("Quest not found");
  if (multiplier !== null) {
    const child = await getChild(db, familyId, quest.childId);
    if (!offersFor(child, quest).some((o) => o.multiplier === multiplier)) {
      throw new StakeError("No such Stake on this Quest");
    }
    if ((await latestVerdict(db, familyId, questId))?.outcome === "needs_parent") {
      throw new StakeError("This Quest is waiting for the Parent");
    }
  }
  await db
    .update(quests)
    .set({ stakeMultiplier: multiplier })
    .where(and(eq(quests.id, questId), eq(quests.familyId, familyId)));
}
