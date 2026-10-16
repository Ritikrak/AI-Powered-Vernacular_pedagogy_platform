import { io } from './frontend/node_modules/socket.io-client/build/esm/index.js';

const API_BASE = 'http://localhost:8000/api';
const BACKEND_BASE = 'http://localhost:8000';

async function runTests() {
  console.log('🚀 [TEST SUITE] Starting Complete Live Classroom Flow Verification\n');

  // Test 1: GET /api/languages
  console.log('--- 1. Testing GET /api/languages ---');
  const langs = await fetch(`${API_BASE}/languages`).then(r => r.json());
  console.log(`Loaded ${langs.length} languages.`);
  const sat = langs.find(l => l.code === 'sat');
  console.log('Santhali language payload:', { code: sat.code, name: sat.name, script: sat.script, native: sat.native });
  if (!sat || sat.code !== 'sat') throw new Error('Failed to fetch valid languages list');

  // Test 2: GET /api/classrooms/MAIN
  console.log('\n--- 2. Testing GET /api/classrooms/MAIN ---');
  const room = await fetch(`${API_BASE}/classrooms/MAIN`).then(r => r.json());
  console.log('Room MAIN details:', {
    roomId: room.roomId,
    teacher: room.teacher,
    active: room.active,
    studentCount: room.studentCount
  });
  if (room.roomId !== 'MAIN') throw new Error('Failed to fetch room MAIN details');

  // Test 3: PUT /api/students/language and /preferences
  console.log('\n--- 3. Testing Student Preferences ---');
  const langPref = await fetch(`${API_BASE}/students/language`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'sat' })
  }).then(r => r.json());
  console.log('Updated language:', langPref);

  const audioPref = await fetch(`${API_BASE}/students/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoPlay: true })
  }).then(r => r.json());
  console.log('Updated autoPlay:', audioPref);

  // Test 4: POST /api/translate
  console.log('\n--- 4. Testing POST /api/translate ---');
  const tr = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'आज हम पौधों के बारे में सीखेंगे।',
      sourceLanguage: 'Hindi',
      targetLanguage: 'Santhali'
    })
  }).then(r => r.json());
  console.log('Translate response:', {
    translatedText: tr.translatedText,
    sourceLanguage: tr.sourceLanguage,
    targetLanguage: tr.targetLanguage,
    provider: tr.provider
  });
  if (!tr.translatedText) throw new Error('Translation failed');

  // Test 5: GET /api/classrooms/MAIN/messages
  console.log('\n--- 5. Testing Translation History GET /api/classrooms/MAIN/messages ---');
  const msgs = await fetch(`${API_BASE}/classrooms/MAIN/messages`).then(r => r.json());
  console.log(`History has ${msgs.total} messages.`);
  console.log('Sample message:', {
    timestamp: msgs.messages[0]?.timestamp,
    teacherText: msgs.messages[0]?.teacherText,
    santhali: msgs.messages[0]?.translations?.Santhali?.text
  });
  if (!msgs.messages || msgs.messages.length === 0) throw new Error('No messages returned in history');

  // Test 6: POST /api/speech/generate
  console.log('\n--- 6. Testing POST /api/speech/generate ---');
  const speech = await fetch(`${API_BASE}/speech/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱨᱮ-ᱱᱟᱹᱲᱤ ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾',
      language: 'Santhali'
    })
  }).then(r => r.json());
  console.log('Speech generation response:', {
    success: speech.success,
    audioUrl: speech.audioUrl ? speech.audioUrl.slice(0, 50) + '...' : null
  });
  if (!speech.success || !speech.audioUrl) throw new Error('Speech generation failed');

  // Test 7: POST /api/classrooms/MAIN/questions and /answers
  console.log('\n--- 7. Testing Two-Way Q&A Flow ---');
  const questionRes = await fetch(`${API_BASE}/classrooms/MAIN/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: 'Rahul',
      text: 'Mujhe photosynthesis samajh nahi aaya',
      language: 'sat'
    })
  }).then(r => r.json());
  console.log('Student question registered:', {
    id: questionRes.question?.id,
    student: questionRes.question?.studentName,
    originalText: questionRes.question?.originalText,
    hindiTranslation: questionRes.question?.hindiTranslation
  });

  const answerRes = await fetch(`${API_BASE}/classrooms/MAIN/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId: questionRes.question?.id,
      text: 'Photosynthesis वह प्रक्रिया है जिससे पौधे सूर्य के प्रकाश में भोजन बनाते हैं।'
    })
  }).then(r => r.json());
  console.log('Teacher answer registered and translated:', {
    questionId: answerRes.answer?.questionId,
    hindiAnswer: answerRes.answer?.hindiAnswer,
    translatedAnswer: answerRes.answer?.translatedAnswer,
    targetLanguage: answerRes.answer?.targetLanguage
  });

  // Test 8: Socket.IO Real-Time Flow
  console.log('\n--- 8. Testing Real-time Socket.IO Events ---');
  await new Promise((resolve, reject) => {
    const teacherSocket = io(`${BACKEND_BASE}/classroom`, {
      transports: ['websocket']
    });

    const studentSocket = io(`${BACKEND_BASE}/classroom`, {
      transports: ['websocket']
    });

    let studentReceivedTranslation = false;
    let studentAllowedSpeak = false;

    teacherSocket.on('connect', () => {
      console.log('🔌 Teacher connected via Socket.IO');
      teacherSocket.emit('join_room', {
        room: 'MAIN',
        role: 'teacher',
        name: 'Teacher 01'
      });
    });

    studentSocket.on('connect', () => {
      console.log('🔌 Student connected via Socket.IO');
      studentSocket.emit('join_room', {
        room: 'MAIN',
        role: 'student',
        name: 'Rahul',
        preferredLanguage: 'Santhali'
      });
    });

    // Student listening for live translation
    studentSocket.on('translation:new', (data) => {
      console.log('📡 Student received translation:new event:', {
        teacherSpoke: data.sourceText || data.teacherText,
        translated: data.translatedText || data.translations?.Santhali?.text
      });
      studentReceivedTranslation = true;
      checkDone();
    });

    // Teacher listening for student hand raise
    teacherSocket.on('classroom:hand_raised', (alert) => {
      console.log('✋ Teacher received hand raise alert from:', alert.studentName);
      // Teacher allows student to speak
      teacherSocket.emit('teacher:allow-speak', {
        room: 'MAIN',
        studentName: alert.studentName
      });
    });

    // Student receiving allow-speak permission
    studentSocket.on('teacher:allow-speak', (data) => {
      console.log('🎤 Student received permission to speak:', data);
      studentAllowedSpeak = true;
      checkDone();
    });

    // Wait for sockets to join room, then trigger actions
    setTimeout(() => {
      teacherSocket.emit('teacher:speech', {
        roomId: 'MAIN',
        language: 'hi',
        text: 'Good morning students, today we will learn about plants.'
      });

      studentSocket.emit('student:raise-hand', {
        roomId: 'MAIN',
        studentName: 'Rahul'
      });
    }, 1200);

    function checkDone() {
      if (studentReceivedTranslation && studentAllowedSpeak) {
        teacherSocket.disconnect();
        studentSocket.disconnect();
        console.log('✅ Socket.IO real-time broadcast and hand-raise verification passed!');
        resolve();
      }
    }

    setTimeout(() => {
      teacherSocket.disconnect();
      studentSocket.disconnect();
      if (!studentReceivedTranslation || !studentAllowedSpeak) {
        reject(new Error('Socket test timed out waiting for translation or permission events'));
      }
    }, 6000);
  });

  console.log('\n✨ ALL LIVE CLASSROOM TESTS PASSED SUCCESSFULLY! ✨');
}

runTests().catch(err => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
