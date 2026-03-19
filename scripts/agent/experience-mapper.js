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

const { chat } = require('./client');

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
    {"label": "MUST USE EXACT LABEL FROM skill_categories list — do NOT rename", "value": "string — comma-separated list of specific tools, services, technologies, and platforms ONLY"},
  ],
  "gaps": ["string array — JD keywords not covered by candidate's experience"],
  "strategy_notes": "string — brief note on overall tailoring strategy"
}

RULES:
- Keep all 6 roles but vary bullet count: most relevant roles get 5-7 bullets, less relevant get 3-4
- Reorder roles if a non-current role is dramatically more relevant (rare)
- The skills_grid MUST use EXACTLY the labels provided in skill_categories — same wording, same order. Do NOT rename, merge, or invent labels.
- Each skills_grid value must be a clean comma-separated list of proper nouns only (product names, service names, technology names, framework names) — NO soft-skill phrases, NO verbs, NO action descriptions
  GOOD: "Azure AI Foundry, Azure OpenAI, AWS Bedrock, Vertex AI, SageMaker"
  BAD: "Cloud and AI transformation, architecture design, end-to-end technical delivery"
- Fill every category from skill_categories; if a category has fewer JD-relevant items, list the candidate's strongest genuine skills for it anyway (5+ items per row)
- Certifications should be ordered with most relevant to JD first
- Be truthful — only select experiences the candidate actually has`;

async function mapExperience(jdAnalysis, candidateProfile, options = {}) {
  const model = options.model || 'claude-sonnet-4-20250514';

  const text = await chat({
    model,
    system: SYSTEM_PROMPT,
    userContent: `## JD Analysis\n\`\`\`json\n${JSON.stringify(jdAnalysis, null, 2)}\n\`\`\`\n\n## Candidate Profile\n\`\`\`yaml\n${JSON.stringify(candidateProfile, null, 2)}\n\`\`\`\n\n## Fixed Skill Category Labels (use EXACTLY these — do not rename)
${(candidateProfile.skill_categories || []).map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\nSelect and rank the most relevant content for this role. For skills_grid, use the exact labels above in the same order, filling each with JD-relevant technologies from the candidate's profile. Return the mapping JSON.`,
    maxTokens: 16384,
  });
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

module.exports = { mapExperience };
