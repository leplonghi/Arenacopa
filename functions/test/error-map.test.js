const test = require("node:test");
const assert = require("node:assert/strict");
const { mapHttpFunctionError } = require("../shared/error-map");

test("mapHttpFunctionError maps bolao edit domain errors away from 500", () => {
  assert.deepEqual(mapHttpFunctionError(new Error("structure_locked")), {
    status: 409,
    error: "structure_locked",
  });
  assert.deepEqual(mapHttpFunctionError(new Error("external_member_exists")), {
    status: 409,
    error: "external_member_exists",
  });
});

test("mapHttpFunctionError keeps unknown errors as 500", () => {
  assert.deepEqual(mapHttpFunctionError(new Error("unexpected_failure")), {
    status: 500,
    error: "unexpected_failure",
  });
});
