const nextJest = require('next/jest');

const createJestConfig = nextJest({
	dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
	testEnvironment: 'jest-environment-jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testMatch: ['**/*.jest.test.[tj]s?(x)'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
	},
	testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
	collectCoverageFrom: [
		'**/*.{ts,tsx}',
		'!**/*.d.ts',
		'!**/node_modules/**',
		'!**/.next/**',
		'!next-env.d.ts',
	],
};

module.exports = createJestConfig(customJestConfig);


