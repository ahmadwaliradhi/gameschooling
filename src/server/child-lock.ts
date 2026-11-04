import { redirect } from "@tanstack/react-router";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { childUnlocked, enterPin, UNLOCK_MS } from "#/services/pin";
import { db } from "./deps";

// Which Child this device has unlocked with their PIN, as a signed cookie.
export const CHILD_COOKIE = "gs_child";

export function cookieToken(request: Request): string | undefined {
  const cookies = request.headers.get("cookie") ?? "";
  return cookies
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([name]) => name === CHILD_COOKIE)?.[1];
}

export const isUnlocked = (familyId: string, childId: string, token: string | undefined) =>
  childUnlocked(db(), { familyId, childId, token, secret: env.BETTER_AUTH_SECRET });

// For server functions behind a Child's screens: a locked Child goes to their PIN pad.
export async function requireChild(familyId: string, childId: string) {
  if (!(await isUnlocked(familyId, childId, getCookie(CHILD_COOKIE)))) {
    throw redirect({ to: "/play/$childId/pin", params: { childId } });
  }
}

export async function unlockChild(familyId: string, childId: string, pin: string) {
  const result = await enterPin(db(), { familyId, childId, pin, secret: env.BETTER_AUTH_SECRET });
  if (result.ok) {
    setCookie(CHILD_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: UNLOCK_MS / 1000,
    });
  }
  return result.ok ? { ok: true as const } : { ok: false as const, pausedUntil: result.pausedUntil };
}

export const lockChildren = () => deleteCookie(CHILD_COOKIE, { path: "/" });
