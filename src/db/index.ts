import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// D1 in the Worker, libsql in tests: both are async SQLite.
export type Db = BaseSQLiteDatabase<"async", unknown, typeof schema>;

export function d1Db(binding: D1Database): Db {
  return drizzle(binding, { schema });
}

export { schema };
