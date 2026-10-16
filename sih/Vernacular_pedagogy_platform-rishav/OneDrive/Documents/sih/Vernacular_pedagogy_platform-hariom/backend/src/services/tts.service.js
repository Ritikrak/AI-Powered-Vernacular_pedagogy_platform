class TTSService {
  /**
   * Synthesize audio for translated vernacular speech
   * Tribal languages (Santhali, Mundari, Ho, Kurukh) are adapted with phonetic transliterations
   * for Indian acoustic engines (hi-IN) via an internal audio stream proxy to eliminate referrer/CORS blocks.
   */
  async synthesize(text, language = 'Hindi', phonetic = '') {
    const langKey = (language || 'Hindi').toLowerCase();

    // Map regional language to supported acoustic voice
    let voiceLang = 'hi';
    if (langKey === 'english') voiceLang = 'en';

    // Prefer phonetic transcription for tribal languages, since Ol Chiki/Warang Citi/Bani lack native acoustic engines
    const cleanPhonetic = (phonetic || '').trim();
    const cleanText = (text || '').replace(/[\n\r]+/g, ' ').slice(0, 300).trim();

    // Detect tribal scripts (Ol Chiki, Warang Citi, etc.)
    const isTribalScript = /[\u1C50-\u1C7F\u{118A0}-\u{118FF}\u{1E5D0}-\u{1E5FF}]/u.test(cleanText);
    const speechText = (isTribalScript && cleanPhonetic) ? cleanPhonetic : (cleanPhonetic || cleanText);

    // Audio stream URL served via our backend audio proxy to prevent 404/CORS/referrer blocks
    const audioUrl = `/api/speech/audio-stream?text=${encodeURIComponent(cleanText)}&language=${encodeURIComponent(language)}&phonetic=${encodeURIComponent(cleanPhonetic)}`;

    return {
      language,
      voiceLang,
      text: cleanText,
      phonetic: cleanPhonetic,
      speechText,
      audioUrl,
      audio_base64: null,
      provider: 'vernacular-phonetic-tts'
    };
  }
}

export const ttsService = new TTSService();
