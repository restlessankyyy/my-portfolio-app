/**
 * Agent 1: JD Analyzer
 *
 * Extracts structured data from a raw job description:
 * - Keywords (hard skills, tools, frameworks, certifications)
 * - Responsibilities mapped to semantic categories
 * - Required vs preferred qualifications
 * - Tone / seniority signals
 * - Company & role metadata
 */

const { chat } = require('./client');

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst. 
Given a job description, extract structured data that will be used to tailor a resume.

Return ONLY valid JSON with this exact schema:
{
  "company": "string — company name",
  "role": "string — exact job title",
  "seniority": "junior | mid | senior | staff | principal",
  "department": "string — team/org if mentioned",
  "location": "string — location if mentioned",
  "keywords": {
    "hard_skills": ["string array — technologies, tools, frameworks, services mentioned"],
    "soft_skills": ["string array — leadership, communication, etc."],
    "certifications": ["string array — specific certs mentioned or implied"],
    "frameworks": ["string array — methodologies like CAF, WAF, TOGAF, SAFe, etc."]
  },
  "responsibilities": [
    {
      "text": "string — the responsibility as stated",
      "category": "string — one of: architecture, delivery, advisory, ai, security, collaboration, mentoring, technical-excellence"
    }
  ],
  "qualifications": {
    "required": ["string array"],
    "preferred": ["string array"]
  },
  "ats_signals": ["string array — exact phrases an ATS would scan for, e.g. 'architecture design sessions', 'customer success plans'"],
  "tone": "string — describe the tone: e.g. 'strategic, customer-facing, technical leadership'"
}

Be thorough. Extract EVERY keyword, technology, and phrase that an ATS system would look for.
Include both explicit mentions and strongly implied skills.`;

async function analyzeJD(jdText, options = {}) {
  const model = options.model || 'claude-sonnet-4-20250514';

  const text = await chat({
    model,
    system: SYSTEM_PROMPT,
    userContent: `Analyze this job description and extract structured ATS data:\n\n${jdText}`,
    maxTokens: 4096,
  });

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

module.exports = { analyzeJD };
