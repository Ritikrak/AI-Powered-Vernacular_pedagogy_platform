import { geminiService } from './gemini.service.js';
import { Translation } from '../models/Translation.js';
import { CURRICULUM_STORIES } from '../data/curriculumStories.js';
import { COMMON_WORDS, findCommonWordMatch, translateTokensWithCommonWords } from '../data/commonWords.js';

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
      'धूप': { native: 'ᱥᱤᱛᱩᱝ', phonetic: 'situng' },
      'प्रकाश': { native: 'ᱢᱟᱨᱥᱟᱞ', phonetic: 'marsal' },
      'पेड़': { native: 'ᱫᱟᱨᱮ', phonetic: 'dare' },
      'पौधे': { native: 'ᱫᱟᱨᱮ-ᱱᱟᱹᱲᱤ', phonetic: 'dare-naṛi' },
      'पौधों': { native: 'ᱫᱟᱨᱮ ᱠᱚ', phonetic: 'dare ko' },
      'पत्ता': { native: 'ᱥᱟᱠᱟᱢ', phonetic: 'sakam' },
      'पत्ते': { native: 'ᱥᱟᱠᱟᱢ ᱠᱚ', phonetic: 'sakam ko' },
      'जड़': { native: 'ᱨᱮᱦᱮᱫ', phonetic: 'rehed' },
      'जड़': { native: 'ᱨᱮᱦᱮᱫ', phonetic: 'rehed' },
      'तना': { native: 'ᱰᱟᱹᱨ', phonetic: 'daṛ' },
      'फूल': { native: 'ᱵᱟᱦᱟ', phonetic: 'baha' },
      'फल': { native: 'ᱡᱚ', phonetic: 'jo' },
      'बीज': { native: 'ᱡᱟᱝ', phonetic: 'jang' },
      'जंगल': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'वन': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'नदी': { native: 'ᱜᱟᱰᱟ', phonetic: 'gada' },
      'पहाड़': { native: 'ᱵᱩᱨᱩ', phonetic: 'buru' },
      'हवा': { native: 'ᱦᱚᱭ', phonetic: 'hoy' },
      'मिट्टी': { native: 'ᱦᱟᱥᱟ', phonetic: 'hasa' },
      'बच्चे': { native: 'ᱜᱤᱫᱽᱨᱟᱹ', phonetic: 'gidra' },
      'बच्चों': { native: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ', phonetic: 'gidra ko' },
      'विद्यार्थी': { native: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱚ', phonetic: 'paṭhua ko' },
      'छात्र': { native: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ', phonetic: 'paṭhua' },
      'शिक्षक': { native: 'ᱢᱟᱪᱮᱛ', phonetic: 'machet' },
      'गुरुजी': { native: 'ᱜᱩᱨᱩᱡᱤ', phonetic: 'guruji' },
      'नमस्कार': { native: 'ᱡᱚᱦᱟᱨ', phonetic: 'johar' },
      'नमस्ते': { native: 'ᱡᱚᱦᱟᱨ', phonetic: 'johar' },
      'जोहार': { native: 'ᱡᱚᱦᱟᱨ', phonetic: 'johar' },
      'सीखना': { native: 'ᱥᱮᱬᱟ', phonetic: 'seṛa' },
      'सीखेंगे': { native: 'ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ', phonetic: 'bon seṛaya' },
      'पढ़ना': { native: 'ᱯᱟᱲᱦᱟᱣ', phonetic: 'paṛhao' },
      'पढ़ो': { native: 'ᱯᱟᱲᱦᱟᱣ ᱢᱮ', phonetic: 'paṛhao me' },
      'लिखना': { native: 'ᱚᱞ', phonetic: 'ol' },
      'लिखो': { native: 'ᱚᱞ ᱢᱮ', phonetic: 'ol me' },
      'किताब': { native: 'ᱯᱩᱛᱷᱤ', phonetic: 'puthi' },
      'पाठ': { native: 'ᱯᱟᱴᱷ', phonetic: 'paṭh' },
      'स्कूल': { native: 'ᱟᱥᱲᱟ', phonetic: 'asṛa' },
      'विद्यालय': { native: 'ᱟᱥᱲᱟ', phonetic: 'asṛa' },
      'कक्षा': { native: 'ᱪᱟᱱᱟᱪ', phonetic: 'chanach' },
      'सवाल': { native: 'ᱠᱩᱠᱞᱤ', phonetic: 'kukli' },
      'प्रश्न': { native: 'ᱠᱩᱠᱞᱤ', phonetic: 'kukli' },
      'उत्तर': { native: 'ᱛᱮᱞᱟ', phonetic: 'tela' },
      'जवाब': { native: 'ᱛᱮᱞᱟ', phonetic: 'tela' },
      'भोजन': { native: 'ᱡᱚᱢᱟᱜ', phonetic: "joma'" },
      'खाना': { native: 'ᱡᱚᱢᱟᱜ', phonetic: "joma'" },
      'जीवित': { native: 'ᱵᱟᱧᱪᱟᱣ', phonetic: 'bañchao' },
      'प्रक्रिया': { native: 'ᱦᱚᱨᱟ', phonetic: 'hora' },
      'आवश्यकता': { native: 'ᱞᱟᱹᱠᱛᱤ', phonetic: 'lakti' },
      'जरूरी': { native: 'ᱞᱟᱹᱠᱛᱤᱭᱟᱱ', phonetic: 'laktian' },
      'महत्वपूर्ण': { native: 'ᱢᱩᱬᱩᱛ', phonetic: 'muṛut' },
      'आज': { native: 'ᱛᱮᱦᱮᱧ', phonetic: 'teheñ' },
      'हम': { native: 'ᱟᱵᱚ', phonetic: 'abo' },
      'आप': { native: 'ᱟᱯᱮ', phonetic: 'ape' },
      'तुम': { native: 'ᱟᱢ', phonetic: 'am' },
      'है': { native: 'ᱠᱟᱱᱟ', phonetic: 'kana' },
      'हैं': { native: 'ᱠᱟᱱᱟ ᱠᱚ', phonetic: 'kana ko' },
      'था': { native: 'ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ', phonetic: 'taheñ kana' },
      'थे': { native: 'ᱠᱚ ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ', phonetic: 'ko taheñ kana' },
      'अच्छा': { native: 'ᱵᱷᱟᱹᱜᱤ', phonetic: 'bhagi' },
      'बहुत बढ़िया': { native: 'ᱟᱹᱰᱤ ᱵᱷᱟᱹᱜᱤ', phonetic: 'aḍi bhagi' },
      'धन्यवाद': { native: 'ᱥᱟᱨᱦᱟᱣ', phonetic: 'sarhao' }
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
      'बारिश': { native: 'बरखा', phonetic: 'barkha' },
      'बादल': { native: 'बादली', phonetic: 'badali' },
      'सूर्य': { native: 'बीड़ी', phonetic: 'beedi' },
      'सूरज': { native: 'बीड़ी', phonetic: 'beedi' },
      'धूप': { native: 'बीड़ी किड़ा', phonetic: 'beedi kida' },
      'प्रकाश': { native: 'उजरा', phonetic: 'ujra' },
      'पेड़': { native: 'मन', phonetic: 'man' },
      'पौधे': { native: 'मन-मन्न', phonetic: 'man-mann' },
      'पौधों': { native: 'मन-मन्न', phonetic: 'man-mann' },
      'पत्ता': { native: 'अट्ठ', phonetic: 'atth' },
      'पत्ते': { native: 'अट्ठ गुठ्ठी', phonetic: 'atth gutthi' },
      'जड़': { native: 'मूर', phonetic: 'moor' },
      'जड़': { native: 'मूर', phonetic: 'moor' },
      'फूल': { native: 'पुंप', phonetic: 'pump' },
      'फल': { native: 'फल', phonetic: 'phal' },
      'बीज': { native: 'बीची', phonetic: 'beechi' },
      'जंगल': { native: 'कझरा / बन', phonetic: 'kajhra / ban' },
      'वन': { native: 'कझरा / बन', phonetic: 'kajhra / ban' },
      'नदी': { native: 'खोला', phonetic: 'khola' },
      'पहाड़': { native: 'टोंगरी / पार्ट', phonetic: 'tongri / paart' },
      'हवा': { native: 'ताका', phonetic: 'taaka' },
      'मिट्टी': { native: 'खॆक्खल', phonetic: 'khekhal' },
      'बच्चे': { native: 'खोड़ोर', phonetic: "khor'or" },
      'बच्चों': { native: 'खोड़ोर', phonetic: "khor'or" },
      'विद्यार्थी': { native: 'पढ़ुआ खोड़ोर', phonetic: "padhua khor'or" },
      'शिक्षक': { native: 'मास्टर / पढाबुर', phonetic: 'pardhabur' },
      'नमस्कार': { native: 'गॊडे लगदन', phonetic: 'gode lagdan' },
      'नमस्ते': { native: 'गॊडे लगदन', phonetic: 'gode lagdan' },
      'जोहार': { native: 'जोहार', phonetic: 'johar' },
      'सीखना': { native: 'सीखना', phonetic: 'seekhna' },
      'सीखेंगे': { native: 'सीख’ओर', phonetic: "seekh'or" },
      'पढ़ना': { native: 'पढ़ना', phonetic: 'padhna' },
      'पढ़ो': { native: 'पढ़ा', phonetic: 'padha' },
      'लिखना': { native: 'टूँडना', phonetic: 'toondna' },
      'लिखो': { native: 'टूँडा', phonetic: 'toonda' },
      'किताब': { native: 'पोथी', phonetic: 'pothi' },
      'पाठ': { native: 'पाठ', phonetic: 'paath' },
      'स्कूल': { native: 'स्कूल / एड़पा', phonetic: 'edpa' },
      'सवाल': { native: 'मेंजना', phonetic: 'menjna' },
      'प्रश्न': { native: 'मेंजना', phonetic: 'menjna' },
      'उत्तर': { native: 'जवाब', phonetic: 'jawab' },
      'जवाब': { native: 'जवाब', phonetic: 'jawab' },
      'भोजन': { native: 'मण्डी', phonetic: 'mandi' },
      'खाना': { native: 'मण्डी', phonetic: 'mandi' },
      'जीवित': { native: 'उज्जना', phonetic: 'ujjna' },
      'प्रक्रिया': { native: 'काम', phonetic: 'kaam' },
      'आवश्यकता': { native: 'जरूरत', phonetic: 'zaroorat' },
      'जरूरी': { native: 'जरूरी', phonetic: 'zaroori' },
      'महत्वपूर्ण': { native: 'बड़ी जरूरी', phonetic: 'badi zaroori' },
      'आज': { native: 'इन्ना', phonetic: 'inna' },
      'हम': { native: 'ऎम', phonetic: 'em' },
      'आप': { native: 'नीम', phonetic: 'neem' },
      'तुम': { native: 'नीन', phonetic: 'neen' },
      'है': { native: 'रई', phonetic: 'rai' },
      'हैं': { native: 'नर', phonetic: 'nar' },
      'था': { native: 'रहचा', phonetic: 'rahcha' },
      'थे': { native: 'रहचर', phonetic: 'rahchar' },
      'अच्छा': { native: 'दाव', phonetic: 'daaw' },
      'बहुत बढ़िया': { native: 'बड़ी दाव', phonetic: 'badi daaw' },
      'धन्यवाद': { native: 'धन्यबाद', phonetic: 'dhanyawad' }
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
      'पौधे': { native: 'ᱫᱟᱨᱩ ᱠᱳ', phonetic: 'daru ko' },
      'जंगल': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'हवा': { native: 'ᱦᱚᱭ', phonetic: 'hoy' },
      'मिट्टी': { native: 'ᱦᱟᱥᱟ', phonetic: 'hasa' },
      'बच्चे': { native: 'ᱦᱩᱲᱤᱝ ᱠᱳ', phonetic: 'huring ko' },
      'बच्चों': { native: 'ᱦᱩᱲᱤᱝ ᱠᱳ', phonetic: 'huring ko' },
      'नमस्ते': { native: 'ᱡᱳᱦᱟᱨ', phonetic: 'johar' },
      'सीखेंगे': { native: 'ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ', phonetic: 'itun lagid' },
      'पढ़ना': { native: 'ᱯᱟᱲᱦᱟᱣ', phonetic: 'paṛhao' },
      'स्कूल': { native: 'ᱤᱛᱩᱱ ᱚᱲᱟᱜ', phonetic: "itun oṛa'" },
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
      'बारिश': { native: 'ᱜᱟᱢᱟ', phonetic: 'gama' },
      'बादल': { native: 'ᱨᱟᱢᱤᱞ', phonetic: 'ramil' },
      'सूर्य': { native: 'ᱥᱤᱝᱜᱤ', phonetic: 'singi' },
      'सूरज': { native: 'ᱥᱤᱝᱜᱤ', phonetic: 'singi' },
      'पेड़': { native: 'ᱫᱟᱨᱩ', phonetic: 'daru' },
      'पौधे': { native: 'ᱫᱟᱨᱩ ᱠᱳ', phonetic: 'daru ko' },
      'जंगल': { native: 'ᱵᱤᱨ', phonetic: 'bir' },
      'हवा': { native: 'ᱦᱚᱭ', phonetic: 'hoy' },
      'मिट्टी': { native: 'ᱦᱟᱥᱟ', phonetic: 'hasa' },
      'बच्चे': { native: 'ᱦᱳᱱ ᱠᱳ', phonetic: 'hon ko' },
      'बच्चों': { native: 'ᱦᱳᱱ ᱠᱳ', phonetic: 'hon ko' },
      'नमस्ते': { native: 'ᱡᱳᱦᱟᱨ', phonetic: 'johar' },
      'सीखेंगे': { native: 'ᱤᱛᱩᱱᱟᱱ', phonetic: 'itunan' },
      'पढ़ना': { native: 'ᱯᱟᱲᱦᱟᱣ', phonetic: 'paṛhao' },
      'स्कूल': { native: 'ᱤᱛᱩᱱ ᱚᱲᱟᱜ', phonetic: "itun oṛa'" },
      'आज': { native: 'ᱛᱤᱥᱤᱝ', phonetic: 'tising' },
      'हम': { native: 'ᱟᱵᱩ', phonetic: 'abu' }
    }
  }
};

class TranslationService {
  /**
   * Translate text to a target language (Pre-stored vocabulary -> Curriculum match -> Gemini AI -> Dictionary Fallback)
   */
  async translate(text, targetLanguage, sourceLanguage = 'Hindi') {
    if (!text || !text.trim()) {
      return {
        targetLanguage,
        translatedText: '',
        phoneticText: '',
        provider: 'empty'
      };
    }

    const normTarget = targetLanguage.trim();
    const langKey = normTarget.toLowerCase();
    const targetCap = normTarget.charAt(0).toUpperCase() + normTarget.slice(1).toLowerCase();

    // 0. Pre-stored common words vocabulary (Instant exact single-word match)
    const commonMatch = findCommonWordMatch(text);
    if (commonMatch) {
      const trans = commonMatch.translations[targetCap] || commonMatch.translations.English;
      if (trans) {
        return {
          targetLanguage: targetCap,
          translatedText: trans.text,
          phoneticText: trans.phonetic,
          simplifiedMeaning: commonMatch.english,
          provider: 'pre-stored-vocabulary'
        };
      }
    }

    // 1. Check pre-compiled high-quality curriculum stories
    const cleanText = text.trim();
    const matchedStory = CURRICULUM_STORIES.find((s) => {
      return (
        (s.title && s.title.toLowerCase().includes(cleanText.toLowerCase())) ||
        (s.sourceText && (s.sourceText.includes(cleanText) || cleanText.includes(s.sourceText.slice(0, 30)))) ||
        (s.simplifiedText && (s.simplifiedText.includes(cleanText) || cleanText.includes(s.simplifiedText.slice(0, 30))))
      );
    });

    if (matchedStory && matchedStory.translations) {
      const tr = matchedStory.translations.find(
        (t) => t.language.toLowerCase() === langKey || t.language.toLowerCase() === normTarget.toLowerCase()
      );
      if (tr) {
        return {
          targetLanguage: normTarget,
          translatedText: tr.translated_text,
          phoneticText: tr.phonetic_text || '',
          simplifiedMeaning: matchedStory.simplifiedText || '',
          provider: 'pre-compiled-curriculum'
        };
      }
    }

    // 2. Try token translation only if all or majority of words match vocabulary
    const tokenMatch = translateTokensWithCommonWords(text, targetCap);
    if (tokenMatch) {
      return {
        targetLanguage: targetCap,
        translatedText: tokenMatch.translatedText,
        phoneticText: tokenMatch.phoneticText,
        simplifiedMeaning: '',
        provider: 'pre-stored-vocabulary'
      };
    }

    // 3. Try Gemini AI if API key is present
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

    // 4. Fallback to Regional Rule & Dictionary Engine
    return this._dictionaryTranslate(text, langKey, normTarget);
  }

  /**
   * Translate text into all active vernacular languages simultaneously
   */
  async translateAll(text, sourceLanguage = 'Hindi') {
    const targets = ['Santhali', 'Mundari', 'Ho', 'Kurukh', 'English'];
    const translations = {};

    if (!text || !text.trim()) {
      targets.forEach(t => {
        translations[t] = '';
        translations[`${t}_phonetic`] = '';
      });
      return { sourceText: '', sourceLanguage, translations };
    }

    // 0. Quick exact common word check
    const commonMatch = findCommonWordMatch(text);
    if (commonMatch) {
      for (const target of targets) {
        const trans = commonMatch.translations[target] || commonMatch.translations.English;
        translations[target] = trans.text;
        translations[`${target}_phonetic`] = trans.phonetic;
      }
      return {
        sourceText: text,
        sourceLanguage,
        translations,
        provider: 'pre-stored-vocabulary',
        wordId: commonMatch.id,
        category: commonMatch.category
      };
    }

    // Parallel translation across all targets
    await Promise.all(
      targets.map(async (target) => {
        try {
          const res = await this.translate(text, target, sourceLanguage);
          translations[target] = res.translatedText;
          translations[`${target}_phonetic`] = res.phoneticText || '';
        } catch {
          translations[target] = text;
          translations[`${target}_phonetic`] = text;
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

    // High-fidelity pedagogical sentence heuristics for classroom speech
    const cleanLower = text.toLowerCase();

    // 1. Photosynthesis
    if (cleanLower.includes('photosynthesis') || cleanLower.includes('प्रकाश संश्लेषण')) {
      const pMap = {
        santhali: {
          native: 'Photosynthesis ᱫᱚ ᱚᱱᱟ ᱦᱚᱨᱟ ᱠᱟᱱᱟ ᱡᱟᱦᱟᱸ ᱛᱮ ᱫᱟᱨᱮ ᱠᱚ ᱥᱤᱧ ᱪᱟᱸᱫᱚ ᱥᱤᱛᱩᱝ ᱛᱮ ᱡᱚᱢᱟᱜ ᱠᱚ ᱛᱮᱭᱟᱨᱟ᱾',
          phonetic: "Photosynthesis do ona hora kana jaha te dare ko siñ chando situng te joma' ko teyara."
        },
        kurukh: {
          native: 'Photosynthesis अदी तली एकानू मन बीड़ी किड़ा आर अम्म ती मण्डी कम’ओर।',
          phonetic: "Photosynthesis adi tali ekaanu man beedi kida aara amm tee mandi kam'or."
        },
        mundari: {
          native: 'Photosynthesis ᱫᱚ ᱥᱤᱝᱜᱤ ᱢᱟᱨᱥᱟᱞ ᱛᱮ ᱫᱟᱨᱩ ᱠᱳ ᱡᱚᱢᱟᱜ ᱛᱮᱭᱟᱨ ᱦᱚᱨᱟ ᱠᱟᱱᱟ᱾',
          phonetic: "Photosynthesis do singi marsal te daru ko joma' teyar hora kana."
        },
        ho: {
          native: 'Photosynthesis ᱫᱚ ᱥᱤᱝᱜᱤ ᱢᱟᱨᱥᱟᱞ ᱛᱮ ᱫᱟᱨᱩ ᱠᱳ ᱡᱚᱢᱟᱜ ᱵᱟᱭ ᱦᱚᱨᱟ ᱠᱟᱱᱟ᱾',
          phonetic: "Photosynthesis do singi marsal te daru ko joma' bai hora kana."
        }
      };
      if (pMap[langKey]) {
        return {
          targetLanguage: dict.name,
          translatedText: pMap[langKey].native,
          phoneticText: pMap[langKey].phonetic,
          provider: 'pedagogical-sentence-engine'
        };
      }
    }

    // 2. Plants / Trees lesson greeting
    if (cleanLower.includes('पौधों') || cleanLower.includes('पौधे') || cleanLower.includes('पेड़ों') || cleanLower.includes('plants')) {
      if (cleanLower.includes('जीवित') || cleanLower.includes('प्रकाश') || cleanLower.includes('आवश्यकता')) {
        const surviveMap = {
          santhali: {
            native: 'ᱫᱟᱨᱮ ᱠᱚ ᱵᱟᱧᱪᱟᱣ ᱛᱟᱦᱮᱸᱱ ᱞᱟᱹᱜᱤᱫ ᱥᱤᱧ ᱪᱟᱸᱫᱚ ᱨᱮᱱᱟᱜ ᱥᱤᱛᱩᱝ ᱟᱨ ᱫᱟᱜ ᱞᱟᱹᱠᱛᱤᱜ-ᱟ᱾',
            phonetic: "Dare ko bañchao tahen lagid siñ chando renag situng ar da' laktig-a."
          },
          kurukh: {
            native: 'मन आर मन्न गने जियागे बीड़ी किड़ा आर अम्म चाही।',
            phonetic: "Man aara mann gane jiyage beedi kida aara amm chaahi."
          },
          mundari: {
            native: 'ᱫᱟᱨᱩ ᱠᱳ ᱵᱟᱧᱪᱟᱣ ᱞᱟᱹᱜᱤᱫ ᱥᱤᱝᱜᱤ ᱥᱤᱛᱩᱝ ᱟᱨ ᱫᱟᱜ ᱞᱟᱹᱠᱛᱤᱭᱟ᱾',
            phonetic: "Daru ko bañchao lagid singi situng ar da' laktiya."
          },
          ho: {
            native: 'ᱫᱟᱨᱩ ᱠᱳ ᱡᱤᱣᱤᱫ ᱞᱟᱹᱜᱤᱫ ᱥᱤᱝᱜᱤ ᱥᱤᱛᱩᱝ ᱟᱨ ᱫᱟᱜ ᱞᱟᱹᱠᱛᱤᱭᱟ᱾',
            phonetic: "Daru ko jiwid lagid singi situng ar da' laktiya."
          }
        };
        if (surviveMap[langKey]) {
          return {
            targetLanguage: dict.name,
            translatedText: surviveMap[langKey].native,
            phoneticText: surviveMap[langKey].phonetic,
            provider: 'pedagogical-sentence-engine'
          };
        }
      }

      const plantIntroMap = {
        santhali: {
          native: 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ! ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱨᱮ-ᱱᱟᱹᱲᱤ ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾',
          phonetic: "Johar gidra ko! Teheñ do abo dare-naṛi babat bon seṛaya."
        },
        kurukh: {
          native: 'गॊडे लगदन खोड़ोर! इन्ना ऎम मन आर दारे बारॆते सीख’ओर।',
          phonetic: "Gode lagdan khor'or! Inna em man aara dare barete seekh'or."
        },
        mundari: {
          native: 'ᱡᱳᱦᱟᱨ ᱦᱩᱲᱤᱝ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱵᱩ ᱫᱟᱨᱩ ᱠᱳ ᱵᱟᱵᱟᱛ ᱛᱮ ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ᱾',
          phonetic: "Johar huring ko! Tising bu daru ko babat te itun lagid."
        },
        ho: {
          native: 'ᱡᱳᱦᱟᱨ ᱦᱳᱱ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱟᱵᱩ ᱫᱟᱨᱩ ᱵᱤᱥᱳᱭ ᱨᱮ ᱤᱛᱩᱱᱟᱱ᱾',
          phonetic: "Johar hon ko! Tising abu daru bishoi re itunan."
        }
      };
      if (plantIntroMap[langKey]) {
        return {
          targetLanguage: dict.name,
          translatedText: plantIntroMap[langKey].native,
          phoneticText: plantIntroMap[langKey].phonetic,
          provider: 'pedagogical-sentence-engine'
        };
      }
    }

    // 3. Water Cycle & Rain
    if (cleanLower.includes('जल चक्र') || cleanLower.includes('water cycle') || (cleanLower.includes('पानी') && cleanLower.includes('वाष्पीकरण'))) {
      const waterCycleMap = {
        santhali: {
          native: 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱨᱮ ᱵᱷᱟᱯ ᱟᱨ ᱫᱟᱜ ᱡᱟᱹᱲᱤ ᱡᱚᱛᱚ ᱠᱷᱚᱱ ᱢᱩᱬᱩᱛ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ᱾',
          phonetic: "Da' chakra re bhap oro da' jaṛi joto khon muṛut kami kana."
        },
        kurukh: {
          native: 'अम्म चक्रा नू अम्म बाफ मनना आर बरखा मनना सबसे जरूरी बात तली।',
          phonetic: "Amm chakra nu amm baaf man'na aara barkha man'na sabse zaroori baat tali."
        },
        mundari: {
          native: 'ᱫᱟᱜ ᱠᱟᱱᱰᱟ ᱨᱮ ᱨᱤᱢᱤᱞ ᱳᱨᱳ ᱜᱟᱢᱟ ᱢᱩᱬᱩᱛ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ᱾',
          phonetic: "Da' kanda re rimil oro gama muṛut kami kana."
        },
        ho: {
          native: 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱨᱮ ᱨᱟᱢᱤᱞ ᱳᱨᱳ ᱜᱟᱢᱟ ᱢᱩᱬᱩᱛ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟ᱾',
          phonetic: "Da' chakra re ramil oro gama muṛut kami kana."
        }
      };
      if (waterCycleMap[langKey]) {
        return {
          targetLanguage: dict.name,
          translatedText: waterCycleMap[langKey].native,
          phoneticText: waterCycleMap[langKey].phonetic,
          provider: 'pedagogical-sentence-engine'
        };
      }
    }

    // 4. Birsa Munda & Jharkhand Freedom
    if (cleanLower.includes('बिरसा मुंडा') || cleanLower.includes('birsa munda')) {
      const birsaMap = {
        santhali: {
          native: 'ᱵᱤᱨᱥᱟ ᱢᱩᱱᱰᱟ ᱫᱚ ᱡᱷᱟᱨᱠᱷᱚᱸᱰ ᱨᱤᱱᱤᱡ ᱢᱟᱨᱟᱝ ᱯᱷᱩᱨᱜᱟᱹᱞ ᱞᱟᱹᱲᱦᱟᱹᱭᱤᱭᱟᱹ ᱟᱨ ᱫᱷᱟᱹᱨᱛᱤ ᱟᱵᱟ ᱠᱟᱱᱟᱭ᱾',
          phonetic: 'Birsa Munda do Jharkhand rinij marang phurgal laṛhaiyia ar Dharti Aba kanaye.'
        },
        kurukh: {
          native: 'बिरसा मुंडा झारखण्ड ता महान आज़ादी लडुआ आर धरती आबा रहचस।',
          phonetic: 'Birsa Munda Jharkhand ta mahan azadi laduwa aara Dharti Aba rahcjas.'
        },
        mundari: {
          native: 'ᱵᱤᱨᱥᱟ ᱢᱩᱱᱰᱟ ᱫᱚ ᱡᱷᱟᱨᱠᱷᱚᱸᱰ ᱨᱤᱱᱤᱡ ᱫᱷᱟᱹᱨᱛᱤ ᱟᱵᱟ ᱠᱟᱱᱟᱭ᱾',
          phonetic: 'Birsa Munda do Jharkhand rinij Dharti Aba kanaye.'
        },
        ho: {
          native: 'ᱵᱤᱨᱥᱟ ᱢᱩᱱᱰᱟ ᱫᱚ ᱟᱵᱩ ᱡᱷᱟᱨᱠᱷᱚᱸᱰ ᱨᱤᱱᱤᱡ ᱯᱷᱩᱨᱜᱟᱹᱞ ᱞᱟᱹᱲᱦᱟᱹᱭᱤᱭᱟᱹ ᱠᱟᱱᱟᱭ᱾',
          phonetic: 'Birsa Munda do abu Jharkhand rinij phurgal laṛhaiyia kanaye.'
        }
      };
      if (birsaMap[langKey]) {
        return {
          targetLanguage: dict.name,
          translatedText: birsaMap[langKey].native,
          phoneticText: birsaMap[langKey].phonetic,
          provider: 'pedagogical-sentence-engine'
        };
      }
    }

    // 5. Question from student: "photosynthesis samajh nahi aaya" or "जल चक्र क्या है?"
    if (cleanLower.includes('samajh nahi') || cleanLower.includes('समझ नहीं') || cleanLower.includes('क्या है') || cleanLower.includes('ᱪᱮᱫ ᱠᱟᱱᱟ')) {
      if (cleanLower.includes('ᱫᱟᱜ') || cleanLower.includes('जल चक्र') || cleanLower.includes('पानी')) {
        return {
          targetLanguage: dict.name,
          translatedText: langKey === 'santhali' ? 'ᱫᱟᱜ ᱪᱟᱠᱨᱚ ᱫᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?' : 'अम्म चक्रा एंदरा तली?',
          phoneticText: langKey === 'santhali' ? "Da' chakra do ched kana?" : 'Amm chakra endra tali?',
          provider: 'pedagogical-sentence-engine'
        };
      }
    }

    // 6. General Classroom Greeting
    if (cleanLower.includes('नमस्ते') || cleanLower.includes('good morning') || cleanLower.includes('जोहार')) {
      const generalGreetingMap = {
        santhali: {
          native: 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ! ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱥᱮᱬᱟ ᱞᱟᱹᱜᱤᱫ ᱵᱚᱱ ᱡᱟᱣᱨᱟ ᱟᱠᱟᱱᱟ᱾',
          phonetic: 'Johar gidra ko! Teheñ do abo seṛa lagid bon jawra akana.'
        },
        kurukh: {
          native: 'गॊडे लगदन खोड़ोर! इन्ना ऎम सीखना बारॆते जूड’ओर।',
          phonetic: "Gode lagdan khor'or! Inna em seekhna barete jood'or."
        },
        mundari: {
          native: 'ᱡᱳᱦᱟᱨ ᱦᱩᱲᱤᱝ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱵᱩ ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ ᱡᱩᱲᱟᱣ ᱟᱠᱟᱱᱟ᱾',
          phonetic: 'Johar huring ko! Tising bu itun lagid judao akana.'
        },
        ho: {
          native: 'ᱡᱳᱦᱟᱨ ᱦᱳᱱ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱟᱵᱩ ᱤᱛᱩᱱᱟᱱ ᱞᱟᱜᱤᱫ ᱡᱩᱲᱟᱣ ᱟᱠᱟᱱᱟ᱾',
          phonetic: 'Johar hon ko! Tising abu itunan lagid judao akana.'
        }
      };
      if (generalGreetingMap[langKey]) {
        return {
          targetLanguage: dict.name,
          translatedText: generalGreetingMap[langKey].native,
          phoneticText: generalGreetingMap[langKey].phonetic,
          provider: 'pedagogical-sentence-engine'
        };
      }
    }

    // 7. Token-by-token replacement for arbitrary sentences
    let translatedWords = [];
    let phoneticWords = [];
    const words = text.split(/\s+/);

    for (const word of words) {
      const cleanWord = word.replace(/[.,!?;:।_'"()\-]/g, '');
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
    if (!text) return '';
    const match = findCommonWordMatch(text);
    if (match) return match.english;
    const lower = text.toLowerCase();
    if (lower.includes('जल चक्र') || lower.includes('वाष्पीकरण')) {
      return 'The Water Cycle is the process of evaporation, condensation, and rain.';
    }
    if (lower.includes('पौधों') || lower.includes('पेड़') || lower.includes('plants')) {
      if (lower.includes('सूर्य') || lower.includes('जीवित')) {
        return 'Plants need sunlight and water to make food and survive.';
      }
      return 'Good morning students! Today we will learn about plants and trees.';
    }
    if (lower.includes('बिरसा मुंडा')) {
      return 'Birsa Munda was a legendary tribal freedom fighter and folk hero of Jharkhand.';
    }
    if (lower.includes('नमस्ते') || lower.includes('हैलो')) {
      return 'Hello students, welcome to our vernacular pedagogy classroom.';
    }
    if (lower.includes('photosynthesis')) {
      return 'Photosynthesis is the process by which green plants synthesize nutrients using sunlight.';
    }
    return text;
  }
}

export const translationService = new TranslationService();
