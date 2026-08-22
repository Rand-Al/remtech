import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "./rateLimiter.js";

test("allows hits up to the limit inside one window", () => {
  const limiter = createRateLimiter(3, 60_000, () => 1_000);
  assert.equal(limiter.check("ip-1"), true);
  assert.equal(limiter.check("ip-1"), true);
  assert.equal(limiter.check("ip-1"), true);
  assert.equal(limiter.check("ip-1"), false);
  assert.equal(limiter.check("ip-2"), true);
});

test("resets the window after it expires", () => {
  let clock = 1_000;
  const limiter = createRateLimiter(2, 60_000, () => clock);
  assert.equal(limiter.check("ip-1"), true);
  assert.equal(limiter.check("ip-1"), true);
  assert.equal(limiter.check("ip-1"), false);
  clock += 61_000;
  assert.equal(limiter.check("ip-1"), true);
});

test("reports remaining cooldown for a blocked key", () => {
  let clock = 1_000;
  const limiter = createRateLimiter(1, 60_000, () => clock);
  assert.equal(limiter.check("ip-1"), true);
  assert.equal(limiter.check("ip-1"), false);
  clock += 15_000;
  assert.equal(
    limiter.remainingCooldownSeconds("ip-1"),
    45
  );
  assert.equal(limiter.remainingCooldownSeconds("ip-2"), 0);
});
