import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
import { decideAsParent, giveRewardTo } from "#/services/check-proof";
import { addChild, deleteQuest, removeChild, savePlan, updateChild } from "#/services/family";
import { childView, modelLog, parentView, questForChild, sidebar } from "#/services/views";
import { db } from "./deps";
import { currentParent, parentOr } from "./session";

const parentOrRedirect = () =>
  parentOr(() => {
    throw redirect({ to: "/" });
  });

const ChildInput = z.object({
  nickname: z.string().trim().min(1).max(40),
  birthYear: z.number().int().min(1990).max(2100),
});

export const getSignedIn = createServerFn().handler(async () => (await currentParent()) !== null);

export const getSidebar = createServerFn().handler(async () => {
  const { familyId } = await parentOrRedirect();
  return sidebar(db(), familyId);
});

export const addChildFn = createServerFn({ method: "POST" })
  .validator(ChildInput)
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    return addChild(db(), familyId, data);
  });

export const updateChildFn = createServerFn({ method: "POST" })
  .validator(ChildInput.extend({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await updateChild(db(), familyId, data.childId, data);
  });

export const removeChildFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await removeChild(db(), familyId, data.childId);
  });

export const getParentChild = createServerFn()
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    return parentView(db(), familyId, data.childId);
  });

export const savePlanFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), text: z.string().max(20000) }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await savePlan(db(), familyId, data.childId, data.text);
  });

export const deleteQuestFn = createServerFn({ method: "POST" })
  .validator(z.object({ questId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await deleteQuest(db(), familyId, data.questId);
  });

export const decideFn = createServerFn({ method: "POST" })
  .validator(z.object({ verdictId: z.string(), choice: z.enum(["accept", "reject"]) }))
  .handler(async ({ data }) => {
    const { familyId, parentId } = await parentOrRedirect();
    await decideAsParent(db(), { familyId, parentId, ...data });
  });

export const giveRewardFn = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), rewardId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    await giveRewardTo(db(), { familyId, ...data });
  });

export const getModelLog = createServerFn()
  .validator(z.union([z.object({ questId: z.string() }), z.object({ verdictId: z.string() })]))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    return modelLog(db(), familyId, data);
  });

export const getChildView = createServerFn()
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    return childView(db(), familyId, data.childId);
  });

export const getQuestPlay = createServerFn()
  .validator(z.object({ questId: z.string() }))
  .handler(async ({ data }) => {
    const { familyId } = await parentOrRedirect();
    return questForChild(db(), familyId, data.questId);
  });
