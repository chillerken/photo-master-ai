import { createHash, timingSafeEqual } from "node:crypto";
import {
  clearSessionCookie,
  createSessionValue,
  getClientIp,
  getSession,
  isSameOrigin,
  makeSessionCookie,
  parseBody,
  resetRateLimit,
  sendJson,
  takeRateLimit
} from "../lib/server-security.js";

export default function handler(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { authenticated: Boolean(getSession(req)) });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." }, { Allow: "GET, POST" });
    return;
  }

  if (!isSameOrigin(req)) {
    sendJson(res, 403, { error: "Request origin rejected." });
    return;
  }

  const body = parseBody(req);
  const action = body.action;

  if (action === "logout") {
    res.setHeader("Set-Cookie", clearSessionCookie(req));
    sendJson(res, 200, { authenticated: false });
    return;
  }

  if (action !== "login") {
    sendJson(res, 400, { error: "Unsupported authentication action." });
    return;
  }

  const configuredPassword = process.env.APP_ACCESS_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!configuredPassword || configuredPassword.length < 12 ||
      !sessionSecret || sessionSecret.length < 32) {
    sendJson(res, 503, {
      error: "Server authentication is not configured. Set APP_ACCESS_PASSWORD and SESSION_SECRET."
    });
    return;
  }

  const ipHash = createHash("sha256").update(getClientIp(req)).digest("hex");
  const rateKey = "login:" + ipHash;
  const rate = takeRateLimit(rateKey, 5, 15 * 60 * 1000);

  if (!rate.allowed) {
    sendJson(res, 429, { error: "Too many login attempts. Try again later." }, {
      "Retry-After": String(rate.retryAfterSeconds)
    });
    return;
  }

  const suppliedPassword = typeof body.password === "string" ? body.password : "";
  const suppliedHash = createHash("sha256").update(suppliedPassword.slice(0, 256)).digest();
  const configuredHash = createHash("sha256").update(configuredPassword).digest();
  const passwordMatches = timingSafeEqual(suppliedHash, configuredHash);

  if (!passwordMatches || suppliedPassword.length === 0 || suppliedPassword.length > 256) {
    sendJson(res, 401, { error: "Incorrect access password." });
    return;
  }

  resetRateLimit(rateKey);
  const sessionValue = createSessionValue(sessionSecret);
  res.setHeader("Set-Cookie", makeSessionCookie(sessionValue, req));
  sendJson(res, 200, { authenticated: true });
}
