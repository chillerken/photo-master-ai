import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "pmai_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const rateLimits = new Map();

export function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  for (const [name, value] of Object.entries(extraHeaders)) {
    res.setHeader(name, value);
  }
  res.end(JSON.stringify(payload));
}

export function parseBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
  if (typeof raw !== "string" || raw.length === 0) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function isSameOrigin(req) {
  const origin = req.headers?.origin;
  const hostHeader = req.headers?.["x-forwarded-host"] || req.headers?.host;
  if (!origin || !hostHeader) return false;

  try {
    const expectedHost = String(hostHeader).split(",")[0].trim().toLowerCase();
    const actualHost = new URL(origin).host.toLowerCase();
    return actualHost === expectedHost;
  } catch {
    return false;
  }
}

export function getClientIp(req) {
  // Prefer the platform-provided client IP header over a client-supplied
  // forwarded-for chain when the app runs behind Vercel's trusted proxy.
  const realIp = req.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();

  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export function createSessionValue(secret, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const nonce = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", secret)
    .update("photo-master-session:" + expiresAt + ":" + nonce)
    .digest("hex");
  return String(expiresAt) + "." + nonce + "." + signature;
}

export function verifySessionValue(value, secret, now = Date.now()) {
  if (!value || !secret || typeof value !== "string") return null;

  const parts = value.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) ||
      !/^[a-f0-9]{32}$/i.test(parts[1]) || !/^[a-f0-9]{64}$/i.test(parts[2])) {
    return null;
  }

  const expiresAt = Number(parts[0]);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds) return null;
  if (expiresAt > nowSeconds + SESSION_TTL_SECONDS + 60) return null;

  const expected = createHmac("sha256", secret)
    .update("photo-master-session:" + expiresAt + ":" + parts[1])
    .digest();
  const supplied = Buffer.from(parts[2], "hex");

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return null;
  }

  return {
    expiresAt,
    id: createHash("sha256").update(value).digest("hex")
  };
}

export function readCookie(req, name = COOKIE_NAME) {
  const header = req.headers?.cookie;
  if (typeof header !== "string") return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

export function getSession(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return verifySessionValue(readCookie(req), secret);
}

function cookieSecuritySuffix(req) {
  const forwardedProto = String(req.headers?.["x-forwarded-proto"] || "").split(",")[0].trim();
  const secure = process.env.NODE_ENV === "production" || forwardedProto === "https";
  return secure ? "; Secure" : "";
}

export function makeSessionCookie(value, req) {
  return COOKIE_NAME + "=" + value +
    "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + SESSION_TTL_SECONDS +
    cookieSecuritySuffix(req);
}

export function clearSessionCookie(req) {
  return COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" +
    cookieSecuritySuffix(req);
}

export function takeRateLimit(key, limit, windowMs, now = Date.now()) {
  let entry = rateLimits.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimits.set(key, entry);
  }

  entry.count += 1;

  if (rateLimits.size > 2000) {
    for (const [storedKey, storedValue] of rateLimits.entries()) {
      if (now >= storedValue.resetAt) rateLimits.delete(storedKey);
    }
  }

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
  };
}

export function resetRateLimit(key) {
  rateLimits.delete(key);
}
