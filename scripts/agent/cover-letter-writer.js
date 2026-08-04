/**
 * Agent 5: Cover Letter Writer
 *
 * Takes the same JD analysis + resolved experience mapping used for the
 * resume and drafts a short, specific cover letter. Grounded in the same
 * ENHANCE-only rules as resume-writer.js — this is a draft for the
 * candidate to review, not a final submission.
 */

const { chat } = require('./client');

const SYSTEM_PROMPT = `You are a senior technical recruiter's ghostwriter, drafting a cover letter on behalf of a candidate.

Return ONLY valid JSON with this schema:
{
  "salutation": "string — e.g. 'Dear Hiring Manager,' (no named recipient is known)",
  "paragraphs": ["string array — 3 to 4 paragraphs, ~70-110 words each"]
}

══ CONTENT RULES (MANDATORY) ══
You are given the candidate's real, resolved experience (companies, metrics, technologies) and the JD analysis. Use ONLY facts present in that input.

Paragraph structure:
1. Why this specific role/company, referencing 1-2 concrete things from the JD (team, mission, responsibilities) — not generic flattery.
2. The single strongest matching achievement from the candidate's resolved experience, with its real metric and real company name, tied to what the JD asks for.
3. A second concrete strength — a technology, project, or leadership example from the resolved experience that maps to a JD requirement.
4. A brief, confident closing. Thank them for their consideration.

You MUST NEVER:
• Invent metrics, dates, employers, titles, or technologies not present in the input
• Claim the candidate currently works at, or has ever worked at, the target company unless the resolved experience says so
• State salary expectations, availability/start date, visa/work-authorization status, or willingness to relocate — these are not in the input and must never be guessed
• Use hollow adjectives (passionate, dynamic, innovative, synergy) or generic filler ("I am writing to express my interest")
• Exceed 4 paragraphs or make any paragraph a bare list of keywords

Tone: confident senior practitioner, specific, no fluff. Mirror 1-2 exact phrases from the JD where they genuinely fit.`;

async function writeCoverLetter(jdAnalysis, resolvedMapping, profile, options = {}) {
  const model = options.model || 'claude-sonnet-4-20250514';

  const text = await chat({
    model,
    system: SYSTEM_PROMPT,
    userContent: `## JD Analysis\n\`\`\`json\n${JSON.stringify(jdAnalysis, null, 2)}\n\`\`\`\n\n## Candidate's Resolved Experience (ground truth — real facts only)\n\`\`\`json\n${JSON.stringify(
      {
        headline: resolvedMapping.headline,
        experience: resolvedMapping.experience.map((r) => ({
          title: r.original_title,
          company: r.company_with_location,
          dates: r.dates,
          bullets: r.resolved_bullets,
        })),
        projects: resolvedMapping.resolved_projects,
        strategy_notes: resolvedMapping.strategy_notes,
      },
      null,
      2,
    )}\n\`\`\`\n\n## Candidate\n${profile.name} — ${profile.location}\n\nDraft the cover letter JSON per the rules.`,
    maxTokens: 2048,
  });

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

module.exports = { writeCoverLetter };
