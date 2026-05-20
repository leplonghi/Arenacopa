const test = require("node:test");
const assert = require("node:assert/strict");
const { getRuntimeConfig, readLegacyFunctionsConfig } = require("../shared/runtime-config");

test("readLegacyFunctionsConfig falls back when firebase-functions v7 rejects config", () => {
  const config = readLegacyFunctionsConfig({
    config() {
      throw new Error("functions.config() has been removed in firebase-functions v7.");
    },
  });

  assert.deepEqual(config, {});
});

test("getRuntimeConfig uses environment values when legacy config is unavailable", () => {
  const previousSiteUrl = process.env.SITE_URL;
  const previousSeedToken = process.env.SEED_TOKEN;
  const previousAdminSecret = process.env.ADMIN_SECRET;

  process.env.SITE_URL = "https://example.test";
  process.env.SEED_TOKEN = "seed-from-env";
  process.env.ADMIN_SECRET = "admin-from-env";

  try {
    const config = getRuntimeConfig({
      config() {
        throw new Error("functions.config() has been removed in firebase-functions v7.");
      },
    });

    assert.equal(config.siteUrl, "https://example.test");
    assert.equal(config.seedToken, "seed-from-env");
    assert.equal(config.adminSecret, "admin-from-env");
  } finally {
    if (previousSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previousSiteUrl;

    if (previousSeedToken === undefined) delete process.env.SEED_TOKEN;
    else process.env.SEED_TOKEN = previousSeedToken;

    if (previousAdminSecret === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previousAdminSecret;
  }
});
