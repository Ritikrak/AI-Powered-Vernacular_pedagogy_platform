import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema(
  {
    language_code: {
      type: String,
      required: true,
      unique: true
    },
    language_name: {
      type: String,
      required: true
    },
    native_name: {
      type: String,
      required: true
    },
    supported_scripts: [String],
    is_active: {
      type: Boolean,
      default: true
    },
    sample_phrase: {
      source: String,
      translated: String,
      phonetic: String
    }
  },
  {
    timestamps: true
  }
);

export const defaultLanguages = [
  {
    id: 1,
    language_code: 'sat',
    language_name: 'Santhali',
    native_name: 'संथाली / ᱥᱟᱱᱛᱟᱲᱤ',
    supported_scripts: ['Ol Chiki', 'Latin', 'Devanagari'],
    is_active: true,
    sample_phrase: {
      source: 'नमस्ते बच्चों! आज हम विज्ञान सीखेंगे।',
      translated: 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ! ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱵᱤᱜᱽᱭᱟᱱ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾',
      phonetic: 'Johar gidra! Teheñ do abo bigyan bon seṛaya.'
    }
  },
  {
    id: 2,
    language_code: 'unr',
    language_name: 'Mundari',
    native_name: 'मुंडारी / ᱢᱩᱱᱰᱟᱨᱤ',
    supported_scripts: ['Mundari Bani', 'Devanagari', 'Latin'],
    is_active: true,
    sample_phrase: {
      source: 'नमस्ते बच्चों! आज हम विज्ञान सीखेंगे।',
      translated: 'ᱡᱳᱦᱟᱨ ᱦᱩᱲᱤᱝ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱵᱩ ᱵᱤᱜᱽᱭᱟᱱ ᱤᱛᱩᱱ ᱞᱟᱜᱤᱫ᱾',
      phonetic: 'Johar huring ko! Tising bu bigyan itun lagid.'
    }
  },
  {
    id: 3,
    language_code: 'hoc',
    language_name: 'Ho',
    native_name: 'हो / ᱦᱳ',
    supported_scripts: ['Warang Citi', 'Devanagari', 'Latin'],
    is_active: true,
    sample_phrase: {
      source: 'नमस्ते बच्चों! आज हम विज्ञान सीखेंगे।',
      translated: 'ᱡᱳᱦᱟᱨ ᱦᱳᱱ ᱠᱳ! ᱛᱤᱥᱤᱝ ᱟᱵᱩ ᱵᱤᱜᱽᱭᱟᱱ ᱤᱛᱩᱱᱟᱱ᱾',
      phonetic: 'Johar hon ko! Tising abu bigyan itunan.'
    }
  },
  {
    id: 4,
    language_code: 'kru',
    language_name: 'Kurukh',
    native_name: 'कुड़ुख़ / ᱠᱩᱲᱩᱠᱷ',
    supported_scripts: ['Tolong Siki', 'Devanagari'],
    is_active: true,
    sample_phrase: {
      source: 'नमस्ते बच्चों! आज हम विज्ञान सीखेंगे।',
      translated: 'गॊडे लगदन खोड़ोर! इन्ना ऎम विज्ञान सीख’ओर।',
      phonetic: 'Gode lagdan khor\'or! Inna em vigyan seekh\'or.'
    }
  },
  {
    id: 5,
    language_code: 'hi',
    language_name: 'Hindi',
    native_name: 'हिंदी',
    supported_scripts: ['Devanagari'],
    is_active: true,
    sample_phrase: {
      source: 'नमस्ते बच्चों! आज हम विज्ञान सीखेंगे।',
      translated: 'नमस्ते बच्चों! आज हम विज्ञान सीखेंगे।',
      phonetic: 'Namaste bachon! Aaj hum vigyan seekhenge.'
    }
  },
  {
    id: 6,
    language_code: 'en',
    language_name: 'English',
    native_name: 'English',
    supported_scripts: ['Latin'],
    is_active: true,
    sample_phrase: {
      source: 'नमस्ते बच्चों! आज हम विज्ञान सीखेंगे।',
      translated: 'Hello children! Today we will learn science.',
      phonetic: 'Hello children! Today we will learn science.'
    }
  }
];

export const Language = mongoose.models.Language || mongoose.model('Language', languageSchema);
