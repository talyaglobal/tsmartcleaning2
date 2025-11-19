import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		include: [
			'tests/**/*.test.ts',
			'tests/unit/**/*.test.ts',
			'tests/integration/**/*.test.ts',
			'tests/performance/**/*.test.ts',
		],
		setupFiles: ['tests/test.setup.ts'],
		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage',
			reporter: ['text', 'html', 'json'],
			exclude: [
				'tests/**',
				'vitest.config.ts',
				'playwright.config.ts',
				'**/*.spec.ts',
			],
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './'),
		},
	},
})


