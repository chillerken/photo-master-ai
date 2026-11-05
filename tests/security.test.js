import test from "node:test";
import assert from "node:assert/strict";
import {
  createSessionValue,
  verifySessionValue,
  isSameOrigin,
  takeRateLimit
} from "../lib/server-security.js";

const secret = "test-session-secret-that-is-at-least-32-characters";

test("signed session is accepted before expiry", () => {
  const now = 1_800_000_000_000;
  const value = createSessionValue(secret, now);
  assert.ok(verifySessionValue(value, secret, now));
});

test("expired session is rejected", () => {
  const now = 1_800_000_000_000;
  const value = createSessionValue(secret, now);
  assert.equal(verifySessionValue(value, secret, now + (9 * 60 * 60 * 1000)), null);
});

test("tampered session is rejected", () => {
  const now = 1_800_000_000_000;
  const value = createSessionValue(secret, now);
  const tampered = value.slice(0, -1) + (value.endsWith("0") ? "1" : "0");
  assert.equal(verifySessionValue(tampered, secret, now), null);
});

test("same-origin request is accepted", () => {
  assert.equal(isSameOrigin({
    headers: { origin: "https://photo.example.com", host: "photo.example.com" }
  }), true);
});

test("cross-origin and missing-origin requests are rejected", () => {
  assert.equal(isSameOrigin({
    headers: { origin: "https://attacker.example", host: "photo.example.com" }
  }), false);
  assert.equal(isSameOrigin({ headers: { host: "photo.example.com" } }), false);
});

test("rate limit blocks requests above configured threshold", () => {
  const key = "test-rate-limit-" + Date.now();
  assert.equal(takeRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(takeRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(takeRateLimit(key, 2, 60_000).allowed, false);
});
