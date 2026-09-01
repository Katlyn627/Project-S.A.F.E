import React, { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type VoiceFeedback, type CountryCode } from '../db/schema'
import { SCHOOL_REGISTRY } from '../db/seed'
import {
  Mic,
  Square,
  Volume2,
  Trash2,
  AlertCircle,
  MessageSquare,
  Globe2,
  Languages,
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  const availableSchools = SCHOOL_REGISTRY.filter(
    (s) => selectedCountry === 'all' || s.country === selectedCountry
  )

  // Fetch all voice notes from Dexie
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
          transcriptSummary: customNoteSummary || 'Field audio feedback recorded by local community elder / parent representative.',
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-indigo-600" />
              FCRM Regional Voice Feedback Module
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
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Countries</option>
              <option value="Kenya">Kenya (🇰🇪)</option>
              <option value="Uganda">Uganda (🇺🇬)</option>
              <option value="Tanzania">Tanzania (🇹🇿)</option>
            </select>

            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
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
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
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

        {/* Big Record Button & Timer */}
        <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
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
            <span className="font-mono text-2xl font-bold text-slate-800">
              {formatTimer(recordingDuration)}
            </span>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {isRecording ? 'Recording audio note... Tap to save locally' : 'Tap microphone to start recording'}
            </p>
          </div>
        </div>
      </div>

      {/* Offline Stored Audio Notes Queue */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              Regional Safeguarding Audio Ledger ({filteredVoiceNotes.length})
            </h3>
            <p className="text-xs text-slate-500">Transcribed community feedback across Kenya, Uganda, and Tanzania</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
            Encrypted Audio Store
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
              const dateStr = new Date(note.timestamp).toLocaleString()

              return (
                <div key={note.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {note.schoolId} · Note #{note.id}
                      </span>
                      {note.country && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {note.country}
                        </span>
                      )}
                      {note.language && (
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-100">
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
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          note.synced === 1
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {note.synced === 1 ? 'Synced to Central API' : 'Pending Upload'}
                      </span>
                    </div>

                    {note.transcriptSummary && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-sans">
                        "{note.transcriptSummary}"
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400">
                      Recorded: {dateStr} {note.durationSeconds ? `· ${note.durationSeconds}s duration` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {audioUrl && (
                      <audio controls src={audioUrl} className="h-8 max-w-[220px]" />
                    )}
                    <button
                      onClick={() => note.id && handleDelete(note.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Delete local note"
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
