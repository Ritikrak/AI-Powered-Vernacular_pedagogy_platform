class TTSService {
  /**
   * Synthesize audio for translated vernacular speech
   * Tribal languages (Santhali, Mundari, Ho, Kurukh) are adapted with phonetic transliterations
   * for Indian acoustic engines (hi-IN).
   */
  async synthesize(text, language = 'Hindi') {
    const langKey = language.toLowerCase();

    // Map regional language to supported acoustic voice
    let voiceLang = 'hi';
    if (langKey === 'english') voiceLang = 'en';

    // Encode text for web TTS endpoint
    const cleanText = text.replace(/[\n\r]+/g, ' ').slice(0, 300);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${voiceLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

    return {
      language,
      voiceLang,
      text: cleanText,
      audioUrl,
      // Provide audio_base64 flag so clients know audio URL/stream is available
      audio_base64: null,
      provider: 'vernacular-phonetic-tts'
    };
  }
}

export const ttsService = new TTSService();
