import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  extensionsToTreatAsEsm: ['.ts'],
  injectGlobals: true,
  moduleNameMapper: {
    '^(.*)/utils/db$': '<rootDir>/api/__tests__/mocks/dbMock',
    '^(.*)/utils/db\\.js$': '<rootDir>/api/__tests__/mocks/dbMock',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
    }],
  },
  setupFiles: ['<rootDir>/api/__tests__/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/api/__tests__/setupAfterEnv.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'api/**/*.ts',
    '!api/index.ts',
    '!api/server.ts',
    '!api/__tests__/**',
    '!api/data/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};

export default config;
