import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    if (env.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(env.geminiApiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✨ [GEMINI SERVICE] Initialized with Google Generative AI SDK (gemini-1.5-flash).');
      } catch (err) {
        console.warn('⚠️  [GEMINI SERVICE] Failed to initialize GoogleGenerativeAI client:', err.message);
      }
    }
  }

  isConfigured() {
    return !!this.genAI && !!this.model && !!env.geminiApiKey;
  }

  /**
   * Simplify complex textbook lessons into grade-appropriate regional vernacular language
   */
  async simplifyLesson(text, gradeLevel = 'Class 5', targetLanguage = 'Hindi') {
    if (!this.isConfigured()) {
      return this._fallbackSimplify(text, gradeLevel);
    }

    try {
      const prompt = `You are an expert bilingual primary school teacher in Jharkhand, India.
Explain and simplify the following lesson for a child studying in ${gradeLevel}.
Use simple everyday words, relatable analogies from rural/village life (trees, rivers, seasons, local animals), and clear sentences.
Output language: ${targetLanguage}.

Original Lesson Content:
"""${text}"""

Provide a concise, simplified summary in 3-4 gentle paragraphs with bullet points for key concepts.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text() || this._fallbackSimplify(text, gradeLevel);
    } catch (error) {
      console.warn('⚠️  [GEMINI AI ERROR] Fallback invoked during lesson simplification:', error.message);
      return this._fallbackSimplify(text, gradeLevel);
    }
  }

  /**
   * Translate text into specified vernacular/tribal language with native script and phonetic guide
   */
  async translateVernacular(text, targetLanguage, sourceLanguage = 'Hindi') {
    if (!this.isConfigured()) {
      return null; // Signals translation.service to use regional dictionary fallback
    }

    try {
      const prompt = `You are an expert indigenous linguist specializing in the tribal languages of Jharkhand, India:
- Santhali (ᱥᱟᱱᱛᱟᱲᱤ / Ol Chiki script and Latin phonetic transcription)
- Mundari (ᱢᱩᱱᱰᱟᱨᱤ / Mundari Bani / Devanagari and Latin phonetic)
- Ho (ᱦᱳ / Warang Citi and Latin phonetic)
- Kurukh (कुड़ुख़ / Tolong Siki / Devanagari and Latin phonetic)
- Hindi (हिंदी)
- English

Translate the following ${sourceLanguage} text into ${targetLanguage}.
You MUST return ONLY a valid JSON object with the following schema, with no markdown code fence blocks or extra explanation:
{
  "targetLanguage": "${targetLanguage}",
  "translatedText": "Text in native script of ${targetLanguage}",
  "phoneticText": "Phonetic Romanized / Latin pronunciation of the translated text",
  "simplifiedMeaning": "Brief 1-sentence simple meaning in English"
}

Text to translate:
"${text}"`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const raw = (response.text() || '').trim();
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn(`⚠️  [GEMINI TRANSLATION ERROR] Could not translate to ${targetLanguage} via Gemini: ${error.message}`);
      return null;
    }
  }

  /**
   * Transcribe audio buffer using Gemini multimodal capability
   */
  async transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
    if (!this.isConfigured() || !audioBuffer) {
      return null;
    }

    try {
      const base64Audio = audioBuffer.toString('base64');
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Audio
          }
        },
        'Listen to this classroom teacher audio in Hindi and return ONLY the verbatim transcription of what was said. Do not add any preface or commentary.'
      ]);

      const response = await result.response;
      return response.text()?.trim() || null;
    } catch (error) {
      console.warn('⚠️  [GEMINI AUDIO STT ERROR]:', error.message);
      return null;
    }
  }

  _fallbackSimplify(text, gradeLevel) {
    const sentences = text.split(/[।.\n]+/).filter(s => s.trim().length > 0);
    const mainIdea = sentences.slice(0, 3).join('। ') + '।';
    return `[सरल पाठ - ${gradeLevel}]\n\nमुख्य बातें:\n• ${mainIdea}\n• यह पाठ हमें हमारे आसपास की प्रकृति और विज्ञान को समझने में मदद करता है।\n• शिक्षक के साथ मिलकर इसके मुख्य शब्दों का अभ्यास करें।`;
  }
}

export const geminiService = new GeminiService();
