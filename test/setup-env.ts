/**
 * E2E tests import AppModule, which requires MongoDB.
 * Override with a running local instance or a cloud URI before `pnpm test:e2e`.
 */
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wubble-e2e';
