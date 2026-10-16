import type { CommonWordEntry } from '../api'

export const LOCAL_COMMON_WORDS: CommonWordEntry[] = [
  {
    id: 'hello',
    category: 'Greetings',
    english: 'Hello',
    hindi: 'नमस्ते',
    aliases: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'हैलो', 'नमस्ते', 'नमस्कार', 'हेलो', 'प्रणाम'],
    translations: {
      Santhali: { text: 'ᱡᱚᱦᱟᱨ', phonetic: 'Johar' },
      Mundari: { text: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar' },
      Ho: { text: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar' },
      Kurukh: { text: 'गॊडे लगदन', phonetic: 'Gode lagdan' },
      English: { text: 'Hello', phonetic: 'Hello' }
    }
  },
  {
    id: 'hi',
    category: 'Greetings',
    english: 'Hi',
    hindi: 'हाय',
    aliases: ['hi', 'हाय', 'सुनो', 'हे'],
    translations: {
      Santhali: { text: 'ᱡᱚᱦᱟᱨ', phonetic: 'Johar' },
      Mundari: { text: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar' },
      Ho: { text: 'ᱡᱳᱦᱟᱨ', phonetic: 'Johar' },
      Kurukh: { text: 'गॊडे', phonetic: 'Gode' },
      English: { text: 'Hi', phonetic: 'Hi' }
    }
  },
  {
    id: 'good',
    category: 'Expressions',
    english: 'Good',
    hindi: 'अच्छा',
    aliases: ['good', 'great', 'fine', 'nice', 'achha', 'achha hai', 'badhiya', 'अच्छा', 'बढ़िया', 'सुंदर', 'उत्तम'],
    translations: {
      Santhali: { text: 'ᱵᱷᱟᱹᱜᱤ', phonetic: 'Bhagi' },
      Mundari: { text: 'ᱵᱩᱜᱤ', phonetic: 'Bugi' },
      Ho: { text: 'ᱵᱩᱜᱤ', phonetic: 'Bugi' },
      Kurukh: { text: 'दाव', phonetic: 'Daaw' },
      English: { text: 'Good', phonetic: 'Good' }
    }
  },
  {
    id: 'bad',
    category: 'Expressions',
    english: 'Bad',
    hindi: 'बुरा',
    aliases: ['bad', 'poor', 'bura', 'kharab', 'बुरा', 'खराब', 'गंदा'],
    translations: {
      Santhali: { text: 'ᱵᱟᱹᱲᱤᱡ', phonetic: 'Baṛij' },
      Mundari: { text: 'ᱵᱟᱹᱲᱤᱡ', phonetic: 'Baṛij' },
      Ho: { text: 'ᱮᱫᱠᱟ', phonetic: 'Edka' },
      Kurukh: { text: 'मल्हा दाव', phonetic: 'Malha daaw' },
      English: { text: 'Bad', phonetic: 'Bad' }
    }
  },
  {
    id: 'thank_you',
    category: 'Politeness',
    english: 'Thank you',
    hindi: 'धन्यवाद',
    aliases: ['thank you', 'thanks', 'dhanyawad', 'shukriya', 'धन्यवाद', 'शुक्रिया', 'आभार'],
    translations: {
      Santhali: { text: 'ᱥᱟᱨᱦᱟᱣ', phonetic: 'Sarhao' },
      Mundari: { text: 'ᱥᱟᱨᱦᱟᱣ', phonetic: 'Sarhao' },
      Ho: { text: 'ᱥᱟᱨᱦᱟᱣ', phonetic: 'Sarhao' },
      Kurukh: { text: 'धन्यबाद', phonetic: 'Dhanyawad' },
      English: { text: 'Thank you', phonetic: 'Thank you' }
    }
  },
  {
    id: 'welcome',
    category: 'Politeness',
    english: 'Welcome',
    hindi: 'स्वागत',
    aliases: ['welcome', 'swagat', 'swagatam', 'स्वागत', 'अभिनंदन'],
    translations: {
      Santhali: { text: 'ᱟᱛᱟᱝ ᱫᱟᱨᱟᱢ', phonetic: 'Atang daram' },
      Mundari: { text: 'ᱟᱛᱟᱝ ᱫᱟᱨᱟᱢ', phonetic: 'Atang daram' },
      Ho: { text: 'ᱫᱟᱨᱟᱢ', phonetic: 'Daram' },
      Kurukh: { text: 'नेहो', phonetic: 'Neho' },
      English: { text: 'Welcome', phonetic: 'Welcome' }
    }
  },
  {
    id: 'yes',
    category: 'Response',
    english: 'Yes',
    hindi: 'हाँ',
    aliases: ['yes', 'yeah', 'haan', 'han', 'हाँ', 'हां', 'जी हाँ', 'जी हां'],
    translations: {
      Santhali: { text: 'ᱦᱮᱸ', phonetic: 'Hẽ' },
      Mundari: { text: 'ᱦᱮᱸ', phonetic: 'Hẽ' },
      Ho: { text: 'ᱦᱮᱸ', phonetic: 'Hẽ' },
      Kurukh: { text: 'हँय', phonetic: 'Hãñ' },
      English: { text: 'Yes', phonetic: 'Yes' }
    }
  },
  {
    id: 'no',
    category: 'Response',
    english: 'No',
    hindi: 'नहीं',
    aliases: ['no', 'nahin', 'nahi', 'nope', 'नहीं', 'ना', 'मत'],
    translations: {
      Santhali: { text: 'ᱵᱟᱝ', phonetic: 'Bang' },
      Mundari: { text: 'ᱵᱟᱝ', phonetic: 'Bang' },
      Ho: { text: 'ᱠᱟ', phonetic: 'Ka' },
      Kurukh: { text: 'मल्ला', phonetic: 'Malla' },
      English: { text: 'No', phonetic: 'No' }
    }
  },
  {
    id: 'please',
    category: 'Politeness',
    english: 'Please',
    hindi: 'कृपया',
    aliases: ['please', 'kripya', 'कृपया', 'मेहरबानी'],
    translations: {
      Santhali: { text: 'ᱫᱟᱭᱟ ᱠᱟᱛᱮ', phonetic: 'Daya kate' },
      Mundari: { text: 'ᱫᱟᱭᱟ ᱠᱟᱛᱮ', phonetic: 'Daya kate' },
      Ho: { text: 'ᱫᱟᱭᱟ ᱛᱮ', phonetic: 'Daya te' },
      Kurukh: { text: 'नेहोती', phonetic: 'Nehoti' },
      English: { text: 'Please', phonetic: 'Please' }
    }
  },
  {
    id: 'water',
    category: 'Nature',
    english: 'Water',
    hindi: 'पानी',
    aliases: ['water', 'pani', 'jal', 'नीर', 'पानी', 'जल'],
    translations: {
      Santhali: { text: 'ᱫᱟᱜ', phonetic: "Da'" },
      Mundari: { text: 'ᱫᱟᱜ', phonetic: "Da'" },
      Ho: { text: 'ᱫᱟᱜ', phonetic: "Da'" },
      Kurukh: { text: 'अम्म', phonetic: 'Amm' },
      English: { text: 'Water', phonetic: 'Water' }
    }
  },
  {
    id: 'food',
    category: 'Daily',
    english: 'Food',
    hindi: 'खाना',
    aliases: ['food', 'meal', 'khana', 'bhojan', 'खाना', 'भोजन', 'रोटी'],
    translations: {
      Santhali: { text: 'ᱫᱟᱠᱟ', phonetic: 'Daka' },
      Mundari: { text: 'ᱢᱟᱱᱰᱤ', phonetic: 'Mandi' },
      Ho: { text: 'ᱢᱟᱱᱰᱤ', phonetic: 'Mandi' },
      Kurukh: { text: 'मन्दी', phonetic: 'Mandi' },
      English: { text: 'Food', phonetic: 'Food' }
    }
  },
  {
    id: 'school',
    category: 'Pedagogy',
    english: 'School',
    hindi: 'स्कूल',
    aliases: ['school', 'vidyalaya', 'pathshala', 'स्कूल', 'विद्यालय', 'पाठशाला'],
    translations: {
      Santhali: { text: 'ᱟᱥᱲᱟ', phonetic: 'Asṛa' },
      Mundari: { text: 'ᱤᱛᱩᱱ ᱚᱲᱟᱜ', phonetic: 'Itun oṛa' },
      Ho: { text: 'ᱤᱛᱩᱱ ᱚᱲᱟᱜ', phonetic: 'Itun oṛa' },
      Kurukh: { text: 'पदा चाला', phonetic: 'Pada chala' },
      English: { text: 'School', phonetic: 'School' }
    }
  },
  {
    id: 'teacher',
    category: 'Pedagogy',
    english: 'Teacher',
    hindi: 'शिक्षक',
    aliases: ['teacher', 'shikshak', 'guruji', 'adhyapak', 'sir', 'madam', 'शिक्षक', 'गुरुजी', 'अध्यापक'],
    translations: {
      Santhali: { text: 'ᱢᱟᱪᱮᱛ', phonetic: 'Machet' },
      Mundari: { text: 'ᱢᱟᱪᱮᱛ', phonetic: 'Machet' },
      Ho: { text: 'ᱢᱟᱪᱤᱛ', phonetic: 'Machit' },
      Kurukh: { text: 'पोढ़ोउस', phonetic: 'Podhous' },
      English: { text: 'Teacher', phonetic: 'Teacher' }
    }
  },
  {
    id: 'student',
    category: 'Pedagogy',
    english: 'Student',
    hindi: 'विद्यार्थी',
    aliases: ['student', 'learner', 'vidyarthi', 'chhatra', 'shishya', 'विद्यार्थी', 'छात्र', 'शिष्य'],
    translations: {
      Santhali: { text: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ', phonetic: 'Paṭhua' },
      Mundari: { text: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ', phonetic: 'Paṭhua' },
      Ho: { text: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ', phonetic: 'Paṭhua' },
      Kurukh: { text: 'पड़ू', phonetic: 'Padu' },
      English: { text: 'Student', phonetic: 'Student' }
    }
  },
  {
    id: 'children',
    category: 'Pedagogy',
    english: 'Children',
    hindi: 'बच्चे',
    aliases: ['children', 'kids', 'child', 'bacche', 'bachho', 'बच्चे', 'बच्चों', 'बच्चा', 'बालक'],
    translations: {
      Santhali: { text: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ', phonetic: 'Gidra ko' },
      Mundari: { text: 'ᱦᱩᱲᱤᱝ ᱠᱳ', phonetic: 'Huring ko' },
      Ho: { text: 'ᱦᱳᱱ ᱠᱳ', phonetic: 'Hon ko' },
      Kurukh: { text: 'खोड़ोर', phonetic: "Khor'or" },
      English: { text: 'Children', phonetic: 'Children' }
    }
  },
  {
    id: 'book',
    category: 'Pedagogy',
    english: 'Book',
    hindi: 'किताब',
    aliases: ['book', 'kitab', 'pustak', 'pothi', 'किताब', 'पुस्तक', 'पोथी'],
    translations: {
      Santhali: { text: 'ᱯᱩᱛᱷᱤ', phonetic: 'Puthi' },
      Mundari: { text: 'ᱯᱩᱛᱷᱤ', phonetic: 'Puthi' },
      Ho: { text: 'ᱯᱩᱛᱷᱤ', phonetic: 'Puthi' },
      Kurukh: { text: 'पुथी', phonetic: 'Puthi' },
      English: { text: 'Book', phonetic: 'Book' }
    }
  },
  {
    id: 'friend',
    category: 'Social',
    english: 'Friend',
    hindi: 'दोस्त',
    aliases: ['friend', 'dost', 'mitra', 'saheli', 'दोस्त', 'मित्र', 'सहेली', 'यार'],
    translations: {
      Santhali: { text: 'ᱜᱟᱛᱮ', phonetic: 'Gate' },
      Mundari: { text: 'ᱡᱚᱲᱤ', phonetic: 'Joṛi' },
      Ho: { text: 'ᱡᱩᱲᱤ', phonetic: 'Juṛi' },
      Kurukh: { text: 'संगी', phonetic: 'Sangi' },
      English: { text: 'Friend', phonetic: 'Friend' }
    }
  },
  {
    id: 'morning',
    category: 'Time',
    english: 'Morning',
    hindi: 'सुबह',
    aliases: ['morning', 'subah', 'savera', 'सुबह', 'सवेरा', 'प्रातः'],
    translations: {
      Santhali: { text: 'ᱥᱮᱛᱟᱜ', phonetic: "Seta'" },
      Mundari: { text: 'ᱥᱮᱛᱟᱜ', phonetic: "Seta'" },
      Ho: { text: 'ᱥᱮᱛᱟᱜ', phonetic: "Seta'" },
      Kurukh: { text: 'पैरी', phonetic: 'Pairi' },
      English: { text: 'Morning', phonetic: 'Morning' }
    }
  },
  {
    id: 'night',
    category: 'Time',
    english: 'Night',
    hindi: 'रात',
    aliases: ['night', 'raat', 'ratri', 'रात', 'रात्रि'],
    translations: {
      Santhali: { text: 'ᱧᱤᱫᱟᱹ', phonetic: 'Ñida' },
      Mundari: { text: 'ᱱᱤᱫᱟᱹ', phonetic: 'Nida' },
      Ho: { text: 'ᱱᱤᱫᱟᱹ', phonetic: 'Nida' },
      Kurukh: { text: 'माखा', phonetic: 'Makha' },
      English: { text: 'Night', phonetic: 'Night' }
    }
  },
  {
    id: 'sun',
    category: 'Nature',
    english: 'Sun',
    hindi: 'सूरज',
    aliases: ['sun', 'suraj', 'surya', 'सूरज', 'सूर्य'],
    translations: {
      Santhali: { text: 'ᱥᱤᱧ ᱪᱟᱸᱫᱚ', phonetic: 'Siñ chando' },
      Mundari: { text: 'ᱥᱤᱝᱜᱤ', phonetic: 'Singi' },
      Ho: { text: 'ᱥᱤᱝᱜᱤ', phonetic: 'Singi' },
      Kurukh: { text: 'बीड़ी', phonetic: 'Beedi' },
      English: { text: 'Sun', phonetic: 'Sun' }
    }
  },
  {
    id: 'rain',
    category: 'Nature',
    english: 'Rain',
    hindi: 'बारिश',
    aliases: ['rain', 'barish', 'varsha', 'barsat', 'बारिश', 'वर्षा', 'बरसात'],
    translations: {
      Santhali: { text: 'ᱫᱟᱜ ᱡᱟᱹᱲᱤ', phonetic: "Da' jaṛi" },
      Mundari: { text: 'ᱜᱟᱢᱟ', phonetic: 'Gama' },
      Ho: { text: 'ᱜᱟᱢᱟ', phonetic: 'Gama' },
      Kurukh: { text: 'बरखा', phonetic: 'Barkha' },
      English: { text: 'Rain', phonetic: 'Rain' }
    }
  },
  {
    id: 'tree',
    category: 'Nature',
    english: 'Tree',
    hindi: 'पेड़',
    aliases: ['tree', 'ped', 'vriksh', 'पेड़', 'वृक्ष', 'गाछ'],
    translations: {
      Santhali: { text: 'ᱫᱟᱨᱮ', phonetic: 'Dare' },
      Mundari: { text: 'ᱫᱟᱨᱩ', phonetic: 'Daru' },
      Ho: { text: 'ᱫᱟᱨᱩ', phonetic: 'Daru' },
      Kurukh: { text: 'मन', phonetic: 'Man' },
      English: { text: 'Tree', phonetic: 'Tree' }
    }
  },
  {
    id: 'come',
    category: 'Actions',
    english: 'Come',
    hindi: 'आओ',
    aliases: ['come', 'aao', 'aana', 'idhar aao', 'आओ', 'आना', 'आइए'],
    translations: {
      Santhali: { text: 'ᱦᱤᱡᱩᱜ ᱢᱮ', phonetic: 'Hijug me' },
      Mundari: { text: 'ᱦᱤᱡᱩᱜ ᱢᱮ', phonetic: 'Hijug me' },
      Ho: { text: 'ᱦᱤᱡᱩᱜ ᱢᱮ', phonetic: 'Hijug me' },
      Kurukh: { text: 'बरा', phonetic: 'Bara' },
      English: { text: 'Come', phonetic: 'Come' }
    }
  },
  {
    id: 'go',
    category: 'Actions',
    english: 'Go',
    hindi: 'जाओ',
    aliases: ['go', 'jao', 'jana', 'जाओ', 'जाना', 'जाइए'],
    translations: {
      Santhali: { text: 'ᱥᱮᱱᱚᱜ ᱢᱮ', phonetic: 'Senog me' },
      Mundari: { text: 'ᱥᱮᱱᱚᱜ ᱢᱮ', phonetic: 'Senog me' },
      Ho: { text: 'ᱥᱮᱱᱚᱜ ᱢᱮ', phonetic: 'Senog me' },
      Kurukh: { text: 'काला', phonetic: 'Kala' },
      English: { text: 'Go', phonetic: 'Go' }
    }
  },
  {
    id: 'eat',
    category: 'Actions',
    english: 'Eat',
    hindi: 'खाओ',
    aliases: ['eat', 'khao', 'khana khao', 'खाओ', 'खाना खाओ', 'भोजन करो'],
    translations: {
      Santhali: { text: 'ᱡᱚᱢ ᱢᱮ', phonetic: 'Jom me' },
      Mundari: { text: 'ᱡᱚᱢ ᱢᱮ', phonetic: 'Jom me' },
      Ho: { text: 'ᱡᱚᱢ ᱢᱮ', phonetic: 'Jom me' },
      Kurukh: { text: 'ओना', phonetic: 'Ona' },
      English: { text: 'Eat', phonetic: 'Eat' }
    }
  },
  {
    id: 'drink',
    category: 'Actions',
    english: 'Drink',
    hindi: 'पियो',
    aliases: ['drink', 'piyo', 'peena', 'पियो', 'पीना', 'पानी पियो'],
    translations: {
      Santhali: { text: 'ᱧᱩᱭ ᱢᱮ', phonetic: 'Ñuy me' },
      Mundari: { text: 'ᱱᱩᱭ ᱢᱮ', phonetic: 'Nuy me' },
      Ho: { text: 'ᱱᱩᱭ ᱢᱮ', phonetic: 'Nuy me' },
      Kurukh: { text: 'उन्ना', phonetic: 'Unna' },
      English: { text: 'Drink', phonetic: 'Drink' }
    }
  },
  {
    id: 'help',
    category: 'Social',
    english: 'Help',
    hindi: 'मदद',
    aliases: ['help', 'madad', 'sahayata', 'मदद', 'सहायता', 'मदद करो'],
    translations: {
      Santhali: { text: 'ᱜᱚᱲᱚ', phonetic: 'Goṛo' },
      Mundari: { text: 'ᱜᱚᱲᱚ', phonetic: 'Goṛo' },
      Ho: { text: 'ᱜᱚᱲᱚ', phonetic: 'Goṛo' },
      Kurukh: { text: 'सहाई', phonetic: 'Sahai' },
      English: { text: 'Help', phonetic: 'Help' }
    }
  }
]

const LOCAL_ALIAS_LOOKUP = new Map<string, CommonWordEntry>()
for (const item of LOCAL_COMMON_WORDS) {
  for (const alias of item.aliases) {
    LOCAL_ALIAS_LOOKUP.set(alias.toLowerCase().trim(), item)
  }
  LOCAL_ALIAS_LOOKUP.set(item.english.toLowerCase().trim(), item)
  LOCAL_ALIAS_LOOKUP.set(item.hindi.toLowerCase().trim(), item)
}

export function matchLocalCommonWord(text: string): CommonWordEntry | null {
  if (!text) return null
  const clean = text.toLowerCase().replace(/[.,!?;:।_'"()\-]/g, ' ').trim()
  if (LOCAL_ALIAS_LOOKUP.has(clean)) {
    return LOCAL_ALIAS_LOOKUP.get(clean)!
  }
  const tokens = clean.split(/\s+/).filter(Boolean)
  if (tokens.length > 0 && tokens.every(t => t === tokens[0]) && LOCAL_ALIAS_LOOKUP.has(tokens[0])) {
    return LOCAL_ALIAS_LOOKUP.get(tokens[0])!
  }
  return null
}
