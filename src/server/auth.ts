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
    socialProviders: {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    },
    plugins: [demoSignIn(), tanstackStartCookies()],
  });
}

export function auth() {
  instance ??= createAuth();
  return instance;
}
