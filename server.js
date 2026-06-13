const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

// Behind API Gateway / Lambda, trust the first proxy hop so the rate
// limiter keys on the real client IP (X-Forwarded-For) rather than the proxy.
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Parse JSON bodies with size limit to prevent large-payload DoS
app.use(express.json({ limit: '10kb' }));

// General rate limit for page/file-serving routes to bound abuse of the
// filesystem-backed handlers (landing page + SPA catch-all).
const pageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

// Root domain landing page: ankitraj.cloud / www.ankitraj.cloud
// profile.ankitraj.cloud serves the full portfolio via static + SPA catch-all below
const ROOT_HOSTS = ['ankitraj.cloud', 'www.ankitraj.cloud'];

app.get('/', pageLimiter, (req, res, next) => {
  const host = (req.hostname || '').split(':')[0];
  if (ROOT_HOSTS.includes(host)) {
    return res.sendFile(path.join(__dirname, 'public', 'landing.html'));
  }
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Rate limit contact form — 5 requests per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

// Escape HTML to prevent injection in email templates
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Contact form API endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please fill in all fields' 
      });
    }

    // Email validation. Length guard + non-backtracking regex (domain labels
    // exclude dots so quantifiers cannot overlap) to avoid polynomial ReDoS.
    const emailRegex = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
    if (typeof email !== 'string' || email.length > 254 || !emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    // Sanitise user input to prevent HTML injection in email template
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    // Check if running in Lambda (AWS environment)
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // Use AWS SES to send email
      const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
      
      const sesClient = new SESClient({ region: process.env.AWS_REGION || 'eu-north-1' });
      
      const emailParams = {
        Source: '"Ankit Raj Portfolio" <contact@ankitraj.cloud>', // Domain-verified sender (DKIM signed)
        Destination: {
          ToAddresses: ['rajankit749@gmail.com']
        },
        Message: {
          Subject: {
            Data: `New Contact from ${safeName} - ankitraj.cloud`,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📬 New Portfolio Contact</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6366f1;">👤 Name:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          ${safeName}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6366f1;">📧 Email:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="mailto:${safeEmail}" style="color: #6366f1;">${safeEmail}</a>
        </td>
      </tr>
    </table>
    
    <div style="margin-top: 20px;">
      <strong style="color: #6366f1;">💬 Message:</strong>
      <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #6366f1;">
        ${safeMessage.replace(/\n/g, '<br>')}
      </div>
    </div>
  </div>
  
  <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      Sent from <a href="https://www.ankitraj.cloud" style="color: #6366f1;">ankitraj.cloud</a> contact form
    </p>
  </div>
</body>
</html>
              `,
              Charset: 'UTF-8'
            },
            Text: {
              Data: `New Portfolio Contact\n\n👤 Name: ${safeName}\n📧 Email: ${safeEmail}\n\n💬 Message:\n${safeMessage}\n\n---\nSent from ankitraj.cloud`,
              Charset: 'UTF-8'
            }
          }
        },
        ReplyToAddresses: [email]
      };

      await sesClient.send(new SendEmailCommand(emailParams));
      
      console.log(`Contact form email sent from ${name} (${email})`);
      return res.json({ 
        success: true, 
        message: 'Message sent successfully!' 
      });
    } else {
      // Local development - just log the message
      console.log('📧 Contact Form Submission (Local Dev):');
      console.log(`   Name: ${name}`);
      console.log(`   Email: ${email}`);
      console.log(`   Message: ${message}`);
      
      return res.json({ 
        success: true, 
        message: 'Message received (local dev mode)' 
      });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send message. Please try again later.' 
    });
  }
});

// Catch all handler: send back index.html for SPA routing
app.get('*', pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export the app for Lambda, but also support local development
if (require.main === module) {
  // Running locally
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Portfolio server running on port ${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
  });
}

module.exports = app;

