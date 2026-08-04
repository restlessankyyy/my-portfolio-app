/**
 * Application Kit builder — assembles the per-job "assisted fill" record
 * that bulk-apply.js writes alongside each tailored resume/cover letter.
 *
 * This is intentionally NOT a form-submission payload: it's a review sheet
 * a human uses to fill out an employer's application form by hand (or feed
 * into a form-filling browser extension), then submit themselves. Fields
 * that require a human judgment call or a legal/personal answer are always
 * left null rather than guessed.
 */

function extractKeySkills(resolvedMapping) {
  const values = (resolvedMapping.skills_grid || []).flatMap((row) =>
    (row.value || '').split(',').map((s) => s.trim()).filter(Boolean),
  );
  return Array.from(new Set(values));
}

function buildApplicationKit({ job, profile, jdAnalysis, resolvedMapping, atsScore, coverLetter, resumePath, coverLetterPath, jdSourcePath }) {
  return {
    generated_at: new Date().toISOString(),
    status: 'ready_for_review',
    review_note:
      'Draft only. Review the resume, cover letter, and the fields below, then submit the application yourself on the employer\'s site — nothing here is submitted automatically.',
    job: {
      url: job.url,
      company: jdAnalysis.company || job.company || null,
      role: jdAnalysis.role || job.role || null,
      location: jdAnalysis.location || null,
      seniority: jdAnalysis.seniority || null,
    },
    applicant: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone || null,
      location: profile.location,
      website: profile.website,
      linkedin: profile.linkedin,
      github: profile.github,
    },
    documents: {
      resume_pdf: resumePath,
      cover_letter_pdf: coverLetterPath,
      jd_source_text: jdSourcePath,
    },
    ats_score: atsScore.overall_score,
    ats_missing_keywords: atsScore.missing_keywords,
    key_skills: extractKeySkills(resolvedMapping),
    why_interested_draft: (coverLetter.paragraphs || [])[0] || null,
    // Legally/personally sensitive fields many application forms ask for —
    // deliberately left blank, never inferred by the pipeline.
    fields_needing_human_input: {
      salary_expectations: null,
      work_authorization_status: null,
      earliest_start_date: null,
      willing_to_relocate: null,
    },
  };
}

module.exports = { buildApplicationKit };
