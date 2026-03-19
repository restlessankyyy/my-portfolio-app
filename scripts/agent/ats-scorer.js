/**
 * Agent 4: ATS Scorer
 *
 * Takes the final resume content + JD analysis and:
 * - Scores keyword coverage (0-100)
 * - Identifies missing keywords
 * - Checks for ATS formatting issues
 * - Provides specific feedback for improvement
 * - Returns pass/fail with actionable fix instructions
 */

const { getClient } = require('./client');

const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) scoring engine.

Given a tailored resume and the original JD analysis, score how well the resume matches.

Return ONLY valid JSON with this schema:
{
  "overall_score": 85,
  "breakdown": {
    "keyword_coverage": 90,
    "action_verbs": 85,
    "quantified_achievements": 80,
    "jd_language_match": 88,
    "summary_relevance": 92
  },
  "matched_keywords": ["string array — JD keywords found in the resume"],
  "missing_keywords": ["string array — JD keywords NOT found in the resume"],
  "feedback": [
    {
      "section": "string — which section (summary, experience, skills, etc.)",
      "issue": "string — what's wrong",
      "fix": "string — specific instruction on how to fix it"
    }
  ],
  "pass": true
}

SCORING RULES:
- keyword_coverage: % of JD hard_skills + frameworks + ats_signals found in resume
- action_verbs: % of bullets starting with strong action verbs
- quantified_achievements: % of bullets containing numbers/metrics
- jd_language_match: how closely resume mirrors JD phrasing (not just keywords, but exact phrases)
- summary_relevance: how well the summary addresses the specific role
- overall_score: weighted average (keyword 30%, language 25%, summary 20%, verbs 15%, metrics 10%)
- pass threshold: overall_score >= 80

Be strict. An 85 should mean the resume would genuinely score well in an ATS.`;

async function scoreResume(resumeContent, jdAnalysis, options = {}) {
  const client = getClient();
  const model = options.model || 'claude-sonnet-4-20250514';

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `## JD Analysis\n\`\`\`json\n${JSON.stringify(jdAnalysis, null, 2)}\n\`\`\`\n\n## Resume Content\n\`\`\`json\n${JSON.stringify(resumeContent, null, 2)}\n\`\`\`\n\nScore this resume against the JD. Be strict and specific.` }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

module.exports = { scoreResume };
