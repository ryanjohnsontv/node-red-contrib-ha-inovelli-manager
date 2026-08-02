// Scoped to src/**/*.ts only - nodes/**/*.js and test/**/*.js are compiled
// output (source of truth is src/), and the editor .html files mix jQuery
// templates with literal Node-RED markup that neither ESLint nor Prettier
// understand well, so they're intentionally left alone.
//
/// <reference types="node" />
// This file sits outside tsconfig.json's project (src/**/*.ts only), so an
// editor's TS language service won't otherwise know `module`/`require` are
// Node globals here - the reference directive above resolves that directly
// instead of just suppressing the check.
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const eslintConfigPrettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = tseslint.config(
  {
    ignores: ["nodes/**/*.js", "test/**/*.js", "**/*.html", "node_modules/**"],
  },
  {
    // This file itself: plain Node CommonJS, not part of the TS project.
    files: ["eslint.config.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  {
    files: ["src/**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: {
      // RED/node/config parameters are intentionally `any` throughout -
      // there's no reliable @types/node-red, and this is the common pattern
      // for node-red-contrib packages.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // `module.exports = function (RED) {...}` and `import x = require(...)`
      // are the standard Node-RED/CommonJS-interop patterns used throughout.
      "@typescript-eslint/no-require-imports": "off",
      // `RED.nodes.createNode(this, config); const node = this;` is the
      // standard Node-RED node constructor pattern.
      "@typescript-eslint/no-this-alias": "off",
    },
  },
  eslintConfigPrettier
);
