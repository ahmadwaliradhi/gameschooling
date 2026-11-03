import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export async function demoSignIn() {
  const res = await fetch("/api/auth/demo/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("Demo sign-in failed");
}
