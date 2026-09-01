import React, { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type VoiceFeedback } from '../db/schema'
import { SCHOOL_REGISTRY } from '../db/seed'
import {
  Mic,
  Square,
  Trash2,
  AlertCircle,
  MessageSquare,
  Languages,
  Play,
  Pause,
  Download,
  Activity,
  Headphones,
  CheckCircle2,
} from 'lucide-react'

export const FCRMAudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedSchool, setSelectedSchool] = useState<string>('SCH-KE-NRK-01')
  const [selectedLanguage, setSelectedLanguage] = useState<'Swahili' | 'English' | 'Maa' | 'Karimojong' | 'Somali'>('Swahili')
  const [selectedCategory, setSelectedCategory] = useState<'infrastructure_barrier' | 'safeguarding_concern' | 'health_mhm' | 'general'>('infrastructure_barrier')
  const [customNoteSummary, setCustomNoteSummary] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [playbackUrls, setPlaybackUrls] = useState<Record<number, string>>({})
  const [playingId, setPlayingId] = useState<number | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)

  const availableSchools = SCHOOL_REGISTRY.filter(
    (s) => selectedCountry === 'all' || s.country === selectedCountry
  )

  const voiceNotes = useLiveQuery(
    () => db.voiceFeedback.orderBy('timestamp').reverse().toArray(),
    []
  ) ?? []

  const filteredVoiceNotes = voiceNotes.filter((note) => {
    if (selectedCountry === 'all') return true
    return note.country === selectedCountry
  })

  // Create temporary object URLs for audio playback safely
  useEffect(() => {
    const urls: Record<number, string> = {}
    voiceNotes.forEach((note) => {
      if (note.id && note.audioBlob) {
        try {
          urls[note.id] = URL.createObjectURL(note.audioBlob)
        } catch {
          // Ignore invalid blobs
        }
      }
    })
    setPlaybackUrls(urls)

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [voiceNotes])

  const handleTogglePlay = (noteId: number) => {
    const url = playbackUrls[noteId]
    if (!url) return

    if (playingId === noteId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
      }
      setPlayingId(null)
      return
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
    }

    const audio = new Audio(url)
    activeAudioRef.current = audio
    setPlayingId(noteId)

    audio.onended = () => {
      setPlayingId(null)
    }

    audio.onerror = () => {
      setPlayingId(null)
    }

    audio.play().catch((err) => {
      console.warn('Audio play failed:', err)
      setPlayingId(null)
    })
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

        const schoolMeta = SCHOOL_REGISTRY.find((s) => s.id === selectedSchool)

        await db.voiceFeedback.add({
          schoolId: selectedSchool,
          country: schoolMeta?.country || 'Kenya',
          timestamp: new Date().toISOString(),
          audioBlob,
          durationSeconds: recordingDuration,
          category: selectedCategory,
          language: selectedLanguage,
          transcriptSummary: customNoteSummary || 'Field voice feedback recorded by local community elder / parent representative.',
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
    if (playingId === id && activeAudioRef.current) {
      activeAudioRef.current.pause()
      setPlayingId(null)
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
      {/* Recording Studio Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Headphones className="h-5 w-5 text-indigo-600" />
              FCRM Regional Voice Feedback &amp; Complaints Module
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accessible multi-lingual audio reporting for low-literacy parents and pastoralist community elders
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={selectedCountry}
              onChange={(e) => {
                const c = e.target.value
                setSelectedCountry(c)
                const first = SCHOOL_REGISTRY.find((s) => c === 'all' || s.country === c)
                if (first) setSelectedSchool(first.id)
              }}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-sm"
            >
              <option value="all">All Countries</option>
              <option value="Kenya">Kenya (🇰🇪)</option>
              <option value="Uganda">Uganda (🇺🇬)</option>
              <option value="Tanzania">Tanzania (🇹🇿)</option>
            </select>

            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none shadow-sm"
            >
              {availableSchools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none shadow-sm"
            >
              <option value="Swahili">Kiswahili</option>
              <option value="English">English</option>
              <option value="Maa">Maa (Maasai)</option>
              <option value="Karimojong">Karimojong</option>
              <option value="Somali">Af-Soomaali</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Big Record Studio & Waveform Meter */}
        <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping" />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-200'
                  : 'bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 ring-4 ring-indigo-100'
              }`}
            >
              {isRecording ? (
                <Square className="h-8 w-8 fill-current" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
          </div>

          <div className="mt-4">
            <span className="font-mono text-2xl font-black text-slate-900">
              {formatTimer(recordingDuration)}
            </span>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {isRecording ? 'Recording audio note... Tap square to save' : 'Tap microphone to start recording new voice feedback'}
            </p>
          </div>

          {/* Quick optional transcript box for field staff */}
          <div className="mt-5 w-full max-w-md">
            <input
              type="text"
              placeholder="Optional field transcript summary (Swahili / English)..."
              value={customNoteSummary}
              onChange={(e) => setCustomNoteSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Offline Stored Audio Notes Queue */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              Regional Safeguarding Audio Ledger ({filteredVoiceNotes.length} Recordings)
            </h3>
            <p className="text-xs text-slate-500">Transcribed community voice notes with in-browser audio playback</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Audio Verified
          </span>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filteredVoiceNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No voice notes found for this filter.
            </div>
          ) : (
            filteredVoiceNotes.map((note: VoiceFeedback) => {
              const audioUrl = note.id ? playbackUrls[note.id] : null
              const isPlaying = playingId === note.id
              const dateStr = new Date(note.timestamp).toLocaleString()

              return (
                <div key={note.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {note.schoolId} · Note #{note.id}
                      </span>
                      {note.country && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                          {note.country}
                        </span>
                      )}
                      {note.language && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/60">
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

                    {note.transcriptSummary && (
                      <p className="text-xs text-slate-800 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 leading-relaxed font-sans shadow-inner">
                        "{note.transcriptSummary}"
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400">
                      Recorded: {dateStr} {note.durationSeconds ? `· ${note.durationSeconds}s duration` : ''}
                    </div>
                  </div>

                  {/* Interactive Custom Audio Player */}
                  <div className="flex items-center gap-3 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <button
                      onClick={() => note.id && handleTogglePlay(note.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition active:scale-95 ${
                        isPlaying
                          ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-300 animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                      title={isPlaying ? 'Pause Audio' : 'Play Voice Recording'}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Waveform Bars Visualizer */}
                    <div className="flex items-center gap-0.5 px-2">
                      {[12, 24, 16, 28, 8, 20, 32, 14, 22, 10].map((height, i) => (
                        <span
                          key={i}
                          style={{ height: `${isPlaying ? Math.max(6, Math.min(28, height + Math.sin(Date.now() / 200 + i) * 10)) : 8}px` }}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isPlaying ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>

                    {audioUrl && (
                      <a
                        href={audioUrl}
                        download={`safe-voice-${note.id}.wav`}
                        className="text-slate-400 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-white"
                        title="Download audio recording"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}

                    <button
                      onClick={() => note.id && handleDelete(note.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-white"
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
    </div>
  )
}
