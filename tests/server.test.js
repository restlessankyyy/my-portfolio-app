/**
 * Simple Server Tests
 * Validates that the Express server works correctly
 */

const http = require('http');
const app = require('../server');

const PORT = 3001; // Use different port for testing
let server;

// Test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('\n🧪 Running Server Tests...\n');
  
  // Start server before tests
  server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      failed++;
    }
  }
  
  // Close server after tests
  server.close();
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// ==================== Tests ====================

test('Health endpoint returns 200', async () => {
  const res = await makeRequest('/health');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

test('Health endpoint returns JSON', async () => {
  const res = await makeRequest('/health');
  const body = JSON.parse(res.body);
  assert(body.status === 'healthy', 'Health status should be healthy');
  assert(body.timestamp, 'Should include timestamp');
});

test('Homepage returns HTML', async () => {
  const res = await makeRequest('/');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.body.toLowerCase().includes('<!doctype html>'), 'Should return HTML');
  assert(res.body.includes('Ankit Raj'), 'Should include name');
});

test('Static CSS is served', async () => {
  const res = await makeRequest('/css/modern-style.css');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.headers['content-type'].includes('text/css'), 'Should serve CSS');
});

test('Static JS is served', async () => {
  const res = await makeRequest('/js/modern-portfolio.js');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

test('Contact API requires fields', async () => {
  const res = await makeRequest('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  const body = JSON.parse(res.body);
  assert(body.success === false, 'Should return success: false');
});

test('Contact API validates email', async () => {
  const res = await makeRequest('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test',
      email: 'invalid-email',
      message: 'Test message',
    }),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  const body = JSON.parse(res.body);
  assert(body.error.toLowerCase().includes('email'), 'Should mention email');
});

test('Unknown routes return index.html (SPA)', async () => {
  const res = await makeRequest('/nonexistent-page');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.body.toLowerCase().includes('<!doctype html>'), 'Should return HTML');
});

// Run tests
runTests();
