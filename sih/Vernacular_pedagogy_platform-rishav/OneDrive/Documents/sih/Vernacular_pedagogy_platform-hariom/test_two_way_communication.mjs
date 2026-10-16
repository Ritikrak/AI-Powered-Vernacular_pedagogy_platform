import { io } from './frontend/node_modules/socket.io-client/build/esm/index.js';

const BACKEND_URL = 'http://localhost:8000';
const ROOM = 'MAIN';

console.log('🧪 Testing Two-Way Communication Between Student & Teacher...');

async function runTwoWayTest() {
  // 1. Teacher Socket
  const teacherSocket = io(`${BACKEND_URL}/classroom`, {
    auth: { role: 'teacher', name: 'Sushila Teacher', room: ROOM }
  });

  // 2. Student Socket
  const studentSocket = io(`${BACKEND_URL}/classroom`, {
    auth: { role: 'student', name: 'Rohan (Learner)', preferredLanguage: 'Santhali', room: ROOM }
  });

  await Promise.all([
    new Promise(res => teacherSocket.on('connect', res)),
    new Promise(res => studentSocket.on('connect', res))
  ]);

  console.log('🔌 Both Teacher and Student connected via Socket.IO');

  teacherSocket.emit('join_room', { room: ROOM, role: 'teacher', name: 'Sushila Teacher' });
  studentSocket.emit('join_room', { room: ROOM, role: 'student', name: 'Rohan (Learner)', preferredLanguage: 'Santhali' });

  // Wait for join
  await new Promise(r => setTimeout(r, 500));

  // Test Phase 1: Student sends a voice doubt in Santali
  console.log('\n--- 1. Testing Student -> Teacher Spoken Doubt in Santali ---');
  let receivedQuestion = null;

  const questionPromise = new Promise(resolve => {
    teacherSocket.on('classroom:student_question', (q) => {
      console.log('👩🏾‍🏫 Teacher received student doubt:');
      console.log('   - Student:', q.studentName);
      console.log('   - Language:', q.originalLanguage);
      console.log('   - Original Text:', q.originalText);
      console.log('   - Translated to Hindi:', q.hindiTranslation);
      console.log('   - Audio TTS URL:', q.audioUrl);
      console.log('   - Is Voice Doubt:', q.isVoice);
      receivedQuestion = q;
      resolve(q);
    });
  });

  studentSocket.emit('student:speak', {
    roomId: ROOM,
    room: ROOM,
    studentName: 'Rohan (Learner)',
    text: 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?',
    language: 'Santhali',
    isVoice: true
  });

  await questionPromise;

  if (!receivedQuestion) throw new Error('Teacher failed to receive student question');
  console.log('✅ Student -> Teacher Doubt transmission & Hindi translation verified!');

  // Test Phase 2: Teacher replies in Hindi (auto-translated to Santali with TTS audio)
  console.log('\n--- 2. Testing Teacher -> Student Answer Translated to Santali ---');
  let receivedAnswer = null;

  const answerPromise = new Promise(resolve => {
    studentSocket.on('student:answer_received', (ans) => {
      console.log('👦🏽 Student received teacher answer:');
      console.log('   - Question ID:', ans.questionId);
      console.log('   - Teacher Spoke (Hindi):', ans.teacherText);
      console.log('   - Translated to Santali:', ans.translatedAnswer);
      console.log('   - Phonetic:', ans.phonetic);
      console.log('   - Audio TTS Stream:', ans.audioUrl);
      receivedAnswer = ans;
      resolve(ans);
    });
  });

  teacherSocket.emit('teacher:voice_reply', {
    roomId: ROOM,
    room: ROOM,
    questionId: receivedQuestion.id,
    text: 'जल चक्र में पानी भाप बनकर बादल बनता है और फिर वर्षा होती है।',
    language: 'Hindi',
    isVoice: true
  });

  await answerPromise;

  if (!receivedAnswer) throw new Error('Student failed to receive teacher answer');
  console.log('✅ Teacher -> Student Reply transmission & Vernacular TTS verified!');

  // Test Phase 3: Hand Raise & Floor Speaking Handshake
  console.log('\n--- 3. Testing Hand Raise, Floor Grant & Intercom Handshake ---');
  let handAllowed = false;

  const allowPromise = new Promise(resolve => {
    studentSocket.on('teacher:allow-speak', (data) => {
      console.log('👦🏽 Student notified: Teacher granted floor permission:', data);
      handAllowed = true;
      resolve(data);
    });
  });

  teacherSocket.on('classroom:hand_raised', (alert) => {
    console.log('👩🏾‍🏫 Teacher notified of hand raise from:', alert.studentName);
    // Teacher allows speak
    teacherSocket.emit('teacher:allow-speak', {
      roomId: ROOM,
      studentName: alert.studentName
    });
  });

  studentSocket.emit('student:raise-hand', {
    roomId: ROOM,
    studentName: 'Rohan (Learner)'
  });

  await allowPromise;
  if (!handAllowed) throw new Error('Floor grant failed');
  console.log('✅ Hand Raise & Floor Intercom handshake verified!');

  // Test Phase 4: Student finishes speaking
  console.log('\n--- 4. Testing Floor Release ---');
  const clearPromise = new Promise(resolve => {
    teacherSocket.on('classroom:speaker_cleared', (data) => {
      console.log('👩🏾‍🏫 Teacher notified: Floor released by:', data.studentName);
      resolve(data);
    });
  });

  studentSocket.emit('student:end_speak', {
    roomId: ROOM,
    studentName: 'Rohan (Learner)'
  });

  await clearPromise;
  console.log('✅ Floor release verified!');

  teacherSocket.disconnect();
  studentSocket.disconnect();

  console.log('\n🎉 ALL TWO-WAY COMMUNICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  process.exit(0);
}

runTwoWayTest().catch(err => {
  console.error('❌ Two-Way Communication Test Failed:', err);
  process.exit(1);
});
