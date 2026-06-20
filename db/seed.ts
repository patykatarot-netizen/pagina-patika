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
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

/**
 * Seed services — definitive real services for Patyka Tarot.
 * Prices are in Colombian Pesos (COP).
 *
 * availableDays is a bitmask:
 *   Mon=1  Tue=2  Wed=4  Thu=8  Fri=16  Sat=32  Sun=64
 */
const seedServices = [
  // ── Preguntas Puntuales (WhatsApp only) ──
  {
    name: "1 Pregunta Puntual",
    description:
      "Una consulta específica respondida el mismo día por WhatsApp",
    priceCop: 10000,
    durationMin: 5,
    availableDays: 127,
    availableSlots: "[]",
    bookingType: "whatsapp_only",
    category: "pregunta",
  },
  {
    name: "2 Preguntas Puntuales",
    description:
      "Dos consultas específicas respondidas el mismo día por WhatsApp",
    priceCop: 18000,
    durationMin: 10,
    availableDays: 127,
    availableSlots: "[]",
    bookingType: "whatsapp_only",
    category: "pregunta",
  },
  {
    name: "3 Preguntas Puntuales",
    description:
      "Tres consultas específicas respondidas el mismo día por WhatsApp",
    priceCop: 25000,
    durationMin: 15,
    availableDays: 127,
    availableSlots: "[]",
    bookingType: "whatsapp_only",
    category: "pregunta",
  },

  // ── Lectura Temática (Mié, Vie) ──
  {
    name: "Lectura Temática",
    description:
      "Lectura enfocada en Amor, Dinero o Trabajo — 30 minutos",
    priceCop: 35000,
    durationMin: 30,
    availableDays: 20,
    availableSlots: JSON.stringify([
      "08:00", "09:00", "10:00", "11:00", "12:00",
      "14:00", "15:00", "16:00", "17:00",
    ]),
    bookingType: "web",
    category: "tematica",
  },

  // ── Lectura Completa (Lun, Mar, Jue) ──
  {
    name: "Lectura Completa + Ritual Energético",
    description:
      "Lectura completa de cartas + ritual energético personalizado — 60 minutos",
    priceCop: 70000,
    durationMin: 60,
    availableDays: 11,
    availableSlots: JSON.stringify([
      "08:00", "09:30", "11:00",
      "14:00", "15:30", "17:00",
    ]),
    bookingType: "web",
    category: "completa",
  },

  // ── Trabajo Energético (Próximamente) ──
  {
    name: "Trabajo Energético",
    description:
      "Limpieza y alineación energética personalizada — Próximamente",
    priceCop: 0,
    durationMin: 0,
    availableDays: 0,
    availableSlots: "[]",
    bookingType: "web",
    category: "energetico",
  },
];

async function main() {
  console.log("🌱 Seeding Patyka Tarot database…\n");

  // ── Services ──────────────────────────────────────────────────────────
  const existing = await db.select().from(schema.services);

  if (existing.length > 0) {
    // Check if the old schema (placeholder services) needs migration
    const hasNewFields = existing[0].hasOwnProperty("availableDays");

    if (hasNewFields) {
      console.log("ℹ️  Services already have new fields — updating values…\n");
      for (const service of seedServices) {
        await db
          .update(schema.services)
          .set(service)
          .where(eq(schema.services.name, service.name));
      }
      console.log("✅ Services updated.\n");
    } else {
      console.log("ℹ️  Services exist but missing new fields — dropping and recreating…\n");
      await db.delete(schema.services);
      await db.insert(schema.services).values(seedServices);
      console.log("✅ Services recreated with new fields.\n");
    }
  } else {
    console.log("   Inserting 6 seed services…\n");
    await db.insert(schema.services).values(seedServices);
    console.log("✅ Services seeded.\n");
  }

  // Log all services
  for (const s of seedServices) {
    const price = s.priceCop > 0
      ? `$${s.priceCop.toLocaleString("es-CO")} COP`
      : "TBD";
    console.log(
      `     - ${s.name}: ${price} / ${s.durationMin > 0 ? `${s.durationMin} min` : "TBD"} / ${s.bookingType} / ${s.category}`
    );
  }

  // ── Testimonials ──────────────────────────────────────────────────────
  console.log("");
  const existingTestimonials = await db.select().from(schema.testimonials);
  if (existingTestimonials.length > 0) {
    console.log(`ℹ️  ${existingTestimonials.length} testimonial(s) already exist — skipping.`);
  } else {
    console.log("   ℹ️  Testimonials table is empty (intentional).");
    console.log("      Patyka adds them later via DB UI — no code changes needed.");
  }

  console.log("\n✅ Seed complete.");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
