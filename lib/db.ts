/**
 * Drizzle ORM database connection.
 *
 * Uses the `postgres` driver (npm: postgres) with connection pooling
 * via drizzle-orm/postgres-js. The connection string comes from
 * DATABASE_URL environment variable.
 *
 * Why postgres-js instead of pg?
 *   - Better ergonomics with Drizzle (tagged template support)
 *   - Built-in connection pooling
 *   - Same driver used in all Drizzle ORM official examples
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// DATABASE_URL format: postgresql://user:password@host:port/database
// Provided via .env.local (never committed — see .env.example)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the values."
  );
}

// Connection pool with sane defaults for a solopreneur app:
//   - max 10 connections (more than enough for low-volume traffic)
//   - idle timeout 30s (release unused connections quickly)
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 30,
});

export const db = drizzle(client, { schema });

// Type helper: the full database type with all tables
export type Database = typeof db;

// Type helper: a transaction, useful for operations that must be atomic
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
