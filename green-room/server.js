'use strict';

const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust the API Gateway / Cloudflare proxy so the rate limiter keys on the
// real client IP (X-Forwarded-For) rather than the proxy address.
app.set('trust proxy', 1);

// Basic hardening: drop the framework fingerprint header.
app.disable('x-powered-by');

// Lightweight security headers on every response. Kept dependency-free (no
// helmet) so the Lambda package stays small and the supply chain minimal.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Rate limit every route as a defense-in-depth backstop behind the edge
// (Cloudflare / API Gateway). Per-instance and best-effort under Lambda, but it
// caps abusive bursts that reach the origin and gates the file-serving routes.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health endpoint used by the CI/CD post-deployment gate and smoke tests.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'green-room',
    time: new Date().toISOString(),
  });
});

// Serve the static single-page app from public/.
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { maxAge: '1h', extensions: ['html'] }));

// SPA fallback: any unmatched GET returns index.html.
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start a listener only when run directly (local dev). Under Lambda the app is
// wrapped by serverless-express and this block does not execute.
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Green Room running on http://localhost:${port}`);
  });
}

module.exports = app;
