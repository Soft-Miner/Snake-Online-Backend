module.exports = {
  coveragePathIgnorePatterns: ['/node_modules/', '/src/database/migrations/'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  roots: ['<rootDir>/src/'],
};
