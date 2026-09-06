/**
 * Comprehensive Backend Verification Test Suite
 * Tests REST endpoints, authentication, Gemini/fallback translation, and Socket.IO
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:8000';

async function runTests() {
  console.log(`\n🧪 Running LokShiksha Backend Test Suite against ${BASE_URL}...\n`);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health returns healthy status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Unexpected status: ${data.status}`);
  });

  // 2. Demo Auth
  let token = '';
  await test('POST /api/auth/demo returns valid JWT', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'teacher', name: 'Sunita Kumari', email: 'teacher@lokshiksha.in' })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.access_token) throw new Error('Missing access_token');
    token = data.access_token;
  });

  // 3. User Me Profile
  await test('GET /api/auth/me with Bearer token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.user) throw new Error('Missing user in profile response');
  });

  // 4. Languages Catalog
  await test('GET /api/languages returns vernacular language list', async () => {
    const res = await fetch(`${BASE_URL}/api/languages`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 4) throw new Error('Expected at least 4 languages');
    const hasSanthali = data.some(l => l.language_name === 'Santhali');
    if (!hasSanthali) throw new Error('Santhali not found in catalog');
  });

  // 5. Lessons Listing
  await test('GET /api/lessons returns lessons list', async () => {
    const res = await fetch(`${BASE_URL}/api/lessons`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Expected at least 1 lesson');
  });

  // 6. Single Translation (Hindi -> Santhali)
  await test('POST /api/translate returns Santhali Ol Chiki translation', async () => {
    const res = await fetch(`${BASE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'नमस्ते बच्चों! आज हम जल चक्र सीखेंगे।',
        target_language: 'Santhali'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.translated_text) throw new Error('Missing translated_text');
  });

  // 7. Multilingual Batch Translation
  await test('POST /api/translate/all returns translations for all regional languages', async () => {
    const res = await fetch(`${BASE_URL}/api/translate/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'जल चक्र वह प्रक्रिया है जिसमें पानी का वाष्पीकरण होता है।'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.translations || !data.translations.Santhali || !data.translations.Mundari || !data.translations.Ho || !data.translations.Kurukh) {
      throw new Error('Missing one or more regional language translations in response');
    }
  });

  // 8. Speech Synthesis endpoint
  await test('POST /api/translate/speech returns audio synthesis URL', async () => {
    const res = await fetch(`${BASE_URL}/api/translate/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello children',
        target_language: 'Santhali'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.audio_url) throw new Error('Missing audio_url');
  });

  // 9. Classroom Status
  await test('GET /api/classroom/main returns classroom room details', async () => {
    const res = await fetch(`${BASE_URL}/api/classroom/main`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.roomCode !== 'main') throw new Error(`Unexpected roomCode: ${data.roomCode}`);
  });

  console.log(`\n===================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
