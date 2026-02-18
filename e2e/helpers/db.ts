/**
 * Standalone PrismaClient for E2E test infrastructure (seeding, cleanup).
 * Uses a standard PrismaClient without the Neon adapter.
 */

import { PrismaClient } from '../../src/infrastructure/database/generated/prisma/client.js';
import argon2 from 'argon2';

const dbUrl =
	process.env.E2E_DATABASE_URL ||
	process.env.DATABASE_URL ||
	'postgresql://test:test@localhost:5433/covoitapi_test';

let prisma: PrismaClient | null = null;

function getClient(): PrismaClient {
	if (!prisma) {
		prisma = new PrismaClient({
			datasources: { db: { url: dbUrl } },
		});
	}
	return prisma;
}

export async function seedAdmin(): Promise<void> {
	const db = getClient();
	const existing = await db.auth.findUnique({
		where: { email: 'admin@e2e.test' },
	});
	if (!existing) {
		const hashedPassword = await argon2.hash('AdminPassword1');
		await db.auth.create({
			data: {
				email: 'admin@e2e.test',
				password: hashedPassword,
				role: 'ADMIN',
				user: {
					create: { firstName: 'Admin', lastName: 'E2E' },
				},
			},
		});
	}
}

export async function cleanDatabase(): Promise<void> {
	const db = getClient();
	// Delete in FK-dependency order (children first)
	await db.$executeRawUnsafe('DELETE FROM "inscriptions"');
	await db.$executeRawUnsafe('DELETE FROM "city_trips"');
	await db.$executeRawUnsafe('DELETE FROM "trips"');
	await db.$executeRawUnsafe('DELETE FROM "cars"');
	await db.$executeRawUnsafe('DELETE FROM "color_models"');
	await db.$executeRawUnsafe('DELETE FROM "models"');
	await db.$executeRawUnsafe('DELETE FROM "drivers"');
	await db.$executeRawUnsafe('DELETE FROM "users"');
	await db.$executeRawUnsafe('DELETE FROM "auths"');
	await db.$executeRawUnsafe('DELETE FROM "colors"');
	await db.$executeRawUnsafe('DELETE FROM "brands"');
	await db.$executeRawUnsafe('DELETE FROM "cities"');
}

export async function disconnect(): Promise<void> {
	await prisma?.$disconnect();
	prisma = null;
}
