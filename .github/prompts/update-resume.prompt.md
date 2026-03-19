---
description: "Add or update a resume HTML template and regenerate its PDF"
---

# Update Resume Template

## Task

Modify a resume HTML template and regenerate the corresponding PDF.

## Steps

1. **Edit the HTML** — Modify the target resume template in `scripts/`:
   - `resume-aws-sa.html` → `public/assets/Profile.pdf`
   - `resume-photo.html` → `public/assets/Profile-Nordic.pdf`
   - `resume-microsoft-csa.html` → `public/assets/Profile-Microsoft-*.pdf`

2. **Key HTML conventions**:
   - Use inline CSS (no external stylesheets)
   - `break-inside: avoid` on `.job` elements to prevent page splits
   - Publication titles must include hyperlinks to Medium/FAUN articles
   - Font: Inter via Google Fonts `@import url()`

3. **Regenerate the PDF**:
   ```bash
   node scripts/generate-pdf-aws-sa.js       # → Profile.pdf
   node scripts/generate-pdf-photo.js         # → Profile-Nordic.pdf
   node scripts/generate-pdf-microsoft-csa.js # → Profile-Microsoft-*.pdf
   ```

4. **Verify** — Open the PDF and confirm:
   - Text is selectable and not garbled
   - No page breaks splitting a job entry
   - Links are clickable

5. **Commit** — Use prefix `docs:` or `fix:` depending on the change type.

## PDF Margins

- AWS resume: `8mm top/bottom`, `0mm left/right`
- Nordic resume: `10mm top/bottom`, `0mm left/right`
