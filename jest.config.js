const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^remark$': '<rootDir>/src/__mocks__/remark.js',
    '^remark-parse$': '<rootDir>/src/__mocks__/remark-parse.js',
    '^unist-util-visit$': '<rootDir>/src/__mocks__/unist-util-visit.js'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(remark|remark-parse|unified|bail|is-plain-obj|trough|vfile|vfile-message|unist-util-stringify-position|mdast-util-from-markdown|mdast-util-to-string|micromark|decode-named-character-reference|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens)/)',
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 