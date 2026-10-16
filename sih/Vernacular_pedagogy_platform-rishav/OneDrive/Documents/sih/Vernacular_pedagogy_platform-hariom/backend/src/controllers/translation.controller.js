import { translationService } from '../services/translation.service.js';
import { sttService } from '../services/stt.service.js';
import { ttsService } from '../services/tts.service.js';
import { COMMON_WORDS } from '../data/commonWords.js';
import { ApiError } from '../middleware/errorHandler.js';

export const translationController = {
  /**
   * Get pre-stored vernacular common words vocabulary (25+ words)
   */
  async getCommonWords(req, res, next) {
    try {
      res.status(200).json({
        total: COMMON_WORDS.length,
        languages: ['Santhali', 'Mundari', 'Ho', 'Kurukh', 'English'],
        words: COMMON_WORDS
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Translate a single piece of text to target language
   */
  async translateSingle(req, res, next) {
    try {
      const { text, target_language, source_language, targetLanguage, sourceLanguage } = req.body;
      if (!text) {
        throw new ApiError(400, 'text is required');
      }

      const target = targetLanguage || target_language || 'Santhali';
      const source = sourceLanguage || source_language || 'Hindi';

      const result = await translationService.translate(text, target, source);
      res.status(200).json({
        translatedText: result.translatedText,
        translated_text: result.translatedText,
        sourceLanguage: source,
        source_language: source,
        targetLanguage: target,
        target_language: target,
        phoneticText: result.phoneticText,
        phonetic_text: result.phoneticText,
        provider: result.provider
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Translate text to all vernacular languages simultaneously
   */
  async translateAll(req, res, next) {
    try {
      const { text, source_language = 'Hindi' } = req.body;
      if (!text) {
        throw new ApiError(400, 'text is required');
      }

      const result = await translationService.translateAll(text, source_language);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Translate text and synthesize speech output
   */
  async translateSpeech(req, res, next) {
    try {
      const { text, target_language = 'Santhali', source_language = 'Hindi' } = req.body;
      if (!text) {
        throw new ApiError(400, 'text is required');
      }

      const translation = await translationService.translate(text, target_language, source_language);
      const audioSynthesis = await ttsService.synthesize(translation.translatedText, target_language, translation.phoneticText);

      res.status(200).json({
        translated_text: translation.translatedText,
        phonetic_text: translation.phoneticText,
        audio_url: audioSynthesis.audioUrl,
        audio_base64: audioSynthesis.audio_base64,
        provider: translation.provider
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Transcribe incoming audio recording (WebM / WAV) to text
   */
  async transcribeAudio(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError(400, 'Audio file is required');
      }

      const audioBuffer = req.file.buffer;
      const mimeType = req.file.mimetype || 'audio/webm';

      const result = await sttService.transcribe(audioBuffer, mimeType);
      res.status(200).json({
        transcript: result.transcript,
        confidence: result.confidence,
        provider: result.provider
      });
    } catch (error) {
      next(error);
    }
  }
};
