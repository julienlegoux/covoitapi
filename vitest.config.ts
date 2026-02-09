import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		exclude: ['node_modules'],
		setupFiles: ['tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			exclude: ['node_modules', '**/*.d.ts', '**/*.config.*', 'tests'],
		},
	},
	resolve: {
		alias: {
			'@/domain': resolve(__dirname, './src/domain'),
			'@/application': resolve(__dirname, './src/application'),
			'@/infrastructure': resolve(__dirname, './src/infrastructure'),
			'@/presentation': resolve(__dirname, './src/presentation'),
			'@/shared': resolve(__dirname, './src/lib/shared'),
		},
	},
});
