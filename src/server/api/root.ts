import { authRouter } from "~/server/api/routers/auth";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { listingRouter } from "~/server/api/routers/listing";
import { notificationRouter } from "~/server/api/routers/notification";
import { profileRouter } from "~/server/api/routers/profile";
import { requestRouter } from "~/server/api/routers/request";
import { resumeRouter } from "~/server/api/routers/resume";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  profile: profileRouter,
  resume: resumeRouter,
  listing: listingRouter,
  request: requestRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 */
export const createCaller = createCallerFactory(appRouter);
