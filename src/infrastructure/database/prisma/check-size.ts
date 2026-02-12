/**
 * @module check-size
 * Standalone utility script that queries and prints the current PostgreSQL
 * database size in a human-readable format (e.g. "15 MB").
 * Connects via Prisma with the Neon serverless adapter over WebSockets.
 * Useful for monitoring Neon free-tier storage usage.
 *
 * Usage: pnpm tsx src/infrastructure/database/prisma/check-size.ts
 */

import "dotenv/config";
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
 * Executes a raw SQL query using pg_size_pretty to display the
 * current database size in a human-readable format.
 */
async function main() {
  // Raw SQL: pg_size_pretty formats byte count into readable string (e.g. "15 MB")
  const result = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
  console.log(result)
}

main().finally(() => prisma.$disconnect())