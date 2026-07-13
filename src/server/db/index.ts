import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update. For PGlite we also cache the client so the schema isn't rebuilt on every reload.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  pglite: PGlite | undefined;
};

/**
 * When DATABASE_URL uses the `pglite:` scheme we run an embedded, in-memory Postgres — no server,
 * no Docker, no setup. It's created fresh (with the schema below) each time the server starts, so
 * data does NOT survive a dev-server restart. That's a deliberate trade for reliability: a
 * file-backed PGlite corrupts whenever the dev server is killed uncleanly. For durable data, point
 * DATABASE_URL at a real `postgresql://` server instead.
 */
const usePglite = env.DATABASE_URL.startsWith("pglite:");

/** Concatenate the drizzle migration SQL so a fresh in-memory DB has all the tables. */
function loadSchemaSql(): string {
  const dir = join(process.cwd(), "drizzle");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
}

export const db = usePglite
  ? (() => {
      const client = globalForDb.pglite ?? new PGlite();
      if (!globalForDb.pglite) {
        // Enqueue schema creation immediately; PGlite runs operations FIFO on one connection,
        // so every app query below is guaranteed to see these tables.
        void client.exec(loadSchemaSql());
        if (env.NODE_ENV !== "production") globalForDb.pglite = client;
      }
      return drizzlePglite(client, { schema });
    })()
  : (() => {
      const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
      if (env.NODE_ENV !== "production") globalForDb.conn = conn;
      return drizzlePg(conn, { schema });
    })();
