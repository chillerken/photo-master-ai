export async function analyzePhoto({ imageBase64, imageType, style, opts }) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, imageType, style, opts })
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    const error = new Error("Your session has expired. Please sign in again.");
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    throw new Error(data.error || "Photo analysis failed. Please try again.");
  }

  if (typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("The AI returned an empty response. Please try again.");
  }

  return data.text;
}
