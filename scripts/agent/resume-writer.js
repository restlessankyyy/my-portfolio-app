/**
 * Agent 3: Resume Writer
 *
 * Takes the experience mapping + candidate profile + JD analysis and:
 * - Rewrites bullet points using JD language/terminology
 * - Generates a tailored professional summary
 * - Ensures strong action verbs lead every bullet
 * - Weaves ATS keywords naturally into content
 * - Outputs structured data ready for the Handlebars template
 */

const { getClient } = require('./client');

const SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS-optimized, senior technical resumes.

Given a candidate profile, JD analysis, and experience mapping, produce the final resume content.

Return ONLY valid JSON with this schema:
{
  "summary": "string — 3-4 line professional summary tailored to the JD. Mirror JD terminology. Include metrics.",
  "experience": [
    {
      "title": "string — the tailored job title",
      "company": "string — company name (use &amp; for ampersands in HTML)",
      "dates": "string",
      "bullets": ["string array — rewritten bullet points using JD language"]
    }
  ],
  "projects": [
    {
      "title": "string — project title",
      "description": "string — 2 line description using JD-relevant technology names"
    }
  ],
  "publications": [
    {
      "title": "string",
      "url": "string",
      "description": "string"
    }
  ]
}

WRITING RULES:
1. Start EVERY bullet with a strong action verb: Led, Designed, Architected, Delivered, Built, Drove, Established, Accelerated, Owned, Resolved
2. Mirror JD phrases EXACTLY where truthful (e.g., if JD says "architecture design sessions", use that exact phrase)
3. Quantify everything possible — numbers, percentages, scale
4. Keep bullets concise: 1-2 lines max
5. The summary must feel like it was written FOR this specific role
6. Use HTML entities for special chars: &amp; for &, &rarr; for →
7. Do NOT fabricate experience — only reframe existing bullets using JD language
8. Prioritize JD's ATS signals in bullet placement (most important keywords in first bullets of each role)`;

async function writeResume(jdAnalysis, experienceMapping, candidateProfile, options = {}) {
  const client = getClient();
  const model = options.model || 'claude-sonnet-4-20250514';

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `## JD Analysis\n\`\`\`json\n${JSON.stringify(jdAnalysis, null, 2)}\n\`\`\`\n\n## Experience Mapping\n\`\`\`json\n${JSON.stringify(experienceMapping, null, 2)}\n\`\`\`\n\n## Candidate Profile\n\`\`\`json\n${JSON.stringify(candidateProfile, null, 2)}\n\`\`\`\n\nWrite the final resume content. Use the mapping to select bullets, then REWRITE them using JD terminology. Return the JSON.` }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

module.exports = { writeResume };
