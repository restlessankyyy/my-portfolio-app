const express = require('express');
const path = require('path');
const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Catch all handler: send back index.html for SPA routing
app.get('*', (req, res) => {
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
