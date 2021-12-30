/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  transformIgnorePatterns: ["/node_modules/(?!monaco-editor).+\\.js$"],
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
  },
};
