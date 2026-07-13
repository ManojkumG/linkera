import { type db as Database } from "~/server/db";
import { notifications } from "~/server/db/schema";

/**
 * Central place to emit a notification. Today it only writes the in-app row;
 * email/SMS channels would fan out from here behind the same call site.
 */
export async function notify(
  db: typeof Database,
  input: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    link?: string;
  },
) {
  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
  });
}
