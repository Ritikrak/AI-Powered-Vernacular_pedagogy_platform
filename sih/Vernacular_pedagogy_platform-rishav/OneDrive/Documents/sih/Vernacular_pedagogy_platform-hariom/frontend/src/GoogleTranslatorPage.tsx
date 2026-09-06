import { useRef, useState } from 'react'
import { Check, Copy, Globe, Languages, Mic, MicOff, Play, Sparkles, Volume2, ArrowRight } from 'lucide-react'
import { translationApi, type TranslateAllResult } from './api'
import { useApp } from './context'

export default function GoogleTranslatorPage() {
  const { toast } = useApp()
  const [mode, setMode] = useState<'single' | 'all'>('all')
  const [sourceText, setSourceText] = useState('नमस्ते बच्चों! आज हम जल चक्र और बारिश के बारे में सीखेंगे।')
  const [targetLanguage, setTargetLanguage] = useState('Santhali')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Single translation result
  const [singleResult, setSingleResult] = useState<{
    text: string
    phonetic?: string
    audioUrl?: string
    audio_base64?: string | null
    provider?: string
  } | null>({
    text: 'ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ! ᱛᱮᱦᱮᱧ ᱫᱚ ᱟᱵᱚ ᱫᱟᱜ ᱪᱟᱠᱨᱚ (Water Cycle) ᱵᱟᱵᱚᱛ ᱵᱚᱱ ᱥᱮᱬᱟᱭᱟ᱾',
    phonetic: "Johar gidra! Teheñ do abo da' chakra babat bon seṛaya.",
    provider: 'Regional Vernacular Engine'
  })

  // Batch all dialects result
  const [allResults, setAllResults] = useState<TranslateAllResult | null>(null)

  const recognitionRef = useRef<any>(null)

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast('Please enter text to translate', 'error')
      return
    }

    setLoading(true)
    try {
      if (mode === 'single') {
        const data = await translationApi.translateSpeech(sourceText, targetLanguage, 'Hindi')
        setSingleResult({
          text: data.translated_text,
          phonetic: data.phonetic_text,
          audioUrl: data.audio_url,
          audio_base64: data.audio_base64,
          provider: data.provider
        })
        toast(`${targetLanguage} translation ready!`, 'success')
      } else {
        const data = await translationApi.translateAll(sourceText, 'Hindi')
        setAllResults(data)
        toast('Translations generated across all regional dialects!', 'success')
      }
    } catch {
      toast('Translation failed, please check backend connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast('Speech recognition not supported in this browser. Please type your phrase.', 'info')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'hi-IN'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsRecording(true)
        toast('Listening in Hindi... speak clearly', 'info')
      }

      recognition.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join('')
        setSourceText(text)
      }

      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)

      recognition.start()
      recognitionRef.current = recognition
    } catch {
      setIsRecording(false)
    }
  }

  const playAudio = (audioUrl?: string, text?: string) => {
    if (audioUrl) {
      const player = new Audio(audioUrl)
      player.play().catch(() => speakText(text || ''))
    } else if (text) {
      speakText(text)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('Copied translation to clipboard', 'info')
  }

  const quickPhrases = [
    'नमस्ते बच्चों! आज हम जल चक्र के बारे में सीखेंगे।',
    'पेड़-पौधे हमें शुद्ध हवा, फल और औषधियां देते हैं।',
    'पानी को बचाना हम सभी का कर्तव्य है।',
    'धरती आबा बिरसा मुंडा ने हमारे वनों की रक्षा की।'
  ]

  const dialectsList = [
    { key: 'Santhali', name: 'Santhali (ᱥᱟᱱᱛᱟᱲᱤ)', script: 'Ol Chiki', color: 'border-emerald-200 bg-emerald-50/70' },
    { key: 'Mundari', name: 'Mundari (ᱢᱩᱱᱰᱟᱨᱤ)', script: 'Mundari Bani', color: 'border-amber-200 bg-amber-50/70' },
    { key: 'Ho', name: 'Ho (ᱦᱳ)', script: 'Warang Citi', color: 'border-sky-200 bg-sky-50/70' },
    { key: 'Kurukh', name: 'Kurukh (कुड़ुख़)', script: 'Tolong Siki', color: 'border-purple-200 bg-purple-50/70' },
    { key: 'English', name: 'English', script: 'Latin', color: 'border-slate-200 bg-slate-50' }
  ]

  return (
    <section className="page-card translator-studio-page">
      {/* Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">AI MULTILINGUAL PEDAGOGY TRANSLATOR</span>
          <h1>Translation Studio</h1>
          <p>Instant speech-to-text & text-to-speech translation into Jharkhand vernacular dialects.</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('all')}
          >
            ⚡ All Dialects at Once
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'single' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('single')}
          >
            🎯 Single Dialect
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span>Teacher Source Speech / Text (Hindi)</span>
          </label>

          {mode === 'single' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Target Dialect:</span>
              <select
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="Santhali">Santhali (Ol Chiki)</option>
                <option value="Mundari">Mundari (Mundari Bani)</option>
                <option value="Ho">Ho (Warang Citi)</option>
                <option value="Kurukh">Kurukh (Tolong Siki)</option>
                <option value="English">English</option>
              </select>
            </div>
          )}
        </div>

        <textarea
          rows={3}
          value={sourceText}
          onChange={e => setSourceText(e.target.value)}
          placeholder="Speak or enter Hindi classroom sentences..."
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
        />

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMic}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
              {isRecording ? 'Listening Hindi...' : 'Use Microphone'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleTranslate}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <Languages size={15} />
            {loading ? 'Translating...' : mode === 'all' ? 'Translate to All 5 Dialects' : `Translate to ${targetLanguage}`}
          </button>
        </div>

        {/* Quick presets */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Quick sentences:</span>
          {quickPhrases.map((phrase, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSourceText(phrase)}
              className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS DISPLAY */}
      <div className="mt-6">
        {mode === 'single' && singleResult && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded">
                  {targetLanguage} Translation
                </span>
                <span className="text-[10px] text-slate-400">({singleResult.provider || 'Vernacular Engine'})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playAudio(singleResult.audioUrl, singleResult.text)}
                  className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <Volume2 size={15} /> Play Speech
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(singleResult.text)}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600"
                  title="Copy text"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-3">
              <h2 className="text-xl font-bold text-slate-900 leading-relaxed font-sans">
                {singleResult.text}
              </h2>
            </div>

            {singleResult.phonetic && (
              <div className="text-xs text-slate-500 font-mono italic">
                Phonetic Pronunciation: &ldquo;{singleResult.phonetic}&rdquo;
              </div>
            )}
          </div>
        )}

        {mode === 'all' && (
          <div className="space-y-3">
            <strong className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Multi-Dialect Translation Matrix
            </strong>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dialectsList.map(d => {
                const text = allResults?.translations?.[d.key] || (d.key === 'Santhali' ? singleResult?.text : '')
                const phonetic = allResults?.translations?.[`${d.key}_phonetic`] || (d.key === 'Santhali' ? singleResult?.phonetic : '')

                return (
                  <div
                    key={d.key}
                    className={`border rounded-2xl p-5 shadow-sm flex flex-col justify-between ${d.color}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <strong className="text-sm font-bold text-slate-900 block">{d.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{d.script}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {text && (
                            <button
                              type="button"
                              onClick={() => speakText(text)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 shadow-xs"
                              title="Listen"
                            >
                              <Volume2 size={14} />
                            </button>
                          )}
                          {text && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(text)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 shadow-xs"
                              title="Copy"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-base font-bold text-slate-900 mb-2 leading-relaxed min-h-[46px]">
                        {text || 'Click "Translate to All 5 Dialects" to populate.'}
                      </p>
                    </div>

                    {phonetic && (
                      <div className="pt-2 border-t border-slate-200/50 mt-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Phonetic:</span>
                        <p className="text-xs text-slate-700 italic font-mono">&ldquo;{phonetic}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
