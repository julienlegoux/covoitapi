
import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "../generated/prisma/client.js";
import { withAccelerate } from "@prisma/extension-accelerate";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is required');
}

const prisma = new PrismaClient({
	accelerateUrl: databaseUrl,
}).$extends(withAccelerate());

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
    const baseModel = cols[cols.length - 1]?.trim().replace(/\r/, "");

    if (!make || !baseModel) continue;

    brandSet.add(make);
    const key = `${make}::${baseModel}`;
    if (!entries.has(key)) {
      entries.add(key);
      modelMap.set(key, make);
    }
  }

  console.log(`Found ${brandSet.size} unique brands, ${entries.size} unique models`);

  // Insert brands
  const BATCH = 500;
  const brands = Array.from(brandSet);
  for (let i = 0; i < brands.length; i += BATCH) {
    const batch = brands.slice(i, i + BATCH);
    const values = batch.map((b) => `(gen_random_uuid(), '${b.replace(/'/g, "''")}')`).join(",\n");
    await prisma.$executeRawUnsafe(`
      INSERT INTO brands (id, name)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);
  }
  console.log("✅ Brands inserted");

  // Fetch brand ref_ids
  const allBrands = await prisma.$queryRawUnsafe<{ name: string; ref_id: number }[]>(`SELECT name, ref_id FROM brands`);
  const brandRefMap = new Map(allBrands.map((b) => [b.name, b.ref_id]));

  // Insert models
  const modelEntries = Array.from(entries).map((key) => {
    const [make, model] = key.split("::");
    return { name: model, brandRefId: brandRefMap.get(make)! };
  }).filter((m) => m.brandRefId !== undefined);

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