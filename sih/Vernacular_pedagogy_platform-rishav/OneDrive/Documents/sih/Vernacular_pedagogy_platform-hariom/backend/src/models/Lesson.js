import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: 200
    },
    subject: {
      type: String,
      default: 'General Science'
    },
    gradeLevel: {
      type: String,
      default: 'Class 5'
    },
    sourceText: {
      type: String,
      required: [true, 'Source content is required']
    },
    sourceLanguage: {
      type: String,
      default: 'Hindi'
    },
    simplifiedText: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'markdown', 'manual'],
      default: 'manual'
    },
    originalFileName: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    translations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Translation'
      }
    ]
  },
  {
    timestamps: true
  }
);

export const mockLessons = [
  {
    _id: 'les_01',
    id: 1,
    title: 'The Water Cycle (जल चक्र)',
    subject: 'Science',
    gradeLevel: 'Class 6',
    sourceText: 'जल चक्र वह प्रक्रिया है जिसमें पानी का वाष्पीकरण होता है, फिर संघनन होकर बादल बनते हैं और अंत में वर्षा के रूप में पानी वापस धरती पर आता है।',
    sourceLanguage: 'Hindi',
    simplifiedText: 'सूरज की गर्मी से नदी और तालाब का पानी भाप बनकर ऊपर उड़ता है। ऊपर ठंड से बादल बनते हैं और फिर बारिश बनकर गिरते हैं।',
    translations: []
  },
  {
    _id: 'les_02',
    id: 2,
    title: 'Our Forest Friends (हमारे वन मित्र)',
    subject: 'EVS',
    gradeLevel: 'Class 5',
    sourceText: 'पेड़-पौधे और जंगल हमारे सबसे बड़े मित्र हैं। वे हमें शुद्ध हवा, फल, औषधियां और पक्षियों को आश्रय प्रदान करते हैं।',
    sourceLanguage: 'Hindi',
    simplifiedText: 'जंगल हमें ताज़ी हवा और फल देते हैं। हमें पेड़ों की रक्षा करनी चाहिए।',
    translations: []
  },
  {
    _id: 'les_03',
    id: 3,
    title: 'The Story of Birsa Munda (धरती आबा बिरसा मुंडा)',
    subject: 'Social Studies',
    gradeLevel: 'Class 5',
    sourceText: 'बिरसा मुंडा झारखंड के महान आदिवासी स्वतंत्रता सेनानी और जननायक थे, जिन्होंने जल, जंगल और जमीन की रक्षा के लिए उलगुलान आंदोलन चलाया।',
    sourceLanguage: 'Hindi',
    simplifiedText: 'बिरसा मुंडा ने हमारे जंगल और आदिवासियों के अधिकारों के लिए लड़ाई लड़ी। उन्हें धरती आबा कहा जाता है।',
    translations: []
  }
];

export const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
