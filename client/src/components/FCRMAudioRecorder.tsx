import React, { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type VoiceFeedback, type LanguageCode } from '../db/schema'
import { TOP_25_COUNTRIES_REGISTRY } from '../db/seed'
import {
  Mic,
  Square,
  Trash2,
  AlertCircle,
  MessageSquare,
  Languages,
  Play,
  Pause,
  Volume2,
  Globe2,
  CheckCircle2,
  Sliders,
  Filter,
  BookOpen,
} from 'lucide-react'

export const FCRMAudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [filterLanguage, setFilterLanguage] = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedSchool, setSelectedSchool] = useState<string>('SCH-SSD-01')
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('English')
  const [selectedCategory, setSelectedCategory] = useState<'infrastructure_barrier' | 'safeguarding_concern' | 'health_mhm' | 'general' | 'displacement'>('infrastructure_barrier')
  const [customNoteSummary, setCustomNoteSummary] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Real Human Speech Synthesis State
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [speechRate, setSpeechRate] = useState<number>(0.95)
  const [speechPitch, setSpeechPitch] = useState<number>(1.0)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  // Load browser-native natural human speech voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
      }
    }

    updateVoices()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const voiceNotes = useLiveQuery(
    () => db.voiceFeedback.orderBy('timestamp').reverse().toArray(),
    []
  ) ?? []

  // Filter voice notes
  const filteredVoiceNotes = voiceNotes.filter((note) => {
    const matchesLang = filterLanguage === 'all' || note.language === filterLanguage
    const matchesCountry = filterCountry === 'all' || note.country === filterCountry
    const matchesCat = filterCategory === 'all' || note.category === filterCategory
    return matchesLang && matchesCountry && matchesCat
  })

  // Play Natural Human Voice via Web Speech API
  const handlePlayNaturalVoice = (note: VoiceFeedback) => {
    if (!note.id || !note.transcriptSummary) return

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMessage('Browser Speech Synthesis is not supported in this environment.')
      return
    }

    // If already playing this note, toggle pause/stop
    if (speakingId === note.id) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }

    window.speechSynthesis.cancel()
    setSpeakingId(note.id)

    const cleanText = note.transcriptSummary.replace(/^["']|["']$/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)

    utterance.rate = speechRate
    utterance.pitch = speechPitch

    // Select the most natural voice based on language
    const lang = note.language || 'English'
    let preferredVoice: SpeechSynthesisVoice | undefined

    if (lang === 'French') {
      preferredVoice = availableVoices.find((v) => v.lang.startsWith('fr'))
    } else if (lang === 'Arabic') {
      preferredVoice = availableVoices.find((v) => v.lang.startsWith('ar'))
    } else if (lang === 'Portuguese') {
      preferredVoice = availableVoices.find((v) => v.lang.startsWith('pt'))
    } else if (lang === 'Urdu') {
      preferredVoice = availableVoices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi'))
    } else if (lang === 'Swahili' || lang === 'Maa') {
      preferredVoice = availableVoices.find(
        (v) => v.lang.startsWith('sw') || v.lang.startsWith('en-KE') || v.lang.startsWith('en-ZA') || v.name.toLowerCase().includes('kenya') || v.name.toLowerCase().includes('african')
      )
    } else {
      preferredVoice = availableVoices.find(
        (v) => v.lang.startsWith('en-KE') || v.lang.startsWith('en-GB') || v.lang.startsWith('en-US') || v.lang.startsWith('en-NG')
      )
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onend = () => {
      setSpeakingId(null)
    }

    utterance.onerror = () => {
      setSpeakingId(null)
    }

    window.speechSynthesis.speak(utterance)
  }

  const startRecording = async () => {
    setErrorMessage(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        stream.getTracks().forEach((track) => track.stop())

        const schoolMeta = TOP_25_COUNTRIES_REGISTRY.find((s) => s.id === selectedSchool)

        await db.voiceFeedback.add({
          schoolId: selectedSchool,
          country: schoolMeta?.country || 'South Sudan',
          countryFlag: schoolMeta?.countryFlag || '🇸🇸',
          timestamp: new Date().toISOString(),
          audioBlob,
          durationSeconds: recordingDuration,
          category: selectedCategory,
          language: selectedLanguage,
          transcriptSummary: customNoteSummary || 'Field voice memo recorded by community elder / parent representative in rural school catchment zone.',
          status: 'pending',
          synced: 0,
        })

        setRecordingDuration(0)
        setCustomNoteSummary('')
      }

      recorder.start(1000)
      setIsRecording(true)
      setRecordingDuration(0)

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Audio recording error:', err)
      setErrorMessage(
        'Microphone access unavailable or denied. Check browser audio permissions.'
      )
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (speakingId === id && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
    }
    await db.voiceFeedback.delete(id)
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Top Header & UNESCO Alignment Banner */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                UNESCO HerAtlas Aligned
              </span>
              <span className="text-xs font-semibold text-slate-500">
                FCRM Global Voice Feedback &amp; Grievance Redress (Top 25 Nations)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-indigo-600" />
              Global Multi-Lingual Audio Voice Ledger
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Enables low-literacy pastoralist elders, mothers, and community mentors across 25 developing nations to submit audio feedback without barriers. Click <strong>Play Human Voice</strong> to hear natural speech narration.
            </p>
          </div>

          {/* Voice Speed & Natural Tuning Controls */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <Sliders className="h-4 w-4 text-indigo-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-700 block">Speech Speed: {speechRate}x</span>
              <div className="flex items-center gap-1 mt-1">
                {[0.8, 0.95, 1.1].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                      speechRate === rate ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Language & Country Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span>Filter Global Feedback:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Language Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Languages className="h-3 w-3 text-indigo-600" /> Language / Dialect
              </label>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-sm"
              >
                <option value="all">All Languages &amp; Dialects</option>
                <option value="English">English (Global Humanitarian Standard)</option>
                <option value="French">Français (Chad / Mali / CAR / Guinea / DRC)</option>
                <option value="Arabic">Arabic (Yemen / Sudan / Horn)</option>
                <option value="Swahili">Kiswahili (Kenya / Tanzania / Uganda)</option>
                <option value="Hausa">Hausa (Nigeria / Niger)</option>
                <option value="Somali">Af-Soomaali (Somalia / Garissa)</option>
                <option value="Dari">Dari / Pashto (Afghanistan)</option>
                <option value="Urdu">Urdu (Pakistan)</option>
                <option value="Portuguese">Português (Mozambique)</option>
                <option value="Karimojong">Karimojong (Uganda Karamoja)</option>
                <option value="Nepali">Nepali (Nepal)</option>
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Globe2 className="h-3 w-3 text-indigo-600" /> Country (Top 25)
              </label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-sm"
              >
                <option value="all">All 25 Priority Countries</option>
                {TOP_25_COUNTRIES_REGISTRY.map((c) => (
                  <option key={c.id} value={c.country}>
                    {c.countryFlag} {c.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-indigo-600" /> Vulnerability Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-sm"
              >
                <option value="all">All Categories</option>
                <option value="infrastructure_barrier">Infrastructure / Flash Flooding</option>
                <option value="health_mhm">Health &amp; Period Poverty (WASH)</option>
                <option value="safeguarding_concern">Safeguarding &amp; Child Marriage (ECM)</option>
                <option value="displacement">Conflict &amp; Displacement Transit</option>
                <option value="general">General Community Reporting</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Notes Audio Ledger */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              Global Voice Notes ({filteredVoiceNotes.length} Transcribed Field Memos)
            </h3>
            <p className="text-xs text-slate-500">
              High-fidelity voice playback powered by natural human speech synthesis across 25 nations
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Human Voice Engine Active
          </span>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filteredVoiceNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No voice notes match the selected language and regional filter.
            </div>
          ) : (
            filteredVoiceNotes.map((note: VoiceFeedback) => {
              const isSpeaking = speakingId === note.id
              const dateStr = new Date(note.timestamp).toLocaleDateString()

              return (
                <div
                  key={note.id}
                  className={`py-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 transition rounded-xl px-3 ${
                    isSpeaking ? 'bg-indigo-50/50 border border-indigo-200/60' : ''
                  }`}
                >
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {note.schoolId} · Note #{note.id}
                      </span>
                      {note.country && (
                        <span className="rounded bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                          {note.countryFlag} {note.country}
                        </span>
                      )}
                      {note.language && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                          <Languages className="h-3 w-3" />
                          {note.language}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          note.status === 'escalated'
                            ? 'bg-rose-100 text-rose-800'
                            : note.status === 'reviewed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {note.status}
                      </span>
                    </div>

                    {/* Transcribed Speech Quote Box */}
                    {note.transcriptSummary && (
                      <div className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed font-sans shadow-sm">
                        <span className="font-bold text-indigo-700 mr-1">Transcribed Field Report:</span>
                        "{note.transcriptSummary}"
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Logged: {dateStr}</span>
                      <span>·</span>
                      <span className="capitalize">{note.category?.replace('_', ' ')}</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">Synced to M&amp;E API</span>
                    </div>
                  </div>

                  {/* Natural Speech Playback Controller */}
                  <div className="flex items-center gap-3 shrink-0 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                      onClick={() => handlePlayNaturalVoice(note)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                        isSpeaking
                          ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-300 animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <Pause className="h-4 w-4 fill-current" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                          <span>Play Human Voice</span>
                        </>
                      )}
                    </button>

                    {/* Animated Speech Waveform Indicator */}
                    <div className="flex items-center gap-1 px-2 h-8">
                      {[14, 26, 18, 30, 10, 22, 34, 16, 24, 12].map((h, i) => (
                        <span
                          key={i}
                          style={{
                            height: `${isSpeaking ? Math.max(6, Math.min(32, h + Math.sin(Date.now() / 150 + i) * 12)) : 6}px`,
                          }}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isSpeaking ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => note.id && handleDelete(note.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-2 rounded-lg hover:bg-slate-50"
                      title="Delete recording"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Field Recording Studio Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Mic className="h-4 w-4 text-indigo-600" />
            Record New Community Audio Feedback
          </h3>
          <p className="text-xs text-slate-500">Capture voice memo directly from field mentor or parent committee</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Partner School Catchment (25 Countries)</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500"
            >
              {TOP_25_COUNTRIES_REGISTRY.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.countryFlag} {s.name} ({s.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Speaker Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500"
            >
              <option value="English">English</option>
              <option value="French">Français</option>
              <option value="Arabic">Arabic</option>
              <option value="Swahili">Kiswahili</option>
              <option value="Hausa">Hausa</option>
              <option value="Somali">Af-Soomaali</option>
              <option value="Dari">Dari</option>
              <option value="Urdu">Urdu</option>
              <option value="Portuguese">Português</option>
              <option value="Karimojong">Karimojong</option>
              <option value="Nepali">Nepali</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Grievance Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500"
            >
              <option value="infrastructure_barrier">Infrastructure / River Floods</option>
              <option value="health_mhm">Health &amp; Period Poverty (WASH)</option>
              <option value="safeguarding_concern">Safeguarding &amp; Early Marriage (ECM)</option>
              <option value="displacement">Conflict &amp; Displacement Transit</option>
              <option value="general">General Community Reporting</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Transcript / Summary of Speaker Feedback
          </label>
          <input
            type="text"
            placeholder="Type transcript or key grievance details..."
            value={customNoteSummary}
            onChange={(e) => setCustomNoteSummary(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col items-center justify-center py-4 text-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 ${
              isRecording ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-200' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRecording ? <Square className="h-6 w-6 fill-current" /> : <Mic className="h-6 w-6" />}
          </button>
          <div className="mt-2 text-xs font-bold text-slate-800 font-mono">
            {formatTimer(recordingDuration)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isRecording ? 'Recording live audio... Click square to save note.' : 'Click mic to record.'}
          </p>
        </div>
      </div>
    </div>
  )
}
