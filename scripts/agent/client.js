/**
 * Shared Anthropic client.
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY — Anthropic API key
 *
 * Usage:
 *   const { getClient } = require('./client');
 *   const client = getClient();
 *   const resp = await client.messages.create({ model, system, messages, max_tokens });
 */

const Anthropic = require('@anthropic-ai/sdk');

let _client;

function getClient() {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error(
      '❌ Missing ANTHROPIC_API_KEY in .env',
    );
    process.exit(1);
  }

  _client = new Anthropic({ apiKey });
  return _client;
}

module.exports = { getClient };
