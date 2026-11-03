import { getRequestHeaders } from "@tanstack/react-start/server";
import { ensureFamily } from "#/services/family";
import { auth } from "./auth";
import { db } from "./deps";

export class SignedOutError extends Error {}

// The signed-in Parent and their Family. Every server function starts here.
export async function requireParent(headers?: Headers) {
  const session = await auth().api.getSession({ headers: headers ?? getRequestHeaders() });
  if (!session) throw new SignedOutError("Signed out");
  return ensureFamily(db(), session.user.id);
}

export async function currentParent() {
  try {
    return await requireParent();
  } catch (e) {
    if (e instanceof SignedOutError) return null;
    throw e;
  }
}
