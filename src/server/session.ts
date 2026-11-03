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

// requireParent, but a signed-out request gets `signedOut()` instead of a throw.
export async function parentOr<T>(signedOut: () => T, headers?: Headers) {
  try {
    return await requireParent(headers);
  } catch (e) {
    if (e instanceof SignedOutError) return signedOut();
    throw e;
  }
}

export const currentParent = () => parentOr(() => null);

// For API routes: the Parent, or a 401 Response to return as is.
export const parentOr401 = (request: Request) =>
  parentOr(() => new Response("Signed out", { status: 401 }), request.headers);
