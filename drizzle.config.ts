/**
 * Drizzle Kit configuration for schema migrations.
 *
 * Drizzle Kit reads this file to generate SQL migrations and push
 * schema changes directly to the database. The schema source tells
 * it where to find our Drizzle table definitions.
 *
 * Usage:
 *   npm run db:generate  → generates migration SQL files in db/migrations/
 *   npm run db:push      → applies schema directly (good for local dev)
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Path to schema definitions (all tables, enums, indexes)
  schema: "./db/schema.ts",

  // Output directory for generated migration SQL
  out: "./db/migrations",

  // PostgreSQL 16 — matches our production target
  dialect: "postgresql",

  // Read from the same env var as our db client
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Strict mode ensures schema changes are explicit and reviewed
  strict: true,

  // Verbose logging during migrations (helpful for debugging)
  verbose: true,
});
