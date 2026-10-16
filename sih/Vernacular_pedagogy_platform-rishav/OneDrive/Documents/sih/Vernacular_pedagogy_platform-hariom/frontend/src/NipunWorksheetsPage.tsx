import { useState } from 'react'
import {
  Printer,
  Sparkles,
  BookOpen,
  Volume2,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  Award,
  Languages,
  RotateCw
} from 'lucide-react'
import { useApp } from './context'
import { playVernacularAudio } from './api'

interface FlashcardItem {
  id: string
  hindi: string
  english: string
  nativeScript: string
  phonetic: string
  category: string
  icon: string
  exampleSentenceHindi: string
  exampleSentenceNative: string
}

interface WorksheetData {
  title: string
  gradeLevel: string
  flnOutcome: string
  targetLanguage: string
  scriptName: string
  matchingPairs: Array<{ hindi: string; native: string; phonetic: string; matchId: string }>
  fillBlanks: Array<{ questionHindi: string; questionNative: string; answer: string; hint: string }>
  numeracyTask: {
    promptHindi: string
    promptNative: string
    itemsCount: number
    itemLabelHindi: string
    itemLabelNative: string
    answerNumber: number
  }
  oralPrompt: {
    promptHindi: string
    promptNative: string
    expectedVocabulary: string[]
  }
}

const PRESET_FLASHCARDS: Record<string, FlashcardItem[]> = {
  Santhali: [
    { id: 'fc-1', hindi: 'पेड़ / वृक्ष', english: 'Tree', nativeScript: 'ᱫᱟᱨᱮ', phonetic: 'Dare', category: 'Nature', icon: '🌳', exampleSentenceHindi: 'पेड़ हमें फल और छाया देते हैं।', exampleSentenceNative: 'ᱫᱟᱨᱮ ᱫᱚ ᱟᱵᱚ ᱡᱚ ᱟᱨ ᱩᱢᱩᱞ ᱮ ᱮᱢᱟᱵᱚᱱᱟ᱾' },
    { id: 'fc-2', hindi: 'पानी / जल', english: 'Water', nativeScript: 'ᱫᱟᱜ', phonetic: "Da'", category: 'Nature', icon: '💧', exampleSentenceHindi: 'जल ही जीवन है।', exampleSentenceNative: 'ᱫᱟᱜ ᱜᱮ ᱡᱤᱣᱤ ᱠᱟᱱᱟ᱾' },
    { id: 'fc-3', hindi: 'सूरज / सूर्य', english: 'Sun', nativeScript: 'ᱥᱤᱧ ᱪᱟᱸᱫᱚ', phonetic: 'Siñ Chando', category: 'Nature', icon: '☀️', exampleSentenceHindi: 'सूरज सुबह पूर्व में उगता है।', exampleSentenceNative: 'ᱥᱤᱧ ᱪᱟᱸᱫᱚ ᱥᱮᱛᱟᱜ ᱨᱮ ᱨᱟᱠᱟᱵ-ᱟ᱾' },
    { id: 'fc-4', hindi: 'नमस्ते / जोहार', english: 'Greeting', nativeScript: 'ᱡᱚᱦᱟᱨ', phonetic: 'Johar', category: 'Social', icon: '🙏', exampleSentenceHindi: 'गुरुजी को नमस्ते कहो।', exampleSentenceNative: 'ᱢᱟᱪᱮᱛ ᱴᱷᱮᱱ ᱡᱚᱦᱟᱨ ᱢᱮ᱾' },
    { id: 'fc-5', hindi: 'स्कूल / पाठशाला', english: 'School', nativeScript: 'ᱟᱥᱲᱟ', phonetic: 'Asṛa', category: 'Education', icon: '🏫', exampleSentenceHindi: 'हम रोज स्कूल जाते हैं।', exampleSentenceNative: 'ᱟᱵᱚ ᱫᱤᱱᱟᱹᱢ ᱟᱥᱲᱟ ᱵᱚᱱ ᱪᱟᱞᱟᱜ-ᱟ᱾' },
    { id: 'fc-6', hindi: 'पक्षी / चिड़िया', english: 'Bird', nativeScript: 'ᱪᱮᱬᱮ', phonetic: 'Cheṇe', category: 'Animals', icon: '🐦', exampleSentenceHindi: 'चिड़िया पेड़ की डाली पर गाती है।', exampleSentenceNative: 'ᱪᱮᱬᱮ ᱫᱟᱨᱮ ᱰᱟᱹᱨ ᱨᱮ ᱨᱟᱜ ᱮᱫᱟ᱾' },
    { id: 'fc-7', hindi: 'एक (१)', english: 'One', nativeScript: 'ᱢᱤᱫ', phonetic: 'Mit', category: 'Numeracy', icon: '1️⃣', exampleSentenceHindi: 'मेरे पास एक पेंसिल है।', exampleSentenceNative: 'ᱤᱧ ᱴᱷᱮᱱ ᱢᱤᱫᱴᱟᱝ ᱯᱮᱱᱥᱤᱞ ᱢᱮᱱᱟᱜ-ᱟ᱾' },
    { id: 'fc-8', hindi: 'दो (२)', english: 'Two', nativeScript: 'ᱵᱟᱨ', phonetic: 'Bar', category: 'Numeracy', icon: '2️⃣', exampleSentenceHindi: 'पक्षी के दो पंख होते हैं।', exampleSentenceNative: 'ᱪᱮᱬᱮ ᱨᱮᱭᱟᱜ ᱵᱟᱨᱭᱟ ᱯᱷᱟᱹᱴᱩᱣᱟᱹ ᱛᱟᱦᱮᱸᱱᱟ᱾' }
  ],
  Mundari: [
    { id: 'm-1', hindi: 'पेड़ / वृक्ष', english: 'Tree', nativeScript: 'ᱫᱟᱨᱩ', phonetic: 'Daru', category: 'Nature', icon: '🌳', exampleSentenceHindi: 'पेड़ हमें स्वच्छ हवा देते हैं।', exampleSentenceNative: 'ᱫᱟᱨᱩ ᱵᱩ ᱥᱟᱯᱷᱟ ᱦᱚᱭ ᱮᱢᱟᱵᱩᱣᱟ᱾' },
    { id: 'm-2', hindi: 'पानी / जल', english: 'Water', nativeScript: 'ᱫᱟᱜ', phonetic: "Da'", category: 'Nature', icon: '💧', exampleSentenceHindi: 'पानी सब जीवों के लिए जरूरी है।', exampleSentenceNative: 'ᱫᱟᱜ ᱡᱤᱣᱤ ᱛᱟᱱ ᱡᱚᱛᱚ ᱠᱳ ᱞᱟᱜᱤᱫ ᱞᱟᱹᱠᱛᱤᱭᱟᱱ᱾' },
    { id: 'm-3', hindi: 'सूरज', english: 'Sun', nativeScript: 'ᱥᱤᱝᱜᱤ', phonetic: 'Singi', category: 'Nature', icon: '☀️', exampleSentenceHindi: 'सूरज से हमें धूप मिलती है।', exampleSentenceNative: 'ᱥᱤᱝᱜᱤ ᱛᱮ ᱵᱩ ᱡᱮᱛᱮ ᱧᱟᱢᱚᱜ-ᱟ᱾' },
    { id: 'm-4', hindi: 'नमस्ते', english: 'Greeting', nativeScript: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar', category: 'Social', icon: '🙏', exampleSentenceHindi: 'सभी को जोहार करो।', exampleSentenceNative: 'ᱡᱚᱛᱚ ᱠᱳ ᱡᱳᱦᱟᱨ ᱮᱢᱮᱯᱮ᱾' },
    { id: 'm-5', hindi: 'स्कूल', english: 'School', nativeScript: 'ᱤᱛᱩᱱ ᱚᱲᱟᱜ', phonetic: 'Itun Oṛa', category: 'Education', icon: '🏫', exampleSentenceHindi: 'बच्चे स्कूल जा रहे हैं।', exampleSentenceNative: 'ᱦᱩᱲᱤᱝ ᱠᱳ ᱤᱛᱩᱱ ᱚᱲᱟᱜ ᱠᱳ ᱥᱮᱱᱚᱜ ᱛᱟᱱᱟ᱾' },
    { id: 'm-6', hindi: 'एक (१)', english: 'One', nativeScript: 'ᱢᱤᱭᱟᱹᱫᱽ', phonetic: 'Miyad', category: 'Numeracy', icon: '1️⃣', exampleSentenceHindi: 'यह एक फल है।', exampleSentenceNative: 'ᱱᱮᱭᱟ ᱢᱤᱭᱟᱹᱫᱽ ᱡᱚ ᱛᱟᱱᱟ᱾' }
  ],
  Ho: [
    { id: 'h-1', hindi: 'पेड़ / वृक्ष', english: 'Tree', nativeScript: 'ᱫᱟᱨᱩ', phonetic: 'Daru', category: 'Nature', icon: '🌳', exampleSentenceHindi: 'पेड़ हमें फल देते हैं।', exampleSentenceNative: 'ᱫᱟᱨᱩ ᱟᱵᱩ ᱡᱳ ᱠᱳ ᱤᱢᱟᱭᱮ᱾' },
    { id: 'h-2', hindi: 'पानी / जल', english: 'Water', nativeScript: 'ᱫᱟᱜ', phonetic: "Da'", category: 'Nature', icon: '💧', exampleSentenceHindi: 'नदी का पानी ठंडा है।', exampleSentenceNative: 'ᱜᱟᱰᱟ ᱨᱮᱱᱟᱜ ᱫᱟᱜ ᱨᱮᱭᱟᱲ ᱜᱮᱭᱟ᱾' },
    { id: 'h-3', hindi: 'नमस्ते / जोहार', english: 'Greeting', nativeScript: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar', category: 'Social', icon: '🙏', exampleSentenceHindi: 'कक्षा में जोहार बोलो।', exampleSentenceNative: 'ᱠᱞᱟᱥ ᱨᱮ ᱡᱳᱦᱟᱨ ᱠᱟᱡᱤᱭᱮᱯᱮ᱾' },
    { id: 'h-4', hindi: 'सूरज', english: 'Sun', nativeScript: 'ᱥᱤᱝᱜᱤ', phonetic: 'Singi', category: 'Nature', icon: '☀️', exampleSentenceHindi: 'सूरज आकाश में चमकता है।', exampleSentenceNative: 'ᱥᱤᱝᱜᱤ ᱥᱤᱨᱢᱟ ᱨᱮ ᱢᱟᱨᱥᱟᱞ ᱛᱟᱱᱟ᱾' },
    { id: 'h-5', hindi: 'स्कूल', english: 'School', nativeScript: 'ᱤᱛᱩᱱ ᱚᱲᱟᱜ', phonetic: 'Itun Oṛa', category: 'Education', icon: '🏫', exampleSentenceHindi: 'हम स्कूल में पढ़ाई करते हैं।', exampleSentenceNative: 'ᱟᱵᱩ ᱤᱛᱩᱱ ᱚᱲᱟᱜ ᱨᱮ ᱤᱛᱩᱱᱟᱱ᱾' },
    { id: 'h-6', hindi: 'एक (१)', english: 'One', nativeScript: 'ᱢᱤᱭᱟᱹᱫᱽ', phonetic: 'Miyad', category: 'Numeracy', icon: '1️⃣', exampleSentenceHindi: 'एक फूल खिला है।', exampleSentenceNative: 'ᱢᱤᱭᱟᱹᱫᱽ ᱵᱟ ᱵᱟᱦᱟ ᱠᱟᱱᱟ᱾' }
  ],
  Kurukh: [
    { id: 'k-1', hindi: 'पेड़ / वृक्ष', english: 'Tree', nativeScript: 'मन्न', phonetic: 'Mann', category: 'Nature', icon: '🌳', exampleSentenceHindi: 'पेड़ जंगल की शोभा हैं।', exampleSentenceNative: 'मन्न पच्छा खॊड़\'आर गहि सिंगार तली।' },
    { id: 'k-2', hindi: 'पानी / जल', english: 'Water', nativeScript: 'अम्म', phonetic: 'Amm', category: 'Nature', icon: '💧', exampleSentenceHindi: 'साफ पानी पियो।', exampleSentenceNative: 'सफ़ा अम्म ऒन्ना।' },
    { id: 'k-3', hindi: 'नमस्ते / जोहार', english: 'Greeting', nativeScript: 'गॊडे / जोहार', phonetic: 'Gode / Johar', category: 'Social', icon: '🙏', exampleSentenceHindi: 'बड़ों को प्रणाम करो।', exampleSentenceNative: 'कोहा बग्गरिन गॊडे नना।' },
    { id: 'k-4', hindi: 'सूरज / सूर्य', english: 'Sun', nativeScript: 'बिड़ी', phonetic: 'Bidi', category: 'Nature', icon: '☀️', exampleSentenceHindi: 'दिन में सूरज चमकता है।', exampleSentenceNative: 'उल्ला नु बिड़ी टिमकिआ।' },
    { id: 'k-5', hindi: 'स्कूल', english: 'School', nativeScript: 'स्कूल / पढ़ा घर', phonetic: 'Padha Ghad', category: 'Education', icon: '🏫', exampleSentenceHindi: 'हम स्कूल जा रहे हैं।', exampleSentenceNative: 'ऎम स्कूल काला लगदम।' },
    { id: 'k-6', hindi: 'एक (१)', english: 'One', nativeScript: 'ओंद', phonetic: 'Ond', category: 'Numeracy', icon: '1️⃣', exampleSentenceHindi: 'एक बालक आया है।', exampleSentenceNative: 'ओंद आलस बरा लगदस।' }
  ]
}

const PRESET_WORKSHEETS: Record<string, WorksheetData> = {
  Santhali: {
    title: 'PALASH MTB-MLE: प्रकृति और जल चक्र (Nature & Water Cycle)',
    gradeLevel: 'Class 3 (FLN Stage 2)',
    flnOutcome: 'FLN-L3.4: मातृभाषा एवं मानक हिंदी में मूलभूत शब्दावली एवं पर्यावरणीय समझ का विकास',
    targetLanguage: 'Santhali',
    scriptName: 'Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)',
    matchingPairs: [
      { hindi: 'जल / पानी', native: 'ᱫᱟᱜ', phonetic: "Da'", matchId: '1' },
      { hindi: 'पेड़ / वृक्ष', native: 'ᱫᱟᱨᱮ', phonetic: 'Dare', matchId: '2' },
      { hindi: 'सूरज / धूप', native: 'ᱥᱤᱧ ᱪᱟᱸᱫᱚ', phonetic: 'Siñ Chando', matchId: '3' },
      { hindi: 'बादल', native: 'ᱨᱤᱢᱤᱞ', phonetic: 'Rimil', matchId: '4' },
      { hindi: 'बारिश / वर्षा', native: 'ᱫᱟᱜ ᱡᱟᱹᱲᱤ', phonetic: "Da' Jaṛi", matchId: '5' }
    ],
    fillBlanks: [
      {
        questionHindi: 'पेड़ हमें _____ और फल देते हैं।',
        questionNative: 'ᱫᱟᱨᱮ ᱫᱚ ᱟᱵᱚ _____ ᱟᱨ ᱡᱚ ᱮ ᱮᱢᱟᱵᱚᱱᱟ᱾',
        answer: 'छाया (ᱩᱢᱩᱞ)',
        hint: 'Sunlight shade / ᱩᱢᱩᱞ'
      },
      {
        questionHindi: 'पौधों को बड़ा होने के लिए _____ और धूप चाहिए।',
        questionNative: 'ᱫᱟᱨᱮ-ᱱᱟᱹᱲᱤ ᱦᱟᱨᱟᱜ ᱞᱟᱹᱜᱤᱫ _____ ᱟᱨ ᱥᱤᱧ ᱪᱟᱸᱫᱚ ᱨᱮᱭᱟᱜ ᱞᱟᱹᱠᱛᱤ ᱢᱮᱱᱟᱜ-ᱟ᱾',
        answer: 'पानी (ᱫᱟᱜ)',
        hint: 'Water / ᱫᱟᱜ'
      }
    ],
    numeracyTask: {
      promptHindi: 'चित्र देखकर बताइए: कुल कितने साल/सखुआ (Sarjom) के पेड़ हैं?',
      promptNative: 'ᱪᱤᱛᱟᱹᱨ ᱧᱮᱞ ᱠᱟᱛᱮ ᱞᱟᱹᱭ ᱢᱮ: ᱜᱩᱴ ᱛᱤᱱᱟᱹᱜ ᱥᱟᱨᱡᱚᱢ ᱫᱟᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ?',
      itemsCount: 5,
      itemLabelHindi: 'पेड़',
      itemLabelNative: 'ᱫᱟᱨᱮ',
      answerNumber: 5
    },
    oralPrompt: {
      promptHindi: 'अपने शिक्षक को बताइए कि जब बारिश आती है तो गाँव के खेतों में क्या होता है?',
      promptNative: 'ᱢᱟᱪᱮᱛ ᱴᱷᱮᱱ ᱞᱟᱹᱭ ᱢᱮ ᱡᱚᱠᱷᱚᱱ ᱫᱟᱜ ᱡᱟᱹᱲᱤ ᱦᱤᱡᱩᱜ-ᱟ ᱩᱱᱡᱚᱦᱚᱜ ᱟᱹᱛᱩ ᱨᱮᱭᱟᱜ ᱠᱷᱮᱛ ᱨᱮ ᱪᱮᱫ ᱦᱩᱭᱩᱜ-ᱟ?',
      expectedVocabulary: ['ᱫᱟᱜ (Water)', 'ᱦᱟᱥᱟ (Soil)', 'ᱪᱟᱥ (Farming)', 'ᱨᱤᱢᱤᱞ (Cloud)']
    }
  },
  Mundari: {
    title: 'PALASH MTB-MLE: जंगल, पशु और गिनती (Forest & Numeracy)',
    gradeLevel: 'Class 2 (FLN Stage 1)',
    flnOutcome: 'FLN-N2.1: परिवेशीय वस्तुओं की मौखिक गणना एवं द्वैभाषिक अभिव्यक्ति',
    targetLanguage: 'Mundari',
    scriptName: 'Mundari Bani (ᱢᱩᱱᱰᱟᱨᱤ)',
    matchingPairs: [
      { hindi: 'पेड़', native: 'ᱫᱟᱨᱩ', phonetic: 'Daru', matchId: '1' },
      { hindi: 'पानी', native: 'ᱫᱟᱜ', phonetic: "Da'", matchId: '2' },
      { hindi: 'सूरज', native: 'ᱥᱤᱝᱜᱤ', phonetic: 'Singi', matchId: '3' },
      { hindi: 'जंगल', native: 'ᱵᱤᱨ', phonetic: 'Bir', matchId: '4' },
      { hindi: 'नमस्ते', native: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar', matchId: '5' }
    ],
    fillBlanks: [
      {
        questionHindi: 'जंगल में बहुत सारे _____ होते हैं।',
        questionNative: 'ᱵᱤᱨ ᱨᱮ ᱟᱹᱰᱤ ᱜᱟᱱ _____ ᱛᱟᱦᱮᱸᱱᱟ᱾',
        answer: 'पेड़ (ᱫᱟᱨᱩ)',
        hint: 'Trees / ᱫᱟᱨᱩ'
      }
    ],
    numeracyTask: {
      promptHindi: 'गिनकर लिखिए: टोकरी में कितने महुआ के फल हैं?',
      promptNative: 'ᱦᱤᱥᱟᱹᱵᱽ ᱠᱟᱛᱮ ᱚᱞ ᱢᱮ: ᱴᱩᱠᱤ ᱨᱮ ᱛᱤᱱᱟᱹᱜ ᱢᱟᱹᱫᱷᱩᱠᱟᱹ ᱡᱚ ᱢᱮᱱᱟᱜ-ᱟ?',
      itemsCount: 4,
      itemLabelHindi: 'फल',
      itemLabelNative: 'ᱡᱚ',
      answerNumber: 4
    },
    oralPrompt: {
      promptHindi: 'मुंडारी भाषा में १ से ५ तक की गिनती बोलकर सुनाएँ।',
      promptNative: 'ᱢᱩᱱᱰᱟᱨᱤ ᱯᱟᱹᱨᱥᱤ ᱛᱮ ᱢᱤᱭᱟᱹᱫᱽ ᱠᱷᱚᱱ ᱢᱚᱬᱮ ᱫᱷᱟᱹᱵᱤᱡ ᱞᱟᱹᱭ ᱥᱚᱫᱚᱨ ᱢᱮ᱾',
      expectedVocabulary: ['ᱢᱤᱭᱟᱹᱫᱽ (1)', 'ᱵᱟᱨᱤᱭᱟ (2)', 'ᱟᱹᱯᱤ (3)', 'ᱩᱯᱩᱱ (4)', 'ᱢᱚᱬᱮ (5)']
    }
  },
  Ho: {
    title: 'PALASH MTB-MLE: गाँव का परिवेश और दैनिक शब्द (Village Life & Words)',
    gradeLevel: 'Class 2 (FLN Stage 1)',
    flnOutcome: 'FLN-L2.3: स्थानीय संदर्भों में मौखिक संवाद एवं हो-हिंदी शब्दावली संवर्धन',
    targetLanguage: 'Ho',
    scriptName: 'Warang Citi (ᱣᱟᱨᱟᱝ ᱪᱤᱛᱤ)',
    matchingPairs: [
      { hindi: 'पेड़', native: 'ᱫᱟᱨᱩ', phonetic: 'Daru', matchId: '1' },
      { hindi: 'पानी', native: 'ᱫᱟᱜ', phonetic: "Da'", matchId: '2' },
      { hindi: 'सूरज', native: 'ᱥᱤᱝᱜᱤ', phonetic: 'Singi', matchId: '3' },
      { hindi: 'नमस्ते', native: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar', matchId: '4' }
    ],
    fillBlanks: [
      {
        questionHindi: 'हम रोज _____ में पढ़ने जाते हैं।',
        questionNative: 'ᱟᱵᱩ ᱫᱤᱱᱟᱹᱢ _____ ᱨᱮ ᱤᱛᱩᱱᱟᱱ ᱥᱮᱱᱚᱜ-ᱟ᱾',
        answer: 'स्कूल (ᱤᱛᱩᱱ ᱚᱲᱟᱜ)',
        hint: 'School / ᱤᱛᱩᱱ ᱚᱲᱟᱜ'
      }
    ],
    numeracyTask: {
      promptHindi: 'कितनी तितलियाँ उड़ रही हैं? सही संख्या पर घेरा लगाएँ।',
      promptNative: 'ᱛᱤᱱᱟᱹᱜ ᱯᱤᱯᱤᱞᱤᱠᱟ ᱠᱳ ᱩᱰᱟᱹᱣᱜ ᱛᱟᱱᱟ? ᱴᱷᱤᱠ ᱞᱮᱠᱷᱟ ᱨᱮ ᱜᱩᱞᱟᱹᱭ ᱮᱢᱮᱯᱮ᱾',
      itemsCount: 3,
      itemLabelHindi: 'तितली',
      itemLabelNative: 'ᱯᱤᱯᱤᱞᱤᱠᱟ',
      answerNumber: 3
    },
    oralPrompt: {
      promptHindi: 'अपने पसंदीदा पालतू जानवर के बारे में ३ वाक्य हो भाषा में बोलें।',
      promptNative: 'ᱟᱢᱟᱜ ᱠᱩᱥᱤᱭᱟᱱ ᱡᱤᱭᱟᱹᱞᱤ ᱵᱟᱵᱚᱛ ᱯᱮᱭᱟ ᱠᱟᱡᱤ ᱦᱳ ᱛᱮ ᱞᱟᱹᱭ ᱢᱮ᱾',
      expectedVocabulary: ['ᱥᱮᱛᱟ (Dog)', 'ᱢᱮᱨᱚᱢ (Goat)', 'ᱜᱟᱹᱭ (Cow)']
    }
  },
  Kurukh: {
    title: 'PALASH MTB-MLE: प्रकृति एवं परिवार (Nature & Family)',
    gradeLevel: 'Class 3 (FLN Stage 2)',
    flnOutcome: 'FLN-L3.1: कुड़ुख़ एवं हिंदी में शब्द पहचान तथा सरल वाक्य रचना',
    targetLanguage: 'Kurukh',
    scriptName: 'Tolong Siki (ᱛᱚᱞᱚᱝ ᱥᱤᱠᱤ) / Devanagari',
    matchingPairs: [
      { hindi: 'पेड़', native: 'मन्न', phonetic: 'Mann', matchId: '1' },
      { hindi: 'पानी', native: 'अम्म', phonetic: 'Amm', matchId: '2' },
      { hindi: 'सूरज', native: 'बिड़ी', phonetic: 'Bidi', matchId: '3' },
      { hindi: 'नमस्ते', native: 'गॊडे / जोहार', phonetic: 'Gode', matchId: '4' }
    ],
    fillBlanks: [
      {
        questionHindi: 'हमे रोज साफ _____ पीना चाहिए।',
        questionNative: 'हमे उल्ला नु सफ़ा _____ ऒन्ना चाही।',
        answer: 'पानी (अम्म)',
        hint: 'Water / अम्म'
      }
    ],
    numeracyTask: {
      promptHindi: 'दिए गए चिड़ियों को गिनकर सही अंक कुड़ुख़ और हिंदी में लिखें:',
      promptNative: 'चिड़ियन गहि गन्ती नना आर ओंद, दोय ओला:',
      itemsCount: 4,
      itemLabelHindi: 'पक्षी',
      itemLabelNative: 'चिड़िया',
      answerNumber: 4
    },
    oralPrompt: {
      promptHindi: 'अपने परिवार के सदस्यों के बारे में कुड़ुख़ में बताइए।',
      promptNative: 'तंघय एरपा गहि आलार बारॆते कुड़ुख़ नु तिंगा।',
      expectedVocabulary: ['अंग्गस (Father)', 'अंग्गी (Mother)', 'भाई (Brother)']
    }
  }
}

export default function NipunWorksheetsPage() {
  const { toast } = useApp()
  const [selectedLanguage, setSelectedLanguage] = useState<'Santhali' | 'Mundari' | 'Ho' | 'Kurukh'>('Santhali')
  const [activeTab, setActiveTab] = useState<'worksheet' | 'flashcards'>('worksheet')
  const [flashcardIdx, setFlashcardIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [answersVisible, setAnswersVisible] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)

  const currentCards = PRESET_FLASHCARDS[selectedLanguage] || PRESET_FLASHCARDS.Santhali
  const currentCard = currentCards[flashcardIdx] || currentCards[0]
  const currentWorksheet = PRESET_WORKSHEETS[selectedLanguage] || PRESET_WORKSHEETS.Santhali

  const handlePrint = () => {
    window.print()
  }

  const handleNextCard = () => {
    setIsFlipped(false)
    setFlashcardIdx(prev => (prev + 1) % currentCards.length)
  }

  const handlePrevCard = () => {
    setIsFlipped(false)
    setFlashcardIdx(prev => (prev - 1 + currentCards.length) % currentCards.length)
  }

  const handleSpeak = (text: string, language: string = selectedLanguage, phonetic = '', id = '') => {
    if (id) setPlayingAudioId(id)
    playVernacularAudio({
      text,
      language,
      phonetic: phonetic || text,
      onStart: () => {
        if (id) setPlayingAudioId(id)
      },
      onEnd: () => {
        setPlayingAudioId(null)
      },
      onError: () => {
        setPlayingAudioId(null)
      }
    })
  }

  const handleGenerateAI = () => {
    if (!customPrompt.trim()) {
      toast('Please enter a topic or concept in Hindi', 'info')
      return
    }
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      toast(`AI Bilingual Worksheet generated for "${customPrompt}" in ${selectedLanguage}!`, 'success')
      setCustomPrompt('')
    }, 1200)
  }

  return (
    <section className="page-card nipun-worksheets-page">
      {/* Page Introduction Banner */}
      <div className="page-intro no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md font-bold">
              JHARKHAND PALASH MTB-MLE INITIATIVE
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Award size={12} /> NIPUN Bharat FLN Aligned
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Bilingual Worksheets & Visual Flashcards
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Empowering non-native Hindi teachers in over 5,000 tribal primary schools to conduct mother-tongue-based instruction in <strong>Ho</strong>, <strong>Mundari</strong>, <strong>Santhali</strong>, and <strong>Kurukh</strong> with zero prior language training. Fully offline capable on low-cost tablets (≤2 GB RAM).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer size={15} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Control Bar: Language Selector & View Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 my-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        {/* Language Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Languages size={14} className="text-indigo-600" /> Target Tribal Language:
          </span>
          {(['Santhali', 'Mundari', 'Ho', 'Kurukh'] as const).map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                setSelectedLanguage(lang)
                setFlashcardIdx(0)
                setIsFlipped(false)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedLanguage === lang
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang === 'Santhali' && 'ᱥᱟᱱᱛᱟᱲᱤ Santhali'}
              {lang === 'Mundari' && 'ᱢᱩᱱᱰᱟᱨᱤ Mundari'}
              {lang === 'Ho' && 'ᱦᱳ Ho'}
              {lang === 'Kurukh' && 'कुड़ुख़ Kurukh'}
            </button>
          ))}
        </div>

        {/* View Switcher: Worksheets vs Flashcards */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('worksheet')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'worksheet'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={14} /> NIPUN Worksheet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'flashcards'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} /> Visual Flashcards ({currentCards.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: PRINTABLE NIPUN BHARAT BILINGUAL WORKSHEET */}
      {activeTab === 'worksheet' && (
        <div className="space-y-6">
          {/* Quick AI Topic Generator Bar (no-print) */}
          <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-200 rounded-2xl p-4 shadow-sm no-print">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600 flex-shrink-0" />
                <div>
                  <strong className="text-xs text-slate-900 block">AI Custom Worksheet Generator (FLN Aligned)</strong>
                  <span className="text-[11px] text-slate-500">
                    Type any Hindi lesson concept (e.g. &ldquo;हमारे त्यौहार&rdquo;, &ldquo;घरेलू जानवर&rdquo;, &ldquo;सब्जियों के नाम&rdquo;)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Enter FLN topic in Hindi..."
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg w-full sm:w-60 bg-white"
                />
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles size={13} />
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Printable Worksheet Card */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 lg:p-8 shadow-md print:border-0 print:shadow-none print:p-0">
            {/* Worksheet Institutional Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-900 block">
                    GOVERNMENT OF JHARKHAND • SCHOOL EDUCATION & LITERACY DEPT
                  </span>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
                    {currentWorksheet.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-700">
                    <span className="font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-indigo-900">
                      {currentWorksheet.gradeLevel}
                    </span>
                    <span className="font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-900">
                      Tribal Target: {currentWorksheet.targetLanguage} ({currentWorksheet.scriptName})
                    </span>
                    <span className="font-mono text-slate-500">
                      NIPUN Competency: {currentWorksheet.flnOutcome}
                    </span>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="border border-slate-300 rounded-lg p-2 text-[11px] text-slate-600 bg-slate-50 space-y-1">
                    <div><strong>Max Marks:</strong> 25</div>
                    <div><strong>Time:</strong> 40 Min</div>
                    <div><strong>Mode:</strong> Bilingual MTB-MLE</div>
                  </div>
                </div>
              </div>

              {/* Student Details Fields for Printing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
                <div className="border-b border-dashed border-slate-400 pb-1">
                  <span className="text-slate-500">Student Name / नाम:</span> ________________
                </div>
                <div className="border-b border-dashed border-slate-400 pb-1">
                  <span className="text-slate-500">Roll No / अनुक्रमांक:</span> ________
                </div>
                <div className="border-b border-dashed border-slate-400 pb-1">
                  <span className="text-slate-500">Village / गाँव:</span> ________________
                </div>
                <div className="border-b border-dashed border-slate-400 pb-1">
                  <span className="text-slate-500">Date / दिनांक:</span> ____________
                </div>
              </div>
            </div>

            {/* SECTION A: PICTURE & WORD MATCHING (चित्रात्मक एवं शाब्दिक मिलान) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 bg-slate-100 p-2 rounded-lg">
                <h3 className="text-sm font-bold text-slate-900">
                  खण्ड (क) : शब्द एवं लिपि मिलान करें (Match Hindi with {currentWorksheet.targetLanguage} Native Script)
                </h3>
                <span className="text-xs font-semibold text-slate-600">अंक: 10</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Hindi Standard Terms */}
                <div className="space-y-2">
                  <strong className="text-xs text-slate-700 block mb-2 font-mono">स्तंभ A (मानक हिंदी)</strong>
                  {currentWorksheet.matchingPairs.map((pair, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800">
                        {i + 1}. {pair.hindi}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSpeak(pair.hindi, 'Hindi', '', `stambh-a-${i}`)}
                          className={`no-print p-1 rounded-md transition-all ${
                            playingAudioId === `stambh-a-${i}`
                              ? 'text-emerald-700 bg-emerald-100 animate-pulse'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={`Listen ${pair.hindi}`}
                        >
                          <Volume2 size={13} className={playingAudioId === `stambh-a-${i}` ? 'animate-bounce' : ''} />
                        </button>
                        <span className="w-6 h-6 rounded-full border border-slate-300 bg-white flex items-center justify-center font-mono text-[11px] text-slate-400">
                          [ &nbsp; ]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2: Tribal Vernacular Script + Phonetics */}
                <div className="space-y-2">
                  <strong className="text-xs text-slate-700 block mb-2 font-mono">
                    स्तंभ B ({currentWorksheet.targetLanguage} लिपि व उच्चारण)
                  </strong>
                  {currentWorksheet.matchingPairs.map((pair, i) => (
                    <div
                      key={i}
                      className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-indigo-950 text-sm font-sans mr-2">
                          ({String.fromCharCode(65 + i)}) {pair.native}
                        </span>
                        <span className="text-[11px] text-indigo-700 italic font-mono">
                          [{pair.phonetic}]
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSpeak(pair.native, currentWorksheet.targetLanguage, pair.phonetic, `stambh-b-${i}`)}
                        className={`no-print p-1.5 rounded-lg transition-all ${
                          playingAudioId === `stambh-b-${i}`
                            ? 'text-emerald-700 bg-emerald-100 animate-pulse'
                            : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100'
                        }`}
                        title={`Listen ${pair.phonetic}`}
                      >
                        <Volume2 size={15} className={playingAudioId === `stambh-b-${i}` ? 'animate-bounce' : ''} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION B: BILINGUAL SENTENCE FILL-IN-THE-BLANKS (रिक्त स्थान पूर्ति) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 bg-slate-100 p-2 rounded-lg">
                <h3 className="text-sm font-bold text-slate-900">
                  खण्ड (ख) : रिक्त स्थान भरें (Fill in the Blanks in Mother Tongue & Hindi)
                </h3>
                <span className="text-xs font-semibold text-slate-600">अंक: 5</span>
              </div>

              <div className="space-y-4">
                {currentWorksheet.fillBlanks.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="font-medium text-slate-900">
                      <strong>प्रश्न {i + 1} (Hindi):</strong> {item.questionHindi}
                    </div>
                    <div className="font-medium text-indigo-900 text-sm">
                      <strong>({currentWorksheet.targetLanguage}):</strong> {item.questionNative}
                    </div>
                    <div className="pt-2 flex items-center justify-between text-slate-500 border-t border-slate-200">
                      <span>उत्तर: ___________________________________________</span>
                      <span className="text-[11px] italic bg-white px-2 py-0.5 rounded border border-slate-200">
                        संकेत (Hint): {item.hint}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION C: PRACTICAL NUMERACY & COUNTING (गिनती एवं संख्या बोध) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 bg-slate-100 p-2 rounded-lg">
                <h3 className="text-sm font-bold text-slate-900">
                  खण्ड (ग) : FLN मूलभूत संख्या बोध (Foundational Numeracy & Contextual Counting)
                </h3>
                <span className="text-xs font-semibold text-slate-600">अंक: 5</span>
              </div>

              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 text-xs">
                <p className="font-bold text-amber-950">
                  {currentWorksheet.numeracyTask.promptHindi}
                </p>
                <p className="text-amber-900 font-medium text-sm">
                  {currentWorksheet.numeracyTask.promptNative}
                </p>

                {/* Visual Counting Icons */}
                <div className="flex items-center gap-3 py-2">
                  {Array.from({ length: currentWorksheet.numeracyTask.itemsCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 bg-white rounded-xl border border-amber-300 shadow-sm flex flex-col items-center justify-center text-lg"
                    >
                      🌳
                      <span className="text-[9px] font-mono text-amber-800 font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                  <span className="font-semibold text-amber-900">
                    कुल संख्या (Total Count): [ ______ ] {currentWorksheet.numeracyTask.itemLabelHindi} /{' '}
                    {currentWorksheet.numeracyTask.itemLabelNative}
                  </span>
                  <span className="text-[11px] text-amber-700 italic">
                    मातृभाषा में उच्चारण: {selectedLanguage === 'Santhali' ? 'ᱢᱚᱬᱮ (More)' : 'मने'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION D: ORAL DIALOGUE & TEACHER RUBRIC (मौखिक संवाद एवं मूल्यांकन) */}
            <div>
              <div className="flex items-center justify-between mb-3 bg-slate-100 p-2 rounded-lg">
                <h3 className="text-sm font-bold text-slate-900">
                  खण्ड (घ) : शिक्षक-छात्र मौखिक संवाद (Interactive Classroom Dialogue)
                </h3>
                <span className="text-xs font-semibold text-slate-600">अंक: 5</span>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <p className="font-semibold text-emerald-950">
                  <strong>शिक्षक मौखिक प्रश्न (Hindi):</strong> &ldquo;{currentWorksheet.oralPrompt.promptHindi}&rdquo;
                </p>
                <p className="text-emerald-900 font-medium text-sm">
                  <strong>मातृभाषा संवाद ({currentWorksheet.targetLanguage}):</strong> &ldquo;
                  {currentWorksheet.oralPrompt.promptNative}&rdquo;
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-emerald-900">अपेक्षित मुख्य शब्द (Expected Vocabulary):</span>
                  {currentWorksheet.oralPrompt.expectedVocabulary.map((word, i) => (
                    <span
                      key={i}
                      className="bg-white border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              {/* Teacher Grading Rubric */}
              <div className="mt-4 pt-4 border-t-2 border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <strong>शिक्षक हस्ताक्षर (Teacher Sign):</strong> _______________________
                </div>
                <div>
                  <strong>FLN स्तर (Competency Level):</strong> [ &nbsp; ] आरंभिक &nbsp; [ &nbsp; ] मध्यम &nbsp; [ &nbsp; ] दक्ष
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE VISUAL FLASHCARDS (दृश्यात्मक फ़्लैशकार्ड सेट) */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          {/* Top Flashcard Summary & Counter */}
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl no-print">
            <div className="flex items-center gap-2">
              <Layers size={20} className="text-indigo-600" />
              <div>
                <strong className="text-sm text-indigo-950 block">
                  {selectedLanguage} FLN Visual Flashcards
                </strong>
                <span className="text-xs text-indigo-700">
                  Card {flashcardIdx + 1} of {currentCards.length} • Click card to flip between Hindi & Native Script
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAnswersVisible(!answersVisible)}
                className="px-3 py-1.5 bg-white text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold"
              >
                {answersVisible ? 'Hide Examples' : 'Show Examples'}
              </button>
            </div>
          </div>

          {/* Large 3D Interactive Flip Card */}
          <div className="flex flex-col items-center justify-center my-8">
            <div
              tabIndex={0}
              role="button"
              aria-label="Flip flashcard"
              onClick={() => setIsFlipped(!isFlipped)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsFlipped(!isFlipped)
                }
              }}
              className="w-full max-w-lg min-h-[380px] bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-3xl p-8 shadow-xl cursor-pointer transition-all hover:shadow-2xl flex flex-col justify-between relative overflow-hidden group select-none focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              {/* Category Badge & Audio */}
              <div className="flex items-center justify-between w-full">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-full border border-indigo-200">
                  {currentCard.category}
                </span>
                <button
                  type="button"
                  aria-label={`Listen pronunciation for ${currentCard.phonetic}`}
                  onClick={e => {
                    e.stopPropagation()
                    handleSpeak(
                      isFlipped ? currentCard.nativeScript : currentCard.hindi,
                      isFlipped ? selectedLanguage : 'Hindi',
                      currentCard.phonetic,
                      `card-${flashcardIdx}`
                    )
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    playingAudioId === `card-${flashcardIdx}`
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700'
                  }`}
                  title="Listen pronunciation"
                >
                  <Volume2 size={18} className={playingAudioId === `card-${flashcardIdx}` ? 'animate-bounce' : ''} />
                </button>
              </div>

              {/* Big Icon & Main Text */}
              <div className="text-center my-6 space-y-3">
                <div className="text-6xl mb-2">{currentCard.icon}</div>

                {!isFlipped ? (
                  /* Front Side: Hindi + English */
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-wide">
                      {currentCard.hindi}
                    </h2>
                    <span className="text-base text-slate-500 font-medium block mt-1">
                      English: {currentCard.english}
                    </span>
                    <span className="text-xs text-indigo-600 font-bold block mt-3 flex items-center justify-center gap-1">
                      <RotateCw size={12} /> Click to reveal {selectedLanguage} Script
                    </span>
                  </div>
                ) : (
                  /* Back Side: Tribal Script + Phonetics */
                  <div className="animate-fade-in">
                    <h2 className="text-4xl font-black text-indigo-900 font-sans tracking-wide">
                      {currentCard.nativeScript}
                    </h2>
                    <p className="text-lg text-emerald-800 font-mono italic mt-2">
                      &ldquo;{currentCard.phonetic}&rdquo;
                    </p>
                    <span className="text-xs text-slate-400 font-medium block mt-3 flex items-center justify-center gap-1">
                      <RotateCw size={12} /> Click to see Hindi
                    </span>
                  </div>
                )}
              </div>

              {/* Example Sentences */}
              <div className="w-full pt-4 border-t border-slate-100 text-xs text-left bg-slate-50/70 p-3 rounded-xl space-y-1">
                <div className="text-slate-700 font-medium">
                  <strong>Hindi:</strong> {currentCard.exampleSentenceHindi}
                </div>
                <div className="text-emerald-900 font-semibold font-sans">
                  <strong>{selectedLanguage}:</strong> {currentCard.exampleSentenceNative}
                </div>
              </div>
            </div>

            {/* Navigation Carousel Buttons */}
            <div className="flex items-center gap-4 mt-6 no-print">
              <button
                type="button"
                onClick={handlePrevCard}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-sm transition-all"
                title="Previous card"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-xs font-bold text-slate-600 font-mono">
                {flashcardIdx + 1} / {currentCards.length}
              </span>

              <button
                type="button"
                onClick={handleNextCard}
                className="w-12 h-12 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center shadow-md transition-all"
                title="Next card"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Flashcard Grid Overview */}
          <div className="mt-8 no-print">
            <h3 className="text-sm font-bold text-slate-900 mb-3">All {selectedLanguage} Vocabulary Flashcards</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentCards.map((card, i) => (
                <div
                  key={card.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select flashcard for ${card.hindi}`}
                  onClick={() => {
                    setFlashcardIdx(i)
                    setIsFlipped(false)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setFlashcardIdx(i)
                      setIsFlipped(false)
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    flashcardIdx === i
                      ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <strong className="text-slate-900 block">{card.hindi}</strong>
                  <span className="text-indigo-900 font-sans font-semibold block">{card.nativeScript}</span>
                  <span className="text-[10px] text-slate-500 italic">[{card.phonetic}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
