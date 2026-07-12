/*
 * aiClient.service.js
 *
 * Shared AI text-generation client. Currently backed by Groq's
 * OpenAI-compatible chat completions endpoint (free tier, no billing
 * required). Both workloadAgent.js and reportingAgent.service.js call
 * generateText() instead of talking to Gemini/Groq directly, so swapping
 * providers in the future only requires editing this one file.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/*
 * generateText(prompt) -> Promise<string|null>
 * Returns the raw text response, or null if AI is not configured/available.
 * Throws on network/API errors so callers can catch + fall back, matching
 * the existing try/catch + fallback pattern already used in both agents.
 */
const MAX_RETRIES = 2; // total attempts = 1 initial + 2 retries = 3
const RETRY_DELAY_MS = 800;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGroq(prompt, apiKey) {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text || null;
}

/*
 * generateText(prompt) -> Promise<string|null>
 * Retries on connection-level failures (timeouts, DNS blips) up to
 * MAX_RETRIES times with backoff, since these are often transient network
 * hiccups. Throws after retries are exhausted so callers can catch + fall
 * back, matching the existing pattern in both agents.
 */
export async function generateText(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGroq(prompt, apiKey);
    } catch (err) {
      lastErr = err;
      const isConnectionIssue =
        err.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
        err.message?.includes("fetch failed") ||
        err.message?.includes("ETIMEDOUT") ||
        err.message?.includes("ENOTFOUND");

      if (!isConnectionIssue || attempt === MAX_RETRIES) break;
      console.warn(`[aiClient] Connection issue, retrying (${attempt + 1}/${MAX_RETRIES})...`);
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastErr;
}