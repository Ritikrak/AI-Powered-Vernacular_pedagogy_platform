import { io } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';

async function testSocketFlow() {
  console.log('Testing Realtime Socket.IO Classroom Flow...');

  const teacherSocket = io('http://localhost:8000/classroom', { transports: ['websocket'] });
  const studentSocket = io('http://localhost:8000/classroom', { transports: ['websocket'] });

  await new Promise((resolve) => teacherSocket.on('connect', resolve));
  await new Promise((resolve) => studentSocket.on('connect', resolve));
  console.log('✅ Both Teacher and Student connected to Socket.IO /classroom');

  // Teacher joins
  teacherSocket.emit('join_room', {
    room: 'main',
    role: 'teacher',
    name: 'Sunita Kumari'
  });

  // Student joins with Santhali
  studentSocket.emit('join_room', {
    room: 'main',
    role: 'student',
    name: 'Aman Raj',
    preferredLanguage: 'Santhali'
  });

  await new Promise((r) => setTimeout(r, 500));

  // Verify Teacher Speech Broadcast -> Student Translated Delivery
  const translationPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for translation')), 5000);
    studentSocket.on('classroom:speech_translated', (data) => {
      clearTimeout(timeout);
      console.log('✅ Student received targeted translation:', data);
      resolve(data);
    });
  });

  teacherSocket.emit('teacher:speech', {
    room: 'main',
    text: 'नमस्ते बच्चों! आज हम जल चक्र के बारे में सीखेंगे।',
    sourceLanguage: 'Hindi'
  });

  const translationData = await translationPromise;
  if (!translationData.translatedText) {
    throw new Error('No translatedText in payload');
  }

  // Verify Student Question -> Teacher Question Translated Back to Hindi
  const questionPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for question')), 5000);
    teacherSocket.on('classroom:student_question', (q) => {
      clearTimeout(timeout);
      console.log('✅ Teacher received student question translated to Hindi:', q);
      resolve(q);
    });
  });

  studentSocket.emit('student:question', {
    room: 'main',
    studentName: 'Aman Raj',
    text: 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?',
    language: 'Santhali'
  });

  const questionData = await questionPromise;
  if (!questionData.hindiTranslation) {
    throw new Error('No hindiTranslation in student question');
  }

  // Clean up
  teacherSocket.disconnect();
  studentSocket.disconnect();

  console.log('\n🎉 ALL REALTIME SOCKET.IO CLASSROOM INTEGRATION TESTS PASSED!\n');
}

testSocketFlow().catch((err) => {
  console.error('❌ Socket Test Failed:', err);
  process.exit(1);
});
