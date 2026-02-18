/**
 * E2E test server — starts the Hono app on a real HTTP port using @hono/node-server.
 *
 * Key technique: DI container override.
 * 1. Set env vars BEFORE any app imports (prevents constructor throws)
 * 2. Dynamically import the app (triggers container.ts side effects with lazy Neon adapter)
 * 3. Override TOKENS.PrismaClient with a standard PrismaClient (no Neon adapter)
 * 4. Serve on a configurable port
 */

// Step 1: Environment variables — must be set BEFORE the app is imported
const port = Number(process.env.E2E_PORT) || 3333;
const dbUrl =
	process.env.E2E_DATABASE_URL ||
	process.env.DATABASE_URL ||
	'postgresql://test:test@localhost:5433/covoitapi_test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = dbUrl;
process.env.CACHE_ENABLED = 'false';
process.env.JWT_SECRET =
	process.env.JWT_SECRET || 'e2e-test-secret-key-at-least-32-characters-long!';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.UPSTASH_REDIS_REST_URL =
	process.env.UPSTASH_REDIS_REST_URL || 'https://fake.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN =
	process.env.UPSTASH_REDIS_REST_TOKEN || 'fake-token';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_fake_e2e_key';
process.env.RESEND_FROM_EMAIL =
	process.env.RESEND_FROM_EMAIL || 'test@covoitapi.test';

// Step 2: Import the app — triggers DI container initialization
// PrismaNeon adapter is created but connection is lazy (never actually connects)
import 'reflect-metadata';
import { serve } from '@hono/node-server';
import { container } from 'tsyringe';
import { TOKENS } from '../src/lib/shared/di/tokens.js';
import { PrismaClient } from '../src/infrastructure/database/generated/prisma/client.js';

// The app import MUST come after env vars are set and after we import container/tokens
const { default: app } = await import('../src/index.js');

// Step 3: Override the PrismaClient in the DI container
// Replace the PrismaNeon-backed client with a standard PrismaClient
const prismaClient = new PrismaClient({ datasourceUrl: dbUrl });
container.registerInstance(TOKENS.PrismaClient, prismaClient);

// Step 4: Start the HTTP server
const server = serve({ fetch: app.fetch, port }, () => {
	console.log(`E2E server listening on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('E2E server shutting down...');
	prismaClient.$disconnect();
	server.close();
});

process.on('SIGINT', () => {
	console.log('E2E server shutting down...');
	prismaClient.$disconnect();
	server.close();
});
