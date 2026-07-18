"use strict";

/* Live smoke test for the Gemini path used by Green Room.
   Reads the key from GEMINI_API_KEY so the secret never leaves your terminal.
   Run:  GEMINI_API_KEY=your_key node scripts/smoke-gemini.js
   Exercises the same request shape app.js uses: systemInstruction + a tool
   input_schema converted via gemini-core.toGeminiSchema + JSON response. */

const core = require("../public/gemini-core.js");

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("Set GEMINI_API_KEY first, e.g.  GEMINI_API_KEY=AIza... node scripts/smoke-gemini.js");
  process.exit(2);
}

const tool = {
  name: "submit_eval",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      overall: { type: "integer", minimum: 1, maximum: 10 },
      verdict: { type: "string" },
    },
    required: ["overall", "verdict"],
  },
};

const model = core.pickGeminiModel(process.env.GEMINI_MODEL);
const url = core.geminiUrl(model);

const body = {
  systemInstruction: { parts: [{ text: "You are a terse interview grader. Return JSON only." }] },
  contents: [{ role: "user", parts: [{ text: 'Rate this answer 1-10 with a one-line verdict: "We use a load balancer for high availability."' }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: core.toGeminiSchema(tool.input_schema),
    maxOutputTokens: 300,
    thinkingConfig: { thinkingBudget: 0 },
  },
};

(async () => {
  const started = Date.now();
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - started;

  if (!resp.ok) {
    let detail = "";
    try { detail = (await resp.json()).error?.message || ""; } catch {}
    console.error(`FAIL  ${model}  HTTP ${resp.status} in ${ms}ms: ${detail || resp.statusText}`);
    process.exit(1);
  }

  const data = await resp.json();
  const cand = data.candidates?.[0];
  const text = cand?.content?.parts?.map(p => p.text).join("") || "";
  if (!text) {
    console.error(`FAIL  ${model}  no content (${cand?.finishReason || "unknown"}) in ${ms}ms`);
    process.exit(1);
  }

  let parsed;
  try { parsed = JSON.parse(text); }
  catch { console.error(`FAIL  ${model}  malformed JSON in ${ms}ms:`, text); process.exit(1); }

  console.log(`OK    ${model}  ${ms}ms`);
  console.log("      overall:", parsed.overall, "| verdict:", parsed.verdict);
})().catch((e) => { console.error("FAIL  network/error:", e.message); process.exit(1); });
