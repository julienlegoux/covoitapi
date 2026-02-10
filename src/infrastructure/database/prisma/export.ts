import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/prisma/client.js";
import { writeFileSync } from "fs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

function escapeStr(val: string) {
  return val.replace(/'/g, "''");
}

async function main() {
  const brands = await prisma.brand.findMany();
  const models = await prisma.model.findMany();

  let sql = "-- Brands\n";
  for (const b of brands) {
    sql += `INSERT INTO brands (id, ref_id, name) VALUES ('${escapeStr(b.id)}', ${b.refId}, '${escapeStr(b.name)}');\n`;
  }

  sql += "\n-- Models\n";
  for (const m of models) {
    sql += `INSERT INTO models (id, ref_id, name, brand_ref_id) VALUES ('${escapeStr(m.id)}', ${m.refId}, '${escapeStr(m.name)}', ${m.brandRefId});\n`;
  }

  writeFileSync("export.sql", sql);
  console.log(`Exported ${brands.length} brands and ${models.length} models to export.sql`);
}

main().finally(() => prisma.$disconnect());