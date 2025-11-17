import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		include: ['tests/**/*.test.ts'],
		setupFiles: ['tests/test.setup.ts'],
		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage',
			reporter: ['text', 'html'],
			exclude: ['tests/**', 'vitest.config.ts'],
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './'),
		},
	},
})


