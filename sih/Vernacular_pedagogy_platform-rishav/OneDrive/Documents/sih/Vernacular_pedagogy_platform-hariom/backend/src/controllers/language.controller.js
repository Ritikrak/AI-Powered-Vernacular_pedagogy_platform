import { isMongoConnected } from '../config/db.js';
import { Language, defaultLanguages } from '../models/Language.js';

export const languageController = {
  /**
   * Get list of all supported vernacular languages and scripts
   */
  async getLanguages(req, res, next) {
    try {
      if (isMongoConnected()) {
        try {
          const languages = await Language.find({ is_active: true });
          if (languages && languages.length > 0) {
            return res.status(200).json(languages);
          }
        } catch {
          // Fall through to defaultLanguages
        }
      }

      const formatted = defaultLanguages.map(l => ({
        code: l.language_code,
        name: l.language_name,
        script: l.supported_scripts?.[0] || 'Devanagari',
        native: l.native_name,
        language_code: l.language_code,
        language_name: l.language_name,
        supported_scripts: l.supported_scripts,
        sample_phrase: l.sample_phrase
      }));

      res.status(200).json(formatted);
    } catch (error) {
      next(error);
    }
  }
};
