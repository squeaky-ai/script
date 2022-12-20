module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  globals: {
    SESSION_CUT_OFF_MS: 5000,
    PROTOCOL: 'http',
    HOST: 'localhost',
  },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
};
