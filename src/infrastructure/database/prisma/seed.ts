/**
 * @module seed
 * Standalone database seeding script that populates the brands and models tables
 * from a CSV file (all-vehicles-model.csv). Parses the CSV to extract unique
 * brand (Make) and model (baseModel) pairs, then bulk-inserts them using raw
 * SQL with ON CONFLICT DO NOTHING for idempotency.
 *
 * Connects via Prisma with the Neon serverless adapter over WebSockets.
 * Uses batched raw SQL inserts (500 rows per batch) for performance.
 *
 * Usage: pnpm tsx src/infrastructure/database/prisma/seed.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/prisma/client.js";

// Read DATABASE_URL from environment (loaded by dotenv)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is required');
}

// Configure Neon serverless adapter with WebSocket support
neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

/**
 * Reads a semicolon-delimited CSV of vehicle data, extracts unique brands
 * and models, and inserts them into the database in batches.
 *
 * CSV format: Make (col 0) ; ... ; baseModel (last col)
 * Steps:
 * 1. Parse CSV and deduplicate brand/model pairs.
 * 2. Batch-insert brands using raw SQL with gen_random_uuid() for UUIDs.
 * 3. Fetch inserted brand ref_ids to build FK mapping.
 * 4. Batch-insert models with brand_ref_id FKs.
 */
async function main() {
  const csvPath = resolve(process.cwd(), "all-vehicles-model.csv");
  const raw = readFileSync(csvPath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim() !== "");

  // Skip header, parse Make (col 0) and baseModel (last col)
  const entries = new Set<string>();
  const brandSet = new Set<string>();
  const modelMap = new Map<string, string>(); // baseModel -> make

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const make = cols[0]?.trim();
    const baseModel = cols.at(-1)?.trim().replace(/\r/, "");

    if (!make || !baseModel) continue;

    brandSet.add(make);
    // Composite key "make::model" to deduplicate brand-model pairs
    const key = `${make}::${baseModel}`;
    if (!entries.has(key)) {
      entries.add(key);
      modelMap.set(key, make);
    }
  }

  console.log(`Found ${brandSet.size} unique brands, ${entries.size} unique models`);

  // Insert brands in batches using raw SQL for performance
  const BATCH = 500;
  const brands = Array.from(brandSet);
  for (let i = 0; i < brands.length; i += BATCH) {
    const batch = brands.slice(i, i + BATCH);
    // gen_random_uuid() generates UUIDs at the database level; ON CONFLICT for idempotency
    const values = batch.map((b) => `(gen_random_uuid(), '${b.replace(/'/g, "''")}')`).join(",\n");
    await prisma.$executeRawUnsafe(`
      INSERT INTO brands (id, name)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);
  }
  console.log("✅ Brands inserted");

  // Fetch brand ref_ids (auto-incremented int) to use as FKs for models
  const allBrands = await prisma.$queryRawUnsafe<{ name: string; ref_id: number }[]>(`SELECT name, ref_id FROM brands`);
  const brandRefMap = new Map(allBrands.map((b) => [b.name, b.ref_id]));

  // Build model entries with resolved brand_ref_id FKs
  const modelEntries = Array.from(entries).map((key) => {
    const [make, model] = key.split("::");
    return { name: model, brandRefId: brandRefMap.get(make)! };
  }).filter((m) => m.brandRefId !== undefined);

  // Insert models in batches using raw SQL for performance
  for (let i = 0; i < modelEntries.length; i += BATCH) {
    const batch = modelEntries.slice(i, i + BATCH);
    const values = batch
      .map((m) => `(gen_random_uuid(), '${m.name.replace(/'/g, "''")}', ${m.brandRefId})`)
      .join(",\n");
    await prisma.$executeRawUnsafe(`
      INSERT INTO models (id, name, brand_ref_id)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);
    console.log(`  Models: ${Math.min(i + BATCH, modelEntries.length)}/${modelEntries.length}`);
  }

  console.log("✅ Models inserted");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });