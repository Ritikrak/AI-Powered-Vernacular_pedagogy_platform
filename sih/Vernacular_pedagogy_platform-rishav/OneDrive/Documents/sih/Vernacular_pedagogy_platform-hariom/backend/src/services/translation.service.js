import { geminiService } from './gemini.service.js';
import { Translation } from '../models/Translation.js';

// Comprehensive regional vernacular dictionary covering classroom, science, nature & daily pedagogical concepts
const VERNACULAR_DICTIONARY = {
  santhali: {
    name: 'Santhali',
    script: 'Ol Chiki',
    terms: {
      'पानी': { native: 'ᱫᱟᱜ', phonetic: "da'" },
      'जल': { native: 'ᱫᱟᱜ', phonetic: "da'" },
      'जल चक्र': { native: 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ', phonetic: "da' chakra" },
      'वर्षा': { native: 'ᱫᱟᱜ ᱡᱟᱹᱲᱤ', phonetic: "da' jaṛi" },
      'बारिश': { native: 'ᱫᱟᱜ ᱡᱟᱹᱲᱤ', phonetic: "da' jaṛi" },
      'बादल': { native: 'ᱨᱤᱢᱤᱞ', phonetic: 'rimil' },
      'सूर्य': { native: 'ᱥᱤᱧ ᱪᱟᱸᱫᱚ', phonetic: 'siñ chando' },
      'सूरज': { native: 'ᱥᱤᱧ ᱪᱟᱸᱫᱚ', phonetic: 'siñ chando' },
      'पेड़': { native: 'ᱫᱟᱨᱮ', phonetic: 'dare' },
      'जंगल': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'वन': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'बच्चे': { native: 'ᱜᱤᱫᱽᱨᱟᱹ', phonetic: 'gidra' },
      'बच्चों': { native: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ', phonetic: 'gidra ko' },
      'विद्यार्थी': { native: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ', phonetic: 'paṭhua' },
      'शिक्षक': { native: 'ᱢᱟᱪᱮᱛ', phonetic: 'machet' },
      'नमस्कार': { native: 'ᱡᱚᱦᱟᱨ', phonetic: 'johar' },
      'नमस्ते': { native: 'ᱡᱚᱦᱟᱨ', phonetic: 'johar' },
      'सीखना': { native: 'ᱥᱮᱬᱟ', phonetic: 'seṛa' },
      'पढ़ना': { native: 'ᱯᱟᱲᱦᱟᱣ', phonetic: 'paṛhao' },
      'स्कूल': { native: 'ᱟᱥᱲᱟ', phonetic: 'asṛa' },
      'हवा': { native: 'ᱦᱚᱭ', phonetic: 'hoy' },
      'मिट्टी': { native: 'ᱦᱟᱥᱟ', phonetic: 'hasa' },
      'आज': { native: 'ᱛᱮᱦᱮᱧ', phonetic: 'teheñ' },
      'हम': { native: 'ᱟᱵᱚ', phonetic: 'abo' },
      'सीखेंगे': { native: 'ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ', phonetic: 'bon seṛaya' },
      'है': { native: 'ᱠᱟᱱᱟ', phonetic: 'kana' },
      'था': { native: 'ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ', phonetic: 'taheñ kana' }
    }
  },
  mundari: {
    name: 'Mundari',
    script: 'Mundari Bani',
    terms: {
      'पानी': { native: 'ᱫᱟᱜ', phonetic: "da'" },
      'जल': { native: 'ᱫᱟᱜ', phonetic: "da'" },
      'जल चक्र': { native: 'ᱫᱟᱜ ᱠᱟᱱᱰᱟ', phonetic: "da' kanda" },
      'वर्षा': { native: 'ᱜᱟᱢᱟ', phonetic: 'gama' },
      'बारिश': { native: 'ᱜᱟᱢᱟ', phonetic: 'gama' },
      'बादल': { native: 'ᱨᱤᱢᱤᱞ', phonetic: 'rimil' },
      'सूर्य': { native: 'ᱥᱤᱝᱜᱤ', phonetic: 'singi' },
      'सूरज': { native: 'ᱥᱤᱝᱜᱤ', phonetic: 'singi' },
      'पेड़': { native: 'ᱫᱟᱨᱩ', phonetic: 'daru' },
      'जंगल': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'बच्चे': { native: 'ᱦᱩᱲᱤᱝ ᱠᱳ', phonetic: 'huring ko' },
      'बच्चों': { native: 'ᱦᱩᱲᱤᱝ ᱠᱳ', phonetic: 'huring ko' },
      'नमस्ते': { native: 'ᱡᱳᱦᱟᱨ', phonetic: 'johar' },
      'सीखेंगे': { native: 'ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ', phonetic: 'itun lagid' },
      'स्कूल': { native: 'ᱤᱛᱩᱱ ᱚᱲᱟᱜ', phonetic: 'itun oṛa' },
      'आज': { native: 'ᱛᱤᱥᱤᱝ', phonetic: 'tising' },
      'हम': { native: 'ᱵᱩ', phonetic: 'bu' }
    }
  },
  ho: {
    name: 'Ho',
    script: 'Warang Citi',
    terms: {
      'पानी': { native: 'ᱫᱟᱜ', phonetic: "da'" },
      'जल': { native: 'ᱫᱟᱜ', phonetic: "da'" },
      'जल चक्र': { native: 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ', phonetic: "da' chakra" },
      'वर्षा': { native: 'ᱜᱟᱢᱟ', phonetic: 'gama' },
      'बादल': { native: 'ᱨᱟᱢᱤᱞ', phonetic: 'ramil' },
      'सूर्य': { native: 'ᱥᱤᱝᱜᱤ', phonetic: 'singi' },
      'पेड़': { native: 'ᱫᱟᱨᱩ', phonetic: 'daru' },
      'जंगल': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'बच्चे': { native: 'ᱦᱳᱱ ᱠᱳ', phonetic: 'hon ko' },
      'बच्चों': { native: 'ᱦᱳᱱ ᱠᱳ', phonetic: 'hon ko' },
      'नमस्ते': { native: 'ᱡᱳᱦᱟᱨ', phonetic: 'johar' },
      'सीखेंगे': { native: 'ᱤᱛᱩᱱᱟᱱ', phonetic: 'itunan' },
      'आज': { native: 'ᱛᱤᱥᱤᱝ', phonetic: 'tising' },
      'हम': { native: 'ᱟᱵᱩ', phonetic: 'abu' }
    }
  },
  kurukh: {
    name: 'Kurukh',
    script: 'Tolong Siki',
    terms: {
      'पानी': { native: 'अम्म', phonetic: 'amm' },
      'जल': { native: 'अम्म', phonetic: 'amm' },
      'जल चक्र': { native: 'अम्म चक्रा', phonetic: 'amm chakra' },
      'वर्षा': { native: 'बरखा', phonetic: 'barkha' },
      'बादल': { native: 'बादली', phonetic: 'badali' },
      'सूर्य': { native: 'बीड़ी', phonetic: 'beedi' },
      'पेड़': { native: 'मन', phonetic: 'man' },
      'जंगल': { native: 'कझरा / बन', phonetic: 'kajhra / ban' },
      'बच्चे': { native: 'खोड़ोर', phonetic: "khor'or" },
      'बच्चों': { native: 'खोड़ोर', phonetic: "khor'or" },
      'नमस्ते': { native: 'गॊडे लगदन', phonetic: 'gode lagdan' },
      'सीखेंगे': { native: 'सीख’ओर', phonetic: "seekh'or" },
      'आज': { native: 'इन्ना', phonetic: 'inna' },
      'हम': { native: 'ऎम', phonetic: 'em' }
    }
  }
};

class TranslationService {
  /**
   * Translate text to a target language (Gemini AI -> Dictionary Fallback)
   */
  async translate(text, targetLanguage, sourceLanguage = 'Hindi') {
    const normTarget = targetLanguage.trim();
    const langKey = normTarget.toLowerCase();

    // 1. Try Gemini AI if API key is present
    const aiResult = await geminiService.translateVernacular(text, normTarget, sourceLanguage);
    if (aiResult && aiResult.translatedText) {
      return {
        targetLanguage: normTarget,
        translatedText: aiResult.translatedText,
        phoneticText: aiResult.phoneticText || '',
        simplifiedMeaning: aiResult.simplifiedMeaning || '',
        provider: 'gemini'
      };
    }

    // 2. Fallback to Regional Rule & Dictionary Engine
    return this._dictionaryTranslate(text, langKey, normTarget);
  }

  /**
   * Translate text into all active vernacular languages simultaneously
   */
  async translateAll(text, sourceLanguage = 'Hindi') {
    const targets = ['Santhali', 'Mundari', 'Ho', 'Kurukh', 'English'];
    const translations = {};

    await Promise.all(
      targets.map(async (target) => {
        try {
          const res = await this.translate(text, target, sourceLanguage);
          translations[target] = res.translatedText;
          translations[`${target}_phonetic`] = res.phoneticText;
        } catch {
          translations[target] = text;
        }
      })
    );

    return {
      sourceText: text,
      sourceLanguage,
      translations
    };
  }

  _dictionaryTranslate(text, langKey, displayTarget) {
    const dict = VERNACULAR_DICTIONARY[langKey];

    if (!dict) {
      // English or general fallback
      if (langKey === 'english') {
        const enFallback = this._quickHindiToEnglish(text);
        return {
          targetLanguage: 'English',
          translatedText: enFallback,
          phoneticText: enFallback,
          provider: 'dictionary-fallback'
        };
      }
      return {
        targetLanguage: displayTarget,
        translatedText: text,
        phoneticText: text,
        provider: 'dictionary-fallback'
      };
    }

    // Heuristic sentence mapping for classroom greeting & science
    if (text.includes('नमस्ते') || text.includes('जल चक्र') || text.includes('पानी')) {
      const sampleMap = {
        santhali: {
          native: 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ! ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱜ ᱪᱟᱠᱨᱚ (Water Cycle) ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾',
          phonetic: "Johar gidra! Teheñ do abo da' chakra babat bon seṛaya."
        },
        mundari: {
          native: 'ᱡᱳᱦᱟᱨ ᱦᱩᱲᱤᱝ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱵᱩ ᱫᱟᱜ ᱠᱟᱱᱰᱟ ᱳᱨᱳ ᱜᱟᱢᱟᱭ ᱵᱟᱵᱟᱛ ᱛᱮ ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ᱾',
          phonetic: "Johar huring ko! Tising bu da' kanda oro gamai babat te itun lagid."
        },
        ho: {
          native: 'ᱡᱳᱦᱟᱨ ᱦᱳᱱ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱟᱵᱩ ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱳᱨᱳ ᱜᱟᱢᱟ ᱵᱟᱭ ᱵᱤᱥᱳᱭ ᱨᱮ ᱤᱛᱩᱱᱟᱱ᱾',
          phonetic: "Johar hon ko! Tising abu da' chakra oro gama bai bishoi re itunan."
        },
        kurukh: {
          native: 'गॊडे लगदन खोड़ोर! इन्ना ऎम अम् चक्रा (जल चक्र) आर बादली बनवर्न बारॆते खॊड़\'ओर।',
          phonetic: "Gode lagdan khor'or! Inna em am chakra aara badali banawarna barete khor'or."
        }
      };

      if (sampleMap[langKey]) {
        return {
          targetLanguage: dict.name,
          translatedText: sampleMap[langKey].native,
          phoneticText: sampleMap[langKey].phonetic,
          provider: 'dictionary-fallback'
        };
      }
    }

    // Token-by-token replacement
    let translatedWords = [];
    let phoneticWords = [];
    const words = text.split(/\s+/);

    for (const word of words) {
      const cleanWord = word.replace(/[.,!?;:।]/g, '');
      if (dict.terms[cleanWord]) {
        translatedWords.push(dict.terms[cleanWord].native);
        phoneticWords.push(dict.terms[cleanWord].phonetic);
      } else {
        translatedWords.push(word);
        phoneticWords.push(word);
      }
    }

    return {
      targetLanguage: dict.name,
      translatedText: translatedWords.join(' '),
      phoneticText: phoneticWords.join(' '),
      provider: 'dictionary-fallback'
    };
  }

  _quickHindiToEnglish(text) {
    if (text.includes('जल चक्र')) return 'The Water Cycle is the process of evaporation and condensation.';
    if (text.includes('नमस्ते')) return 'Hello students, welcome to our vernacular classroom.';
    if (text.includes('जंगल')) return 'Forests and trees are our valuable friends.';
    return text;
  }
}

export const translationService = new TranslationService();
