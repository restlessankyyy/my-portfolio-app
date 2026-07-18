/* Green Room: Gemini core helpers.
   Pure, dependency-free logic shared by the browser app (app.js) and the
   Node test suite. Loads as a UMD-ish module: attaches to window.GreenRoomCore
   in the browser and to module.exports under Node. No DOM, no network here. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.GreenRoomCore = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Gemini is the only provider: it has a real free tier, so every user runs
  // on their own free quota with just an AI Studio key (no card, no cost to us).
  const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash";
  const GEMINI_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ];

  // AI Studio (Gemini) keys start with "AIza". Used to validate before a
  // session so the user is not surprised by a silent auth failure mid-answer.
  function isGeminiKey(key) {
    return typeof key === "string" && key.trim().startsWith("AIza");
  }

  // Only allow known models; anything else falls back to the safe default.
  function pickGeminiModel(model) {
    return GEMINI_MODELS.includes(model) ? model : GEMINI_DEFAULT_MODEL;
  }

  function geminiUrl(model) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${pickGeminiModel(model)}:generateContent`;
  }

  // Convert our JSON-schema tool definition to Gemini's responseSchema dialect
  // (drop additionalProperties / minimum / maximum, keep structure + descriptions).
  function toGeminiSchema(node) {
    if (Array.isArray(node)) return node.map(toGeminiSchema);
    if (node && typeof node === "object") {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (["additionalProperties", "minimum", "maximum"].includes(k)) continue;
        out[k] = toGeminiSchema(v);
      }
      return out;
    }
    return node;
  }

  return {
    GEMINI_DEFAULT_MODEL,
    GEMINI_MODELS,
    isGeminiKey,
    pickGeminiModel,
    geminiUrl,
    toGeminiSchema,
  };
});
