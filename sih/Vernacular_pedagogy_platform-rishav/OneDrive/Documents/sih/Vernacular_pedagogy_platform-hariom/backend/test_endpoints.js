import { Blob } from 'buffer';

// Comprehensive endpoint tester for LokShiksha Vernacular Pedagogy Backend
const BASE_URL = 'http://localhost:8000';

async function testAll() {
  const results = [];
  let teacherToken = null;
  let studentToken = null;

  async function runTest(category, name, fn) {
    try {
      const res = await fn();
      results.push({ category, name, pass: true, ...res });
    } catch (err) {
      results.push({ category, name, pass: false, error: err.message, status: err.status || 'ERR' });
    }
  }

  // Helper fetcher
  async function api(path, options = {}) {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const headers = { ...(options.headers || {}) };
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers, redirect: 'manual' });
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    if (!res.ok && res.status !== 302) {
      const err = new Error(`HTTP ${res.status}: ${typeof data === 'string' ? data.slice(0, 100) : JSON.stringify(data)}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return { status: res.status, data, headers: res.headers };
  }

  console.log('--- 1. Testing Root & Health ---');
  await runTest('System', 'GET /', async () => {
    const r = await api('/');
    return { status: r.status, name: r.data.name };
  });

  await runTest('System', 'GET /auth/google', async () => {
    const r = await api('/auth/google');
    return { status: r.status };
  });

  await runTest('System', 'GET /auth/google/callback', async () => {
    const r = await api('/auth/google/callback');
    return { status: r.status };
  });

  await runTest('System', 'GET /api/health', async () => {
    const r = await api('/api/health');
    return { status: r.status, healthy: r.data.status, db: r.data.database?.isConnected };
  });

  console.log('--- 2. Testing Auth Endpoints ---');
  await runTest('Auth', 'POST /api/auth/demo (teacher)', async () => {
    const r = await api('/api/auth/demo', { method: 'POST', body: { role: 'teacher' } });
    teacherToken = r.data.access_token;
    return { status: r.status, role: r.data.role, hasToken: !!teacherToken };
  });

  await runTest('Auth', 'POST /api/auth/demo-login (student)', async () => {
    const r = await api('/api/auth/demo-login', { method: 'POST', body: { role: 'student' } });
    studentToken = r.data.access_token;
    return { status: r.status, role: r.data.role, hasToken: !!studentToken };
  });

  await runTest('Auth', 'POST /api/auth/login (teacher direct)', async () => {
    const r = await api('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'teacher@lokshiksha.in', password: 'teacher@2026', role: 'teacher' }
    });
    return { status: r.status, role: r.data.role };
  });

  await runTest('Auth', 'POST /api/auth/login (student direct)', async () => {
    const r = await api('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'student@lokshiksha.in', password: 'student@2026', role: 'student' }
    });
    return { status: r.status, role: r.data.role };
  });

  await runTest('Auth', 'POST /api/auth/register (student)', async () => {
    const rand = Math.floor(Math.random() * 10000);
    const r = await api('/api/auth/register', {
      method: 'POST',
      body: {
        name: `Test Student ${rand}`,
        email: `student_${rand}@lokshiksha.in`,
        password: 'student@2026',
        role: 'student',
        preferredLanguage: 'Santhali'
      }
    });
    return { status: r.status, email: r.data.user?.email, role: r.data.role };
  });

  await runTest('Auth', 'POST /api/auth/verify-otp', async () => {
    const r = await api('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: 'teacher@lokshiksha.in' }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Auth', 'POST /api/auth/resend-otp', async () => {
    const r = await api('/api/auth/resend-otp', { method: 'POST', body: {} });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Auth', 'GET /api/auth/me (Teacher)', async () => {
    const r = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    return { status: r.status, email: r.data.user.email, role: r.data.user.role };
  });

  await runTest('Auth', 'POST /api/auth/logout', async () => {
    const r = await api('/api/auth/logout', { method: 'POST' });
    return { status: r.status, message: r.data.message };
  });

  await runTest('Auth', 'GET /api/auth/google (redirect)', async () => {
    const r = await api('/api/auth/google');
    return { status: r.status };
  });

  await runTest('Auth', 'GET /api/auth/google/callback (JSON accept)', async () => {
    const r = await api('/api/auth/google/callback?state=' + Buffer.from(JSON.stringify({ role: 'teacher' })).toString('base64'), {
      headers: { Accept: 'application/json' }
    });
    return { status: r.status, role: r.data.user.role };
  });

  console.log('--- 3. Testing Language Endpoints ---');
  await runTest('Languages', 'GET /api/languages', async () => {
    const r = await api('/api/languages');
    return { status: r.status, count: r.data.length, languages: r.data.map(l => l.name || l.language_name) };
  });

  console.log('--- 4. Testing Lesson Endpoints ---');
  let firstLessonId = null;
  await runTest('Lessons', 'GET /api/lessons', async () => {
    const r = await api('/api/lessons');
    firstLessonId = r.data[0]?.id || 'lesson-101';
    return { status: r.status, count: r.data.length, sampleId: firstLessonId };
  });

  await runTest('Lessons', `GET /api/lessons/:id (${firstLessonId})`, async () => {
    const r = await api(`/api/lessons/${firstLessonId}`);
    return { status: r.status, title: r.data.title };
  });

  await runTest('Lessons', `POST /api/lessons/:id/complete`, async () => {
    const r = await api(`/api/lessons/${firstLessonId}/complete`, {
      method: 'POST',
      body: { studentId: 'student-demo' }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Lessons', `GET /api/lessons/:id/audio`, async () => {
    const r = await api(`/api/lessons/${firstLessonId}/audio`);
    return { status: r.status, audioLanguages: Object.keys(r.data.audio || {}) };
  });

  await runTest('Lessons', 'POST /api/lessons/simplify', async () => {
    const r = await api('/api/lessons/simplify', {
      method: 'POST',
      body: { text: 'Photosynthesis is the process by which green plants make food.', gradeLevel: 'Class 5' }
    });
    return { status: r.status, simplified: !!r.data.simplified_text };
  });

  await runTest('Lessons', `POST /api/lessons/:id/translations`, async () => {
    const r = await api(`/api/lessons/${firstLessonId}/translations`, {
      method: 'POST',
      body: { target_language: 'Santhali' }
    });
    return { status: r.status, translated: !!r.data.translated_text };
  });

  await runTest('Lessons', `GET /api/lessons/:id/translations/:targetLanguage`, async () => {
    const r = await api(`/api/lessons/${firstLessonId}/translations/Mundari`);
    return { status: r.status, language: r.data.language };
  });

  await runTest('Lessons', 'POST /api/lessons/upload (via sourceText)', async () => {
    const r = await api('/api/lessons/upload', {
      method: 'POST',
      body: {
        title: 'Soil and Agriculture',
        subject: 'Environmental Science',
        gradeLevel: 'Class 5',
        sourceText: 'Soil is the uppermost layer of Earth where plants grow and absorb nutrients.'
      }
    });
    return { status: r.status, id: r.data.id, title: r.data.title };
  });

  console.log('--- 5. Testing Translation & Speech ---');
  await runTest('Translate', 'GET /api/translate/common-words', async () => {
    const r = await api('/api/translate/common-words');
    return { status: r.status, total: r.data.total };
  });

  await runTest('Translate', 'POST /api/translate (Single)', async () => {
    const r = await api('/api/translate', {
      method: 'POST',
      body: { text: 'Water is life', target_language: 'Santhali', source_language: 'English' }
    });
    return { status: r.status, translated: r.data.translated_text };
  });

  await runTest('Translate', 'POST /api/translate/all', async () => {
    const r = await api('/api/translate/all', {
      method: 'POST',
      body: { text: 'Good morning students' }
    });
    return { status: r.status, translationsCount: Object.keys(r.data.translations || {}).length };
  });

  await runTest('Translate', 'POST /api/translate/speech', async () => {
    const r = await api('/api/translate/speech', {
      method: 'POST',
      body: { text: 'Welcome to our classroom', target_language: 'Santhali' }
    });
    return { status: r.status, audioUrl: r.data.audio_url };
  });

  // Audio transcription file upload tests using FormData
  await runTest('Translate', 'POST /api/translate/transcribe (Audio file)', async () => {
    const formData = new FormData();
    const dummyAudioBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);
    const fileBlob = new Blob([dummyAudioBytes], { type: 'audio/wav' });
    formData.append('file', fileBlob, 'sample.wav');

    const res = await fetch(`${BASE_URL}/api/translate/transcribe`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return { status: res.status, transcript: data.transcript, provider: data.provider };
  });

  await runTest('Speech', 'POST /api/speech/transcribe (Audio file)', async () => {
    const formData = new FormData();
    const dummyAudioBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);
    const fileBlob = new Blob([dummyAudioBytes], { type: 'audio/wav' });
    formData.append('file', fileBlob, 'sample.wav');

    const res = await fetch(`${BASE_URL}/api/speech/transcribe`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return { status: res.status, transcript: data.transcript, provider: data.provider };
  });

  await runTest('Speech', 'POST /api/speech/generate', async () => {
    const r = await api('/api/speech/generate', {
      method: 'POST',
      body: { text: 'नमस्ते बच्चों', language: 'Hindi' }
    });
    return { status: r.status, audioUrl: r.data.audioUrl };
  });

  await runTest('Speech', 'GET /api/speech/audio-stream', async () => {
    const r = await api('/api/speech/audio-stream?text=Namaste&language=Hindi');
    return { status: r.status, contentType: r.headers.get('content-type') };
  });

  console.log('--- 6. Testing Progress Endpoints ---');
  await runTest('Progress', 'GET /api/progress', async () => {
    const r = await api('/api/progress?studentId=student-demo');
    return { status: r.status, total: r.data.total, completed: r.data.completed };
  });

  await runTest('Progress', 'POST /api/progress', async () => {
    const r = await api('/api/progress', {
      method: 'POST',
      body: { studentId: 'student-demo', lessonId: firstLessonId, progress: 85 }
    });
    return { status: r.status, success: r.data.success, progress: r.data.record?.progress };
  });

  console.log('--- 7. Testing Student Preferences & Saved Lessons ---');
  await runTest('Student', 'GET /api/student/preferences', async () => {
    const r = await api('/api/student/preferences?studentId=student-demo');
    return { status: r.status, language: r.data.language };
  });

  await runTest('Student', 'PUT /api/student/language', async () => {
    const r = await api('/api/student/language', {
      method: 'PUT',
      body: { studentId: 'student-demo', language: 'sat' }
    });
    return { status: r.status, language: r.data.language, name: r.data.languageName };
  });

  await runTest('Student', 'PUT /api/student/preferences', async () => {
    const r = await api('/api/student/preferences', {
      method: 'PUT',
      body: { studentId: 'student-demo', autoPlay: false }
    });
    return { status: r.status, autoPlay: r.data.autoPlay };
  });

  await runTest('Student', 'POST /api/student/saved-lessons', async () => {
    const r = await api('/api/student/saved-lessons', {
      method: 'POST',
      body: { studentId: 'student-demo', lessonId: firstLessonId, lessonTitle: 'Water Cycle' }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Student', 'GET /api/student/saved-lessons', async () => {
    const r = await api('/api/student/saved-lessons?studentId=student-demo');
    return { status: r.status, savedLessonsCount: r.data.total };
  });

  await runTest('Student', 'DELETE /api/student/saved-lessons/:lessonId', async () => {
    const r = await api(`/api/student/saved-lessons/${firstLessonId}`, {
      method: 'DELETE',
      body: { studentId: 'student-demo' }
    });
    return { status: r.status, success: r.data.success };
  });

  console.log('--- 8. Testing Classroom Endpoints ---');
  await runTest('Classroom', 'GET /api/classrooms/active', async () => {
    const r = await api('/api/classrooms/active');
    return { status: r.status, total: r.data.total };
  });

  await runTest('Classroom', 'GET /api/classrooms/MAIN', async () => {
    const r = await api('/api/classrooms/MAIN');
    return { status: r.status, roomCode: r.data.roomCode, isActive: r.data.isActive };
  });

  await runTest('Classroom', 'POST /api/classrooms (Create Room)', async () => {
    const r = await api('/api/classrooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: { roomCode: 'ROOM_TEST', name: 'Science Class' }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Classroom', 'POST /api/classrooms/MAIN/start', async () => {
    const r = await api('/api/classrooms/MAIN/start', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Classroom', 'POST /api/classrooms/MAIN/broadcast', async () => {
    const r = await api('/api/classrooms/MAIN/broadcast', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: { text: 'Today we will study plants in Santhali and Hindi', language: 'Hindi' }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Classroom', 'POST /api/classrooms/MAIN/join', async () => {
    const r = await api('/api/classrooms/MAIN/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { preferredLanguage: 'Santhali' }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Classroom', 'POST /api/classrooms/MAIN/questions', async () => {
    const r = await api('/api/classrooms/MAIN/questions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { text: 'How do plants get water?', language: 'Santhali' }
    });
    return { status: r.status, success: r.data.success, questionId: r.data.question?.id };
  });

  await runTest('Classroom', 'POST /api/classrooms/MAIN/answers', async () => {
    const r = await api('/api/classrooms/MAIN/answers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: { questionId: 'q-demo-1', text: 'Plants absorb water through roots.' }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Classroom', 'GET /api/classrooms/MAIN/messages', async () => {
    const r = await api('/api/classrooms/MAIN/messages');
    return { status: r.status, messagesCount: (r.data.messages || []).length };
  });

  await runTest('Classroom', 'GET /api/classrooms/MAIN/transcripts', async () => {
    const r = await api('/api/classrooms/MAIN/transcripts');
    return { status: r.status, transcriptsCount: (r.data.transcripts || []).length };
  });

  await runTest('Classroom', 'POST /api/classrooms/MAIN/leave', async () => {
    const r = await api('/api/classrooms/MAIN/leave', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    return { status: r.status, success: r.data.success };
  });

  await runTest('Classroom', 'POST /api/classrooms/MAIN/end', async () => {
    const r = await api('/api/classrooms/MAIN/end', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    return { status: r.status, success: r.data.success };
  });

  console.log('\n========================================');
  console.log('SUMMARY OF ALL BACKEND ENDPOINTS TEST');
  console.log('========================================');
  let passed = 0;
  let failed = 0;
  for (const res of results) {
    const icon = res.pass ? '✅' : '❌';
    console.log(`${icon} [${res.category}] ${res.name} -> ${res.pass ? 'PASS (Status: ' + res.status + ')' : 'FAIL: ' + res.error}`);
    if (res.pass) passed++;
    else failed++;
  }
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
}

testAll();
