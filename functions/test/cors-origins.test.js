const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const indexSource = readFileSync(resolve(__dirname, "../index.js"), "utf8");

test("CORS allows the local Vite origins used by this project", () => {
  for (const origin of [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ]) {
    assert.match(indexSource, new RegExp(`"${origin.replaceAll(".", "\\.")}"`));
  }
});
