import { useRef, useState } from 'react'
import { Languages, Mic, Volume2 } from 'lucide-react'
import { lessonApi } from './api'
import { useApp } from './context'

type Props = { voice?: boolean }
const targets = { hi: 'Hindi', en: 'English', sat: 'Santhali', unr: 'Mundari', hoc: 'Ho', kru: 'Kurukh' }

export default function GoogleTranslatorPage({ voice = false }: Props) {
  const { toast } = useApp()
  const [source, setSource] = useState('hello')
  const [target, setTarget] = useState('sat')
  const [result, setResult] = useState('')
  const [audio, setAudio] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const recognition = useRef<any>(null)

  async function translate() {
    if (!source.trim()) { toast('Add text before translating', 'error'); return }
    setLoading(true)
    try {
      const data = await lessonApi.translateSpeech(source, target)
      setResult(data.translated_text)
      setAudio(data.audio_base64 ? `data:audio/mpeg;base64,${data.audio_base64}` : null)
      toast(data.provider === 'google' ? 'Google translation and TTS audio ready' : 'Offline translation ready', data.provider === 'google' ? 'success' : 'info')
    } catch {
      setResult(`[${targets[target as keyof typeof targets]}] ${source}`)
      setAudio(null)
      toast('Google translation service unavailable', 'error')
    } finally { setLoading(false) }
  }

  function listen() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setSource('नमस्ते बच्चों, आज हम पानी के बारे में सीखेंगे।'); return }
    if (recording) { recognition.current?.stop(); setRecording(false); return }
    const instance = new SpeechRecognition()
    instance.lang = 'hi-IN'; instance.continuous = true
    instance.onresult = (event: any) => setSource(Array.from(event.results).map((item: any) => item[0].transcript).join(''))
    instance.start(); recognition.current = instance; setRecording(true)
  }

  function browserSpeak() { if (result && 'speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(result)) }

  return <section className="page-card translator-page"><div className="page-intro"><div><span className="eyebrow">GOOGLE TRANSLATION + TTS</span><h1>{voice ? 'Voice Translator' : 'Translator'}</h1><p>Translate and play audio in Hindi, English, Santhali, Mundari, Ho, or Kurukh.</p></div></div><div className="translator-grid"><div><label className="field-label">{voice ? 'Live speech transcript' : 'Source text'}<textarea value={source} onChange={event => setSource(event.target.value)} placeholder="Try hello" /></label><div className="translator-controls"><button className={recording ? 'recording-button' : 'secondary-button'} onClick={listen}><Mic size={16} />{recording ? 'Stop listening' : 'Use microphone'}</button><button className="primary-button compact" onClick={translate} disabled={loading}><Languages size={16} />{loading ? 'Translating...' : 'Translate + speak'}</button></div></div><div className="translation-result"><label className="field-label">Target language<select value={target} onChange={event => setTarget(event.target.value)}>{Object.entries(targets).map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label><div className="result-box">{result || 'Try hello to see translated text and Google TTS audio.'}</div>{audio ? <audio controls autoPlay src={audio} className="audio-player" /> : <button className="secondary-button" onClick={browserSpeak}><Volume2 size={16} /> Browser voice fallback</button>}</div></div></section>
}
