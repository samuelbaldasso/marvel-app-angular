import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  globalSetup: 'jest-preset-angular/global-setup',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  moduleNameMapper: {
    '@app/(.*)': '<rootDir>/src/app/$1',
    '@shared/(.*)': '<rootDir>/src/app/shared/$1',
    '@core/(.*)': '<rootDir>/src/app/core/$1',
    '@env/(.*)': '<rootDir>/src/environments/$1'
  },
  collectCoverage: true,
  coverageReporters: ['html', 'lcov', 'text'],
  coverageDirectory: 'coverage'
};

export default config;
