import { translationService } from '../services/translation.service.js';
import { sttService } from '../services/stt.service.js';
import { ttsService } from '../services/tts.service.js';
import { ApiError } from '../middleware/errorHandler.js';

export const translationController = {
  /**
   * Translate a single piece of text to target language
   */
  async translateSingle(req, res, next) {
    try {
      const { text, target_language = 'Santhali', source_language = 'Hindi' } = req.body;
      if (!text) {
        throw new ApiError(400, 'text is required');
      }

      const result = await translationService.translate(text, target_language, source_language);
      res.status(200).json({
        translated_text: result.translatedText,
        phonetic_text: result.phoneticText,
        target_language: result.targetLanguage,
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
      const audioSynthesis = await ttsService.synthesize(translation.translatedText, target_language);

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
