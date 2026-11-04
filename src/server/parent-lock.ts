import { redirect } from "@tanstack/react-router";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { enterParentPin, PARENT_UNLOCK_MS, parentUnlocked, parentUnlockToken } from "#/services/parent-pin";
import { db } from "./deps";

// Whether this device has unlocked the Parent screens with the Parent PIN, as a signed cookie.
export const PARENT_COOKIE = "gs_parent";

const keep = (token: string) =>
  setCookie(PARENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: PARENT_UNLOCK_MS / 1000,
  });

function cookieFrom(request: Request) {
  return (request.headers.get("cookie") ?? "")
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([name]) => name === PARENT_COOKIE)?.[1];
}

type Parent = { familyId: string; signedInAt: Date };

// Whether the Parent screens are open on this device. A fresh sign-in also leaves an unlock behind.
export async function isParentUnlocked(parent: Parent, token = getCookie(PARENT_COOKIE)) {
  const secret = env.BETTER_AUTH_SECRET;
  const { familyId, signedInAt } = parent;
  if (await parentUnlocked(db(), { familyId, secret, token })) return true;
  if (!(await parentUnlocked(db(), { familyId, secret, token: undefined, signedInAt }))) return false;
  keep(await parentUnlockToken(secret, familyId));
  return true;
}

// For server functions behind the Parent screens: a locked device goes to the Parent PIN pad.
export async function requireParentUnlocked(parent: Parent) {
  if (!(await isParentUnlocked(parent))) throw redirect({ to: "/parent-pin" });
}

// For API routes: null when open, else a 423 Response to return as is.
export async function parentLocked423(parent: Parent, request: Request) {
  const token = cookieFrom(request);
  const secret = env.BETTER_AUTH_SECRET;
  const { familyId, signedInAt } = parent;
  const open =
    (await parentUnlocked(db(), { familyId, secret, token })) ||
    (await parentUnlocked(db(), { familyId, secret, token: undefined, signedInAt }));
  return open ? null : new Response("Parent PIN needed", { status: 423 });
}

export async function unlockParent(familyId: string, pin: string) {
  const result = await enterParentPin(db(), { familyId, pin, secret: env.BETTER_AUTH_SECRET });
  if (result.ok) keep(result.token);
  return result.ok ? { ok: true as const } : { ok: false as const, pausedUntil: result.pausedUntil };
}

export const lockParent = () => deleteCookie(PARENT_COOKIE, { path: "/" });
