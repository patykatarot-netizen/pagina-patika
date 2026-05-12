/**
 * Seed script for Patyka Tarot database.
 *
 * Run with: npm run db:seed
 * Requires DATABASE_URL to be set in .env.local.
 *
 * Strategy: Seed-and-Swap
 *   - Services are seeded here with sample values.
 *   - Patyka edits them directly in PostgreSQL (Coolify DB UI or TablePlus)
 *     without needing code changes or redeploys.
 *   - Testimonials table is left empty — Patyka adds them when ready.
 *
 * Idempotent: checks for existing services before inserting, so running
 * this script multiple times won't create duplicates.
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

/**
 * Seed services — these are placeholders Patyka will customize.
 * Prices are in Colombian Pesos (COP).
 */
const seedServices = [
  {
    name: "Lectura General de Tarot",
    description:
      "Lectura completa de cartas para guía espiritual y claridad",
    priceCop: 80000,
    durationMin: 60,
  },
  {
    name: "Lectura Express",
    description:
      "Consulta rápida de 30 min para preguntas específicas",
    priceCop: 50000,
    durationMin: 30,
  },
  {
    name: "Brujitip Personalizado",
    description:
      "Ritual o consejo energético hecho a tu medida",
    priceCop: 120000,
    durationMin: 45,
  },
];

async function main() {
  console.log("🌱 Seeding Patyka Tarot database…");

  // ── Services ──────────────────────────────────────────────────────────
  const existing = await db.select().from(schema.services);
  if (existing.length > 0) {
    console.log(`ℹ️  ${existing.length} service(s) already exist — skipping.`);
  } else {
    console.log("   Inserting 3 seed services…");
    await db.insert(schema.services).values(seedServices);
    console.log("   ✅ Services seeded.");

    // Log what was inserted so Patyka knows what to edit
    for (const s of seedServices) {
      console.log(`     - ${s.name}: $${s.priceCop.toLocaleString("es-CO")} COP / ${s.durationMin} min`);
    }
  }

  // ── Testimonials ──────────────────────────────────────────────────────
  // Left empty intentionally — Patyka adds testimonials via DB UI.
  // The SocialProof component shows a fallback message until data exists.
  const existingTestimonials = await db.select().from(schema.testimonials);
  if (existingTestimonials.length > 0) {
    console.log(`ℹ️  ${existingTestimonials.length} testimonial(s) already exist — skipping.`);
  } else {
    console.log("   ℹ️  Testimonials table is empty (intentional).");
    console.log("      Patyka adds them later via DB UI — no code changes needed.");
  }

  console.log("✅ Seed complete.");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
