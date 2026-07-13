import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

/** Cache the session lookup for the duration of a single RSC render. */
const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
