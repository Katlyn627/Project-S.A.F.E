import React, { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type VoiceFeedback } from '../db/schema'
import { Mic, Square, Volume2, Trash2, AlertCircle } from 'lucide-react'

export const FCRMAudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [selectedSchool, setSelectedSchool] = useState<string>('SCH-MARA-01')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [playbackUrls, setPlaybackUrls] = useState<Record<number, string>>({})

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  // Fetch all voice notes from Dexie
  const voiceNotes = useLiveQuery(
    () => db.voiceFeedback.orderBy('timestamp').reverse().toArray(),
    []
  ) ?? []

  // Create temporary object URLs for audio playback safely
  useEffect(() => {
    const urls: Record<number, string> = {}
    voiceNotes.forEach((note) => {
      if (note.id && note.audioBlob) {
        urls[note.id] = URL.createObjectURL(note.audioBlob)
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

        await db.voiceFeedback.add({
          schoolId: selectedSchool,
          timestamp: new Date().toISOString(),
          audioBlob,
          durationSeconds: recordingDuration,
          status: 'pending',
          synced: 0,
        })

        setRecordingDuration(0)
      }

      recorder.start(1000)
      setIsRecording(true)
      setRecordingDuration(0)

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Audio recording failed:', err)
      setErrorMessage(
        'Unable to access microphone. Please ensure microphone permissions are allowed.'
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
              FCRM Voice Feedback Module
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audio safeguarding notes & community feedback for low-literacy reporters
            </p>
          </div>

          <div>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="SCH-MARA-01">Mara Primary (SCH-MARA-01)</option>
              <option value="SCH-RIV-02">Riverbend Academy (SCH-RIV-02)</option>
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
              <span className="absolute -inset-2 rounded-full bg-rose-500/20 animate-ping" />
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
              {isRecording ? 'Recording audio... Tap to stop' : 'Tap microphone to start recording'}
            </p>
          </div>
        </div>
      </div>

      {/* Offline Stored Audio Notes Queue */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Recorded Safeguarding Notes ({voiceNotes.length})
          </h3>
          <span className="text-xs text-slate-500">Stored locally in IndexedDB</span>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {voiceNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No voice notes recorded yet.
            </div>
          ) : (
            voiceNotes.map((note: VoiceFeedback) => {
              const audioUrl = note.id ? playbackUrls[note.id] : null
              const dateStr = new Date(note.timestamp).toLocaleString()

              return (
                <div key={note.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {note.schoolId} · Voice Note #{note.id}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          note.synced === 1
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {note.synced === 1 ? 'Synced' : 'Pending Upload'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {dateStr} · {note.durationSeconds ? `${note.durationSeconds}s` : 'Audio'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
