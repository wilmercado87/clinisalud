module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverageFrom: [
    '**/*.ts',
    '!/**/*.d.ts',
    '!seed.ts',
    '!index.ts',
    '!config/database.ts',
    '!__tests__/**',
  ],
  coverageDirectory: '../coverage',
  verbose: true,
  testTimeout: 10000,
};