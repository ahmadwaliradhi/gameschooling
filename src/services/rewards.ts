import { and, eq, sql } from "drizzle-orm";
import type { Db } from "#/db";
import { rewards } from "#/db/schema";
import { rewardGiven, rewardNotReached } from "#/domain/points";
import { NotFoundError } from "./deps";
import { balanceSql, insertPointsEntryIf } from "./points-log";

// A Parent gives a Reward. The balance check rides on the write itself (`rewardReached` in SQL),
// so two Rewards given at once cannot both spend the same Points.
export async function giveRewardTo(db: Db, input: { familyId: string; childId: string; rewardId: string }) {
  const reward = await db.query.rewards.findFirst({
    where: and(
      eq(rewards.id, input.rewardId),
      eq(rewards.familyId, input.familyId),
      eq(rewards.childId, input.childId),
    ),
  });
  if (!reward) throw new NotFoundError("Reward not found");
  const given = await insertPointsEntryIf(
    db,
    { ...rewardGiven(reward), familyId: input.familyId, childId: input.childId, rewardName: reward.name },
    sql`${balanceSql(input.familyId, input.childId)} >= ${reward.price}`,
  );
  if (!given) throw rewardNotReached(reward);
}
