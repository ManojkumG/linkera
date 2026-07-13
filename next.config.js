/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // A stray package-lock.json in the home dir confuses Next's workspace-root
  // detection; pin the tracing root to this project.
  outputFileTracingRoot: import.meta.dirname,
  // PGlite ships a WASM Postgres; keep it external so the server bundler
  // doesn't try to inline the .wasm and break it at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default config;
