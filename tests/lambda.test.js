/**
 * Lambda Handler Tests
 * Invokes the Lambda handler with API Gateway HTTP API (v2) events
 */

const { handler } = require('../lambda');

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
  console.log('\n🧪 Running Lambda Handler Tests...\n');

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

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Helper to build an API Gateway HTTP API (payload v2.0) event
function apiGatewayEvent(method, path, host = 'www.ankitraj.cloud') {
  return {
    version: '2.0',
    routeKey: 'ANY /{proxy+}',
    rawPath: path,
    rawQueryString: '',
    headers: { host, accept: '*/*' },
    requestContext: {
      http: { method, path, protocol: 'HTTP/1.1', sourceIp: '127.0.0.1' },
      domainName: host,
      stage: '$default',
      requestId: 'test',
      timeEpoch: Date.now(),
    },
    isBase64Encoded: false,
  };
}

function invoke(method, path, host) {
  return handler(apiGatewayEvent(method, path, host), {
    getRemainingTimeInMillis: () => 30000,
  });
}

function contentLength(res) {
  const key = Object.keys(res.headers || {}).find((k) => k.toLowerCase() === 'content-length');
  return key ? res.headers[key] : undefined;
}

// Tests
test('GET / returns landing page with Content-Length', async () => {
  const res = await invoke('GET', '/');
  assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
  assert(contentLength(res) !== undefined, 'GET should keep Content-Length');
});

// API Gateway's front end returns 502 when a HEAD response carries the GET
// Content-Length alongside an empty body.
for (const path of ['/', '/health', '/landing.html', '/nonexistent-page']) {
  test(`HEAD ${path} returns 200 without Content-Length`, async () => {
    const res = await invoke('HEAD', path);
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(!res.body, 'HEAD should have an empty body');
    assert(contentLength(res) === undefined, `HEAD should not send Content-Length (got ${contentLength(res)})`);
  });
}

test('HEAD keeps other headers', async () => {
  const res = await invoke('HEAD', '/health');
  const type = Object.keys(res.headers).find((k) => k.toLowerCase() === 'content-type');
  assert(type && res.headers[type].includes('application/json'), 'Should keep Content-Type');
});

// Run tests
runTests();
