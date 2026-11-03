// Builds the Demo Family in the local D1 and R2 that `pnpm dev` uses.
// Production re-seeds nightly (cron) and on the first demo sign-in.
import { getPlatformProxy } from "wrangler";
import { d1Db } from "#/db";
import { r2Blobs } from "#/server/blobs";
import { seedDemo } from "#/services/demo";

const proxy = await getPlatformProxy<Env>();
await seedDemo(d1Db(proxy.env.DB), r2Blobs(proxy.env.BLOBS));
await proxy.dispose();
console.log("Demo Family seeded");
