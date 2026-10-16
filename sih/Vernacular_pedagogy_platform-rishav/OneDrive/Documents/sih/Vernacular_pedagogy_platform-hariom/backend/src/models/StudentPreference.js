import mongoose from 'mongoose';

const studentPreferenceSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      default: 'student-demo',
      unique: true,
      index: true
    },
    language: {
      type: String,
      default: 'sat' // Default to Santhali
    },
    languageName: {
      type: String,
      default: 'Santhali'
    },
    autoPlay: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// In-memory store for instant fallback & disconnected development
const memoryPreferences = new Map();

// Default mapping of code <-> name
const codeToName = {
  hi: 'Hindi',
  sat: 'Santhali',
  unr: 'Mundari',
  hoc: 'Ho',
  kru: 'Kurukh',
  en: 'English'
};

const nameToCode = {
  hindi: 'hi',
  santhali: 'sat',
  mundari: 'unr',
  ho: 'hoc',
  kurukh: 'kru',
  english: 'en'
};

export const preferenceStore = {
  get(studentId = 'student-demo') {
    if (!memoryPreferences.has(studentId)) {
      memoryPreferences.set(studentId, {
        studentId,
        language: 'sat',
        languageName: 'Santhali',
        autoPlay: true,
        updatedAt: new Date()
      });
    }
    return memoryPreferences.get(studentId);
  },

  updateLanguage(studentId = 'student-demo', lang) {
    const current = this.get(studentId);
    const cleaned = (lang || '').toLowerCase().trim();
    let code = cleaned;
    let name = codeToName[cleaned];

    if (!name && nameToCode[cleaned]) {
      code = nameToCode[cleaned];
      name = codeToName[code];
    } else if (!name) {
      name = lang;
      code = cleaned;
    }

    const updated = {
      ...current,
      language: code,
      languageName: name,
      updatedAt: new Date()
    };
    memoryPreferences.set(studentId, updated);
    return updated;
  },

  updatePreferences(studentId = 'student-demo', prefs = {}) {
    const current = this.get(studentId);
    const updated = {
      ...current,
      ...prefs,
      updatedAt: new Date()
    };
    memoryPreferences.set(studentId, updated);
    return updated;
  }
};

export const StudentPreference = mongoose.models.StudentPreference || mongoose.model('StudentPreference', studentPreferenceSchema);
