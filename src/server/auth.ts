import { env } from "cloudflare:workers";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { schema } from "#/db";
import { DEMO_USER_ID, seedDemo } from "#/services/demo";
import { r2Blobs } from "./blobs";
import { db } from "./deps";

// Signs anyone into the shared Demo Parent, so judges need no account.
const demoSignIn = () =>
  ({
    id: "demo-sign-in",
    endpoints: {
      demoSignIn: createAuthEndpoint("/demo/sign-in", { method: "POST" }, async (ctx) => {
        let user = await ctx.context.internalAdapter.findUserById(DEMO_USER_ID);
        if (!user) {
          await seedDemo(db(), r2Blobs(env.BLOBS));
          user = await ctx.context.internalAdapter.findUserById(DEMO_USER_ID);
        }
        if (!user) throw new Error("Demo Parent missing");
        const session = await ctx.context.internalAdapter.createSession(user.id);
        await setSessionCookie(ctx, { session, user });
        return ctx.json({ ok: true });
      }),
    },
  }) satisfies BetterAuthPlugin;

let instance: ReturnType<typeof createAuth> | undefined;

function createAuth() {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db(), {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    // A session cookie backed by a `session` row. It lasts 7 days and is pushed back (at most once a day)
    // whenever the device is used, so a week without use means signing in again.
    session: { expiresIn: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        // Always show Google's account chooser, so signing in (and getting past a forgotten Parent PIN)
        // is never a silent redirect.
        prompt: "select_account",
      },
    },
    plugins: [demoSignIn(), tanstackStartCookies()],
  });
}

export function auth() {
  instance ??= createAuth();
  return instance;
}
