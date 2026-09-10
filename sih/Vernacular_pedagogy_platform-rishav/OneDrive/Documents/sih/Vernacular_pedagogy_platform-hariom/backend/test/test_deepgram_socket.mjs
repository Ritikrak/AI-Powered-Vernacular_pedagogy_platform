import WebSocket from 'ws';

async function testDeepgramSocket() {
  console.log('🧪 Testing Deepgram WebSocket endpoint (/api/classroom/MAIN/deepgram)...');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8000/api/classroom/MAIN/deepgram?role=teacher');
    let messageReceived = false;

    const timeout = setTimeout(() => {
      ws.close();
      if (!messageReceived) {
        reject(new Error('Deepgram WebSocket test timed out waiting for message'));
      } else {
        resolve();
      }
    }, 8000);

    ws.on('open', () => {
      console.log('✅ Connected to Deepgram WebSocket at ws://localhost:8000/api/classroom/MAIN/deepgram');

      // Send 4 simulated audio buffer chunks (250ms interval simulation)
      for (let i = 1; i <= 4; i++) {
        const dummyChunk = Buffer.alloc(128, i);
        ws.send(dummyChunk);
      }
      console.log('📤 Sent audio chunk packets to Deepgram WebSocket');
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        console.log(`📥 Received message from Deepgram WS:`, {
          type: parsed.type,
          transcript: parsed.transcript || parsed.sourceText,
          isFinal: parsed.isFinal,
          translationsCount: parsed.translations ? Object.keys(parsed.translations).length : 0
        });
        messageReceived = true;
        if (parsed.isFinal) {
          clearTimeout(timeout);
          ws.close();
          console.log('🎉 Deepgram WebSocket verification successful!');
          resolve();
        }
      } catch (err) {
        console.warn('Could not parse WS message:', data.toString());
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      console.error('❌ WebSocket error:', err);
      reject(err);
    });

    ws.on('close', () => {
      console.log('ℹ️ Deepgram WebSocket closed');
    });
  });
}

testDeepgramSocket()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
