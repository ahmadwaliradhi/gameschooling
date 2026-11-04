import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
import { decideAnswer, decideAsParent } from "#/services/check-proof";
import { giveRewardTo } from "#/services/rewards";
import { recordConsequence } from "#/services/consequences";
import { DEMO_FAMILY_ID, DEMO_USER_ID } from "#/services/demo";
import { digestsFor } from "#/services/digest";
import { addChild, deleteQuest, removeChild, setChildSettings, updateChild } from "#/services/family";
import { familyGoalView, giveFamilyGoal, setFamilyGoal, setFamilyGoalOn } from "#/services/family-goal";
import { acceptInvite, createInvite, familyParents, removeParent } from "#/services/parents";
import { hasParentPin, setParentPin } from "#/services/parent-pin";
import { setPin } from "#/services/pin";
import { chooseStake } from "#/services/stakes";
import { starterPlansFor } from "#/services/starter-plans";
import { childView, homeFor, modelLog, parentView, questForChild, sidebar } from "#/services/views";
import { ageOf } from "#/domain/quest";
import { getChild } from "#/services/family";
import { getCookie } from "@tanstack/react-start/server";
import { CHILD_COOKIE, isUnlocked, lockChildren, requireChild, unlockChild } from "./child-lock";
import { isParentUnlocked, lockParent, requireParentUnlocked, unlockParent } from "./parent-lock";
import { db } from "./deps";
import { currentParent, parentOr } from "./session";

const parentOrRedirect = () =>
  parentOr(() => {
    throw redirect({ to: "/", search: {} });
  });

// Parent screens: signed in, and past the Parent PIN when the Family has one.
async function parentScreen() {
  const parent = await parentOrRedirect();
  await requireParentUnlocked(parent);
  return parent;
}

// The shared Demo Family stays the same for every judge: no PINs, invites or Parent changes.
function refuseInDemo(familyId: string) {
  if (familyId === DEMO_FAMILY_ID) throw new Error("Not available in the Demo Family");
}

const ChildInput = z.object({
  nickname: z.string().trim().min(1).max(40),
  birthYear: z.number().int().min(1990).max(2100),
});

export const getSignedIn = createServerFn().handler(async () => (await currentParent()) !== null);

// Where a signed-in device starts: the Child picker once there are Children, else the Parent screens.
export const getHome = createServerFn().handler(async () => {
  const parent = await currentParent();
  return parent ? homeFor(db(), parent.familyId) : null;
});

// Whether Parent screens should close when this tab is hidden: only behind a Parent PIN.
export const getLocksWhenHidden = createServerFn().handler(async () => {
  const { familyId } = await parentScreen();
  return hasParentPin(db(), familyId);
});

export const lockParentFn = createServerFn({ method: "POST" }).handler(async () => {
  await parentOrRedirect();
  lockParent();
});

export const getSidebar = createServerFn().handler(async () => {
  const { familyId } = await parentScreen();
  return sidebar(db(), familyId);
});

// The Child picker: going back to it locks every Child, and the Parent screens, again.
export const getPlayPicker = createServerFn().handler(async () => {
  const { familyId } = await parentOrRedirect();
  lockChildren();
  lockParent();
  return sidebar(db(), familyId);
});

export const addChildFn = createServerFn({ method: "POST" })
  .validator(ChildInput)
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    return addChild(db(), familyId, data);
  });

export const updateChildFn = createServerFn({ method: "POST" })
  .validator(ChildInput.extend({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    await updateChild(db(), familyId, data.childId, data);
  });

export const setChildSettingsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      childId: z.string(),
      stakes: z.boolean().nullable().optional(),
      siblingBoard: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    const { childId, ...settings } = data;
    await setChildSettings(db(), familyId, childId, settings);
  });

export const setPinFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), pin: z.string().nullable() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    refuseInDemo(familyId);
    await setPin(db(), familyId, data.childId, data.pin);
  });

export const enterPinFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), pin: z.string().max(4) }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    return unlockChild(familyId, data.childId, data.pin);
  });

export const getPinPad = createServerFn()
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    const child = await getChild(db(), familyId, data.childId);
    // No PIN, or already unlocked (e.g. browser Back after unlocking): straight to their Quests.
    if (await isUnlocked(familyId, child.id, getCookie(CHILD_COOKIE))) {
      throw redirect({ to: "/play/$childId", params: { childId: child.id } });
    }
    return { id: child.id, nickname: child.nickname, pausedUntil: child.pinPausedUntil };
  });

export const removeChildFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    await removeChild(db(), familyId, data.childId);
  });

export const getParentChild = createServerFn()
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    const view = await parentView(db(), familyId, data.childId);
    return {
      ...view,
      demo: familyId === DEMO_FAMILY_ID,
      starterPlans: starterPlansFor(ageOf(view.child.birthYear)),
    };
  });

export const deleteQuestFn = createServerFn({ method: "POST" })
  .validator(z.object({ questId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    await deleteQuest(db(), familyId, data.questId);
  });

export const decideFn = createServerFn({ method: "POST" })
  .validator(z.object({ verdictId: z.string(), choice: z.enum(["accept", "reject"]) }))
  .handler(async ({ data }) => {
    const { familyId, parentId } = await parentScreen();
    await decideAsParent(db(), { familyId, parentId, ...data });
  });

export const decideAnswerFn = createServerFn({ method: "POST" })
  .validator(z.object({ answerId: z.string(), choice: z.enum(["accept", "reject"]) }))
  .handler(async ({ data }) => {
    const { familyId, parentId } = await parentScreen();
    await decideAnswer(db(), { familyId, parentId, ...data });
  });

export const giveRewardFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), rewardId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    await giveRewardTo(db(), { familyId, ...data });
  });

export const recordConsequenceFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      childId: z.string(),
      privilege: z.string().trim().min(1).max(200),
      reason: z.string().trim().min(1).max(1000),
    }),
  )
  .handler(async ({ data }) => {
    const { familyId, parentId } = await parentScreen();
    await recordConsequence(db(), { familyId, parentId, ...data });
  });

export const getModelLog = createServerFn()
  .validator(
    z.union([
      z.object({ questId: z.string() }),
      z.object({ verdictId: z.string() }),
      z.object({ runId: z.string() }),
    ]),
  )
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    return modelLog(db(), familyId, data);
  });

export const getChildView = createServerFn()
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await requireChild(familyId, data.childId);
    return childView(db(), familyId, data.childId);
  });

export const getQuestPlay = createServerFn()
  .validator(z.object({ childId: z.string(), questId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await requireChild(familyId, data.childId);
    const play = await questForChild(db(), familyId, data.questId);
    return play?.quest.childId === data.childId ? play : null;
  });

export const chooseStakeFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), questId: z.string(), multiplier: z.number().nullable() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await requireChild(familyId, data.childId);
    const play = await questForChild(db(), familyId, data.questId);
    if (play?.quest.childId !== data.childId) throw new Error("Quest not found");
    await chooseStake(db(), { familyId, questId: data.questId, multiplier: data.multiplier });
  });

// The Parent PIN pad, or null when there is nothing to unlock.
export const getParentPinPad = createServerFn().handler(async () => {
  const parent = await parentOrRedirect();
  if (await isParentUnlocked(parent)) return null;
  const family = await db().query.families.findFirst({ where: (f, { eq }) => eq(f.id, parent.familyId) });
  return { pausedUntil: family?.parentPinPausedUntil ?? null };
});

export const enterParentPinFn = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().max(4) }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    return unlockParent(familyId, data.pin);
  });

export const setParentPinFn = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().nullable() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    refuseInDemo(familyId);
    await setParentPin(db(), familyId, data.pin);
  });

// The Family page: Parents, the Family Goal and past Digests.
export const getFamily = createServerFn().handler(async () => {
  const { familyId, parentId } = await parentScreen();
  const family = await db().query.families.findFirst({
    where: (f, { eq }) => eq(f.id, familyId),
  });
  return {
    me: parentId,
    demo: familyId === DEMO_FAMILY_ID,
    hasParentPin: await hasParentPin(db(), familyId),
    parents: (await familyParents(db(), familyId)).map(({ userId: _u, ...p }) => p),
    familyGoalOn: family?.familyGoal ?? true,
    familyGoal: await familyGoalView(db(), familyId),
    digests: await digestsFor(db(), familyId),
  };
});

export const setFamilyGoalFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ target: z.number().int().min(1).max(100000), rewardName: z.string().trim().min(1).max(100) }),
  )
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    await setFamilyGoal(db(), familyId, data);
  });

export const setFamilyGoalOnFn = createServerFn({ method: "POST" })
  .validator(z.object({ on: z.boolean() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    await setFamilyGoalOn(db(), familyId, data.on);
  });

export const giveFamilyGoalFn = createServerFn({ method: "POST" }).handler(async () => {
  const { familyId } = await parentScreen();
  await giveFamilyGoal(db(), familyId);
});

export const createInviteFn = createServerFn({ method: "POST" }).handler(async () => {
  const { familyId, parentId } = await parentScreen();
  refuseInDemo(familyId);
  return createInvite(db(), { familyId, parentId });
});

export const removeParentFn = createServerFn({ method: "POST" })
  .validator(z.object({ parentId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentScreen();
    refuseInDemo(familyId);
    await removeParent(db(), { familyId, parentId: data.parentId });
  });

export const acceptInviteFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = await parentOrRedirect();
    if (userId === DEMO_USER_ID) throw new Error("Sign in with your own account to join a Family");
    await acceptInvite(db(), { userId, token: data.token });
  });
