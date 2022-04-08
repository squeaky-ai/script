module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  globals: {
    SESSION_CUT_OFF_MS: 5000,
    WEB_HOST: 'http://localhost',
    API_SERVER_HOST: 'http://localhost',
    WEBSOCKET_SERVER_HOST: 'ws://localhost',
  },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
};
