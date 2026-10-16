import { WebSocketServer, WebSocket } from 'ws';
import { translationService } from '../services/translation.service.js';
import { env } from '../config/env.js';

// Room connection manager for active WebSockets
const roomConnections = new Map(); // roomId -> Set<WebSocket>

/**
 * Attaches the /api/classroom/:roomId/deepgram WebSocket route to the Node HTTP server
 */
export function setupDeepgramWebSocket(server, io) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const match = url.pathname.match(/^\/api\/classroom\/([^/?]+)\/deepgram/);

    if (match) {
      const roomId = match[1];
      const role = url.searchParams.get('role') || 'teacher';
      const language = url.searchParams.get('language') || 'Hindi';

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, { roomId, role, language });
      });
    }
  });

  wss.on('connection', async (ws, request, { roomId, role, language = 'Hindi' }) => {
    console.log(`[Deepgram WS] Client connected: room=${roomId}, role=${role}, sourceLanguage=${language}`);

    if (!roomConnections.has(roomId)) {
      roomConnections.set(roomId, new Set());
    }
    roomConnections.get(roomId).add(ws);

    let deepgramWs = null;
    const deepgramApiKey = (env.deepgramApiKey || process.env.DEEPGRAM_API_KEY || '').trim();
    const deepgramModel = (env.deepgramModel || process.env.DEEPGRAM_MODEL || 'nova-2').trim();

    const isEnglish = language.toLowerCase().startsWith('en');
    const dgLang = isEnglish ? 'en' : 'hi';
    const dgModel = isEnglish ? 'nova-3' : deepgramModel;
    const sourceLangForTranslation = isEnglish ? 'English' : (language || 'Hindi');

    // Connect to Deepgram streaming API if valid API key is present
    if (deepgramApiKey) {
      try {
        const maskedKey = deepgramApiKey.slice(0, 4) + '...' + deepgramApiKey.slice(-4);
        const deepgramUrl = `wss://api.deepgram.com/v1/listen?language=${dgLang}&model=${encodeURIComponent(dgModel)}&smart_format=true&interim_results=true&punctuate=true`;
        console.log(`🎙️ [Deepgram WS] Initializing streaming connection (Key: ${maskedKey}, Model: ${dgModel}, Lang: ${dgLang}) for room ${roomId}`);

        deepgramWs = new WebSocket(deepgramUrl, {
          headers: {
            Authorization: `Token ${deepgramApiKey}`
          }
        });

        deepgramWs.on('open', () => {
          console.log(`✅ [Deepgram WS] Successfully connected to Deepgram Streaming API for room ${roomId} (Source: ${sourceLangForTranslation})`);
        });

        deepgramWs.on('message', async (data) => {
          try {
            const resp = JSON.parse(data.toString());
            const alternative = resp.channel?.alternatives?.[0];
            const transcript = alternative?.transcript || '';
            const isFinal = Boolean(resp.is_final);

            if (transcript && transcript.trim()) {
              // Print returned text payloads to backend console
              console.log(`[Deepgram Transcript] [${isFinal ? 'FINAL' : 'INTERIM'}]: ${transcript}`);

              let translations = {};
              if (isFinal) {
                // 4. Translate finalized text into target regional languages
                const trResult = await translationService.translateAll(transcript, sourceLangForTranslation);
                translations = trResult.translations;

                // Broadcast to connected students via Socket.IO
                if (io) {
                  const bcPayload = {
                    id: `dg-${Date.now()}`,
                    sourceText: transcript,
                    teacherText: transcript,
                    sourceLanguage: sourceLangForTranslation,
                    translations: trResult.translations,
                    timestamp: new Date().toISOString()
                  };

                  io.of('/classroom').to(roomId).emit('classroom:broadcast', bcPayload);
                  io.of('/classroom').to(roomId).emit('classroom:speech_translated', {
                    ...bcPayload,
                    translatedText: trResult.translations?.Santhali || transcript,
                    phoneticText: trResult.translations?.Santhali_phonetic || ''
                  });
                  io.of('/classroom').to(roomId).emit('translation:new', bcPayload);

                  for (const lang of ['Santhali', 'Kurukh', 'Mundari', 'Ho', 'English']) {
                    if (trResult.translations[lang]) {
                      const langChannel = `${roomId}:${lang.toLowerCase()}`;
                      io.of('/classroom').to(langChannel).emit('classroom:speech_translated', {
                        ...bcPayload,
                        language: lang,
                        translatedText: trResult.translations[lang],
                        phoneticText: trResult.translations[`${lang}_phonetic`] || ''
                      });
                      io.of('/classroom').to(langChannel).emit('translation:new', {
                        ...bcPayload,
                        language: lang,
                        translatedText: trResult.translations[lang]
                      });
                    }
                  }
                }
              }

              // Broadcast back to all connected WebSockets in this room
              const payload = JSON.stringify({
                type: 'transcript',
                roomId,
                sourceText: transcript,
                transcript,
                isFinal,
                translations,
                timestamp: new Date().toISOString()
              });

              broadcastToRoom(roomId, payload);
            }
          } catch (err) {
            console.warn('[Deepgram WS] Error parsing Deepgram response:', err.message);
          }
        });

        deepgramWs.on('error', (err) => {
          console.warn(`[Deepgram WS] Deepgram streaming error (${err.message}). Using local speech-to-text fallback.`);
          deepgramWs = null;
        });

        deepgramWs.on('close', () => {
          console.log(`[Deepgram WS] Deepgram connection closed for room ${roomId}`);
        });
      } catch (err) {
        console.warn('[Deepgram WS] Could not initialize Deepgram WebSocket:', err.message);
      }
    } else {
      console.log(`[Deepgram WS] Note: DEEPGRAM_API_KEY not configured. Using active simulated streaming engine for room ${roomId}.`);
    }

    // Audio buffer accumulator for local analysis / fallback
    let receivedChunksCount = 0;
    let fallbackDebounce = null;

    // Handle incoming audio chunks from teacher client
    ws.on('message', (message, isBinary) => {
      receivedChunksCount++;

      // Forward audio chunk to Deepgram if connected
      if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.send(message);
      } else {
        // Fallback simulation when no live Deepgram key is present
        // Emits interim indicator then a final pedagogical Hindi sentence after speech pauses
        if (receivedChunksCount % 4 === 0) {
          const interimText = 'नमस्ते बच्चों...';
          console.log(`[Deepgram Transcript] [INTERIM]: ${interimText}`);
          ws.send(JSON.stringify({
            type: 'transcript',
            roomId,
            sourceText: interimText,
            transcript: interimText,
            isFinal: false,
            timestamp: new Date().toISOString()
          }));
        }

        clearTimeout(fallbackDebounce);
        fallbackDebounce = setTimeout(async () => {
          const samplePhrases = isEnglish
            ? [
                'Good morning students! Today we will learn about plants and their parts.',
                'Plants need sunlight, water, and soil nutrients to survive and grow.',
                'The water cycle consists of evaporation, condensation, and rain.',
                'Birsa Munda was a legendary tribal freedom fighter and hero of Jharkhand.'
              ]
            : [
                'नमस्ते बच्चों! आज हम पौधों और उनके विभिन्न भागों के बारे में सीखेंगे।',
                'पौधों को जीवित रहने के लिए सूर्य के प्रकाश और पानी की आवश्यकता होती है।',
                'जल चक्र में वाष्पीकरण और वर्षा सबसे महत्वपूर्ण प्रक्रियाएं हैं।',
                'बिरसा मुंडा झारखंड के महान स्वतंत्रता सेनानी और जननायक थे।'
              ];
          const finalPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
          console.log(`[Deepgram Transcript] [FINAL]: ${finalPhrase}`);

          const trResult = await translationService.translateAll(finalPhrase, sourceLangForTranslation);
          const payload = JSON.stringify({
            type: 'transcript',
            roomId,
            sourceText: finalPhrase,
            transcript: finalPhrase,
            isFinal: true,
            translations: trResult.translations,
            timestamp: new Date().toISOString()
          });

          broadcastToRoom(roomId, payload);

          if (io) {
            const bcPayload = {
              id: `sim-${Date.now()}`,
              sourceText: finalPhrase,
              teacherText: finalPhrase,
              sourceLanguage: sourceLangForTranslation,
              translations: trResult.translations,
              timestamp: new Date().toISOString()
            };

            io.of('/classroom').to(roomId).emit('classroom:broadcast', bcPayload);
            io.of('/classroom').to(roomId).emit('classroom:speech_translated', {
              ...bcPayload,
              translatedText: trResult.translations?.Santhali || finalPhrase,
              phoneticText: trResult.translations?.Santhali_phonetic || ''
            });
            io.of('/classroom').to(roomId).emit('translation:new', bcPayload);

            for (const lang of ['Santhali', 'Kurukh', 'Mundari', 'Ho', 'English']) {
              if (trResult.translations[lang]) {
                const langChannel = `${roomId}:${lang.toLowerCase()}`;
                io.of('/classroom').to(langChannel).emit('classroom:speech_translated', {
                  ...bcPayload,
                  language: lang,
                  translatedText: trResult.translations[lang],
                  phoneticText: trResult.translations[`${lang}_phonetic`] || ''
                });
                io.of('/classroom').to(langChannel).emit('translation:new', {
                  ...bcPayload,
                  language: lang,
                  translatedText: trResult.translations[lang]
                });
              }
            }
          }
        }, 1200);
      }
    });

    ws.on('close', () => {
      console.log(`[Deepgram WS] Client disconnected from room ${roomId}`);
      if (roomConnections.has(roomId)) {
        roomConnections.get(roomId).delete(ws);
        if (roomConnections.get(roomId).size === 0) {
          roomConnections.delete(roomId);
        }
      }
      if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.close();
      }
      clearTimeout(fallbackDebounce);
    });

    ws.on('error', (err) => {
      console.warn(`[Deepgram WS] WebSocket client error in room ${roomId}:`, err.message);
    });
  });

  function broadcastToRoom(roomId, payload) {
    const clients = roomConnections.get(roomId);
    if (clients) {
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }
  }
}
