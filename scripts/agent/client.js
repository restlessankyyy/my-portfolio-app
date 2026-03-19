/**
 * Unified AI client — supports Microsoft Foundry (Azure OpenAI) and Anthropic.
 *
 * Provider selection (auto-detected by model name prefix):
 *   azure     — gpt-* / o1 / o3 / o4 models  →  AzureOpenAI via Microsoft Foundry
 *   anthropic — claude-* models               →  Anthropic Messages API
 *
 * Environment variables:
 *   AZURE_OPENAI_ENDPOINT    — Azure AI Foundry endpoint URL  (required for gpt/o-series models)
 *   AZURE_OPENAI_API_KEY     — Azure API key
 *   AZURE_OPENAI_API_VERSION — API version (default: 2024-12-01-preview)
 *   ANTHROPIC_API_KEY        — Anthropic API key             (required for claude-* models)
 *
 * Usage:
 *   const { chat } = require('./client');
 *   const text = await chat({ model, system, userContent, maxTokens });
 */

const { AzureOpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

let _azure = null;
let _anthropic = null;

function detectProvider(model) {
  if (
    model.startsWith('gpt-') ||
    model.startsWith('o1') ||
    model.startsWith('o3') ||
    model.startsWith('o4')
  ) {
    return 'azure';
  }
  return 'anthropic';
}

function getAzureClient() {
  if (_azure) return _azure;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!endpoint || !apiKey) {
    console.error(
      '❌ Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY — required for GPT/o-series models via Microsoft Foundry',
    );
    process.exit(1);
  }
  _azure = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
  });
  return _azure;
}

function getAnthropicClient() {
  if (_anthropic) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing ANTHROPIC_API_KEY — required for Claude models');
    process.exit(1);
  }
  _anthropic = new Anthropic({ apiKey });
  return _anthropic;
}

/**
 * Unified chat call — auto-routes to Azure Foundry or Anthropic.
 * @param {object} opts
 * @param {string} opts.model       - Model / deployment name
 * @param {string} opts.system      - System prompt
 * @param {string} opts.userContent - User message
 * @param {number} [opts.maxTokens=4096]
 * @returns {Promise<string>}       - Raw text response
 */
async function chat({ model, system, userContent, maxTokens = 4096 }) {
  const provider = detectProvider(model);

  if (provider === 'azure') {
    const client = getAzureClient();
    const resp = await client.chat.completions.create({
      model,
      max_completion_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
    });
    return resp.choices[0].message.content;
  }

  // anthropic
  const client = getAnthropicClient();
  const resp = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  return resp.content[0].text;
}

// Legacy shim — agents can still call getClient() for backward compat
function getClient() {
  return {
    messages: {
      create: async ({ model, max_tokens, system, messages }) =>
        chat({ model, system, userContent: messages[0].content, maxTokens: max_tokens }).then(
          (text) => ({ content: [{ text }] }),
        ),
    },
  };
}

module.exports = { chat, getClient };
