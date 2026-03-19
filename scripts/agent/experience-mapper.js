/**
 * Agent 2: Experience Mapper
 *
 * Takes JD analysis output + candidate profile YAML and:
 * - Scores each experience bullet against JD keywords (0-100)
 * - Ranks experiences by relevance
 * - Selects top bullets per role (respecting page constraints)
 * - Identifies gaps (JD keywords not covered by any experience)
 * - Suggests which projects/certs to include
 */

const { getClient } = require('./client');

const SYSTEM_PROMPT = `You are a resume strategist. Given a candidate's full experience profile and a JD analysis, 
your job is to select and rank the most relevant content for this specific role.

Return ONLY valid JSON with this schema:
{
  "headline": "string — tailored headline for the resume header (e.g. 'Senior Cloud Solution Architect — Azure AI, Infrastructure & Data')",
  "experience": [
    {
      "original_title": "string — the candidate's actual title",
      "tailored_title": "string — slightly reworded title to better match JD (must stay truthful)",
      "company": "string",
      "dates": "string",
      "selected_bullet_indices": [0, 1, 3],
      "relevance_score": 85
    }
  ],
  "selected_projects": ["string array — project titles to include, max 4"],
  "selected_publications": ["string array — publication titles to include, max 5"],
  "selected_certifications": ["string array — certification names to include, ordered by relevance"],
  "skills_grid": [
    {"label": "string — category name", "value": "string — comma-separated skills, using JD terminology"},
  ],
  "gaps": ["string array — JD keywords not covered by candidate's experience"],
  "strategy_notes": "string — brief note on overall tailoring strategy"
}

RULES:
- Keep all 6 roles but vary bullet count: most relevant roles get 5-7 bullets, less relevant get 3-4
- Reorder roles if a non-current role is dramatically more relevant (rare)
- The skills grid should use JD terminology, not the candidate's original wording
- Certifications should be ordered with most relevant to JD first
- Be truthful — only select experiences the candidate actually has`;

async function mapExperience(jdAnalysis, candidateProfile, options = {}) {
  const client = getClient();
  const model = options.model || 'claude-sonnet-4-20250514';

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `## JD Analysis\n\`\`\`json\n${JSON.stringify(jdAnalysis, null, 2)}\n\`\`\`\n\n## Candidate Profile\n\`\`\`yaml\n${JSON.stringify(candidateProfile, null, 2)}\n\`\`\`\n\nSelect and rank the most relevant content for this role. Return the mapping JSON.` }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

module.exports = { mapExperience };
