import "dotenv/config";
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
  const result = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
  console.log(result)
}

main().finally(() => prisma.$disconnect())