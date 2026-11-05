import { STYLES, SYSTEM_PROMPT, buildPrompt } from "../src/constants.js";
import {
  getSession,
  isSameOrigin,
  parseBody,
  sendJson,
  takeRateLimit
} from "../lib/server-security.js";

export const config = { maxDuration: 60 };

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidImageSignature(bytes, mimeType) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." }, { Allow: "POST" });
    return;
  }

  if (!isSameOrigin(req)) {
    sendJson(res, 403, { error: "Request origin rejected." });
    return;
  }

  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { error: "Your session has expired. Please sign in again." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, { error: "The server-side Anthropic API key is not configured." });
    return;
  }

  const rate = takeRateLimit("analysis:" + session.id, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    sendJson(res, 429, { error: "Analysis limit reached. Please try again later." }, {
      "Retry-After": String(rate.retryAfterSeconds)
    });
    return;
  }

  const body = parseBody(req);
  const imageBase64 = body.imageBase64;
  const imageType = body.imageType;

  if (typeof imageBase64 !== "string" || imageBase64.length === 0 ||
      imageBase64.length > 4_200_000 ||
      !SUPPORTED_IMAGE_TYPES.has(imageType) ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
    sendJson(res, 400, { error: "Upload a valid JPEG, PNG or WEBP image." });
    return;
  }

  const imageBytes = Buffer.from(imageBase64, "base64");
  if (imageBytes.length === 0 || imageBytes.length > MAX_IMAGE_BYTES ||
      imageBytes.toString("base64") !== imageBase64 ||
      !hasValidImageSignature(imageBytes, imageType)) {
    sendJson(res, 400, { error: "The image is invalid or exceeds the 3 MB processing limit." });
    return;
  }

  const selectedStyle = STYLES.find((item) => item.id === body.style) || STYLES[0];
  const suppliedOptions = body.opts && typeof body.opts === "object" ? body.opts : {};
  const options = {
    prompt: suppliedOptions.prompt !== false,
    variations: suppliedOptions.variations !== false,
    viral: suppliedOptions.viral !== false,
    scores: suppliedOptions.scores !== false
  };

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-opus-4-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageType,
                data: imageBase64
              }
            },
            {
              type: "text",
              text: buildPrompt(selectedStyle.name, options)
            }
          ]
        }]
      }),
      signal: AbortSignal.timeout(55_000)
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    sendJson(res, timedOut ? 504 : 502, {
      error: timedOut ? "The analysis timed out. Please try again." : "The AI service could not be reached."
    });
    return;
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    data = null;
  }

  if (!upstream.ok) {
    console.error("Anthropic request failed with status", upstream.status,
      data?.error?.type || "unknown_error");
    sendJson(res, 502, { error: "The AI provider rejected the request. Check server configuration and try again." });
    return;
  }

  const text = data?.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    sendJson(res, 502, { error: "The AI provider returned an empty response." });
    return;
  }

  sendJson(res, 200, { text });
}
