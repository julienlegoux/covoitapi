/**
 * @module export
 * Standalone script that exports brand and model data from the Neon PostgreSQL
 * database into a SQL file (export.sql) containing INSERT statements.
 * Connects via Prisma with the Neon serverless adapter over WebSockets.
 * Intended to be run directly via `tsx` or `ts-node`.
 *
 * Usage: pnpm tsx src/infrastructure/database/prisma/export.ts
 */

import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/prisma/client.js";
import { writeFileSync } from "fs";

// Read DATABASE_URL from environment (loaded by dotenv)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure Neon serverless adapter with WebSocket support
neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

/**
 * Escapes single quotes in SQL string values to prevent injection.
 * @param val - The raw string to escape.
 * @returns The escaped string safe for SQL INSERT values.
 */
function escapeStr(val: string) {
  return val.replace(/'/g, "''");
}

/**
 * Fetches all brands and models from the database and writes them
 * as SQL INSERT statements to export.sql in the working directory.
 */
async function main() {
  const brands = await prisma.brand.findMany();
  const models = await prisma.model.findMany();

  // Generate INSERT statements for brands
  let sql = "-- Brands\n";
  for (const b of brands) {
    sql += `INSERT INTO brands (id, ref_id, name) VALUES ('${escapeStr(b.id)}', ${b.refId}, '${escapeStr(b.name)}');\n`;
  }

  // Generate INSERT statements for models with brand FK
  sql += "\n-- Models\n";
  for (const m of models) {
    sql += `INSERT INTO models (id, ref_id, name, brand_ref_id) VALUES ('${escapeStr(m.id)}', ${m.refId}, '${escapeStr(m.name)}', ${m.brandRefId});\n`;
  }

  writeFileSync("export.sql", sql);
  console.log(`Exported ${brands.length} brands and ${models.length} models to export.sql`);
}

main().finally(() => prisma.$disconnect());