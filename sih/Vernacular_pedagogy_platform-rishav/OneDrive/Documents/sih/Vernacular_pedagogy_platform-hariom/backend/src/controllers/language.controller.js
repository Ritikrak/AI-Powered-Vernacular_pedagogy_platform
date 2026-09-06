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

      res.status(200).json(defaultLanguages);
    } catch (error) {
      next(error);
    }
  }
};
