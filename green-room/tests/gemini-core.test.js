"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../public/gemini-core.js");

const {
  GEMINI_DEFAULT_MODEL,
  GEMINI_MODELS,
  isGeminiKey,
  pickGeminiModel,
  geminiUrl,
  toGeminiSchema,
} = core;

test("isGeminiKey accepts AI Studio keys (AIza prefix)", () => {
  assert.equal(isGeminiKey("AIzaSyExampleKey123"), true);
  assert.equal(isGeminiKey("  AIzaSyExampleKey123  "), true, "trims surrounding whitespace");
});

test("isGeminiKey rejects non-Gemini and empty keys", () => {
  assert.equal(isGeminiKey("sk-ant-abc"), false, "Claude key");
  assert.equal(isGeminiKey("sk-abc"), false, "OpenAI key");
  assert.equal(isGeminiKey(""), false);
  assert.equal(isGeminiKey(null), false);
  assert.equal(isGeminiKey(undefined), false);
  assert.equal(isGeminiKey(12345), false, "non-string");
});

test("pickGeminiModel keeps known models", () => {
  for (const m of GEMINI_MODELS) {
    assert.equal(pickGeminiModel(m), m);
  }
});

test("pickGeminiModel falls back to the default for unknown/invalid input", () => {
  assert.equal(pickGeminiModel("gpt-4o"), GEMINI_DEFAULT_MODEL);
  assert.equal(pickGeminiModel(""), GEMINI_DEFAULT_MODEL);
  assert.equal(pickGeminiModel(undefined), GEMINI_DEFAULT_MODEL);
  assert.equal(pickGeminiModel(null), GEMINI_DEFAULT_MODEL);
});

test("GEMINI_MODELS contains the default model", () => {
  assert.ok(GEMINI_MODELS.includes(GEMINI_DEFAULT_MODEL));
});

test("geminiUrl targets the Generative Language endpoint for the chosen model", () => {
  const url = geminiUrl("gemini-2.5-pro");
  assert.equal(
    url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
  );
});

test("geminiUrl falls back to the default model for unknown models", () => {
  const url = geminiUrl("does-not-exist");
  assert.ok(url.includes(GEMINI_DEFAULT_MODEL));
  assert.ok(url.startsWith("https://generativelanguage.googleapis.com/"));
});

test("toGeminiSchema drops JSON-schema keys Gemini rejects", () => {
  const input = {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "integer", minimum: 1, maximum: 10, description: "1-10" },
    },
    required: ["score"],
  };
  const out = toGeminiSchema(input);
  assert.equal(out.additionalProperties, undefined);
  assert.equal(out.properties.score.minimum, undefined);
  assert.equal(out.properties.score.maximum, undefined);
  // Structure and descriptions are preserved.
  assert.equal(out.type, "object");
  assert.equal(out.properties.score.type, "integer");
  assert.equal(out.properties.score.description, "1-10");
  assert.deepEqual(out.required, ["score"]);
});

test("toGeminiSchema recurses through arrays and nested objects", () => {
  const input = {
    type: "array",
    items: {
      type: "object",
      additionalProperties: true,
      properties: { n: { type: "number", minimum: 0 } },
    },
  };
  const out = toGeminiSchema(input);
  assert.equal(out.items.additionalProperties, undefined);
  assert.equal(out.items.properties.n.minimum, undefined);
  assert.equal(out.items.properties.n.type, "number");
});

test("toGeminiSchema does not mutate the original schema", () => {
  const input = { type: "object", additionalProperties: false, properties: {} };
  toGeminiSchema(input);
  assert.equal(input.additionalProperties, false, "original is untouched");
});
