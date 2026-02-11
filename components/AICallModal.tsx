"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Loader2,
    X,
    Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { GRADES, getSubjectsForGrade, getChaptersForSubject } from '@/app/lib/curriculum-data'
import {
    initializeSpeechRecognition,
    SilenceDetector,
    formatCallDuration,
    checkMicrophonePermission,
    sanitizeTranscript,
    isSpeechRecognitionSupported
} from '@/lib/call-utils'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface AICallModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AICallModal({ isOpen, onClose }: AICallModalProps) {
    const [isCallActive, setIsCallActive] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isAISpeaking, setIsAISpeaking] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [messages, setMessages] = useState<Message[]>([])
    const [currentTranscript, setCurrentTranscript] = useState('')
    const [volume, setVolume] = useState(1.0)
    const [showSettings, setShowSettings] = useState(false)

    // Voice settings
    const [useGeminiVoice, setUseGeminiVoice] = useState(true)
    const [geminiVoiceId, setGeminiVoiceId] = useState('Leda')

    const geminiVoices = [
        { id: 'Leda', name: 'Leda (Expert)' },
        { id: 'Fenrir', name: 'Fenrir (Energetic)' },
        { id: 'Puck', name: 'Puck (Playful)' },
        { id: 'Charon', name: 'Charon (Deep)' },
        { id: 'Kore', name: 'Kore (Calm)' },
    ]

    // Context
    const [context, setContext] = useState({
        grade: '10th Grade',
        subject: '',
        topic: ''
    })

    const [subjects, setSubjects] = useState<string[]>([])
    const [chapters, setChapters] = useState<string[]>([])

    // Refs
    const recognitionRef = useRef<any>(null)
    const silenceDetectorRef = useRef<SilenceDetector | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const callTimerRef = useRef<NodeJS.Timeout | null>(null)
    const synthRef = useRef<SpeechSynthesis | null>(null)

    // Update subjects when grade changes
    useEffect(() => {
        const subs = getSubjectsForGrade(context.grade)
        setSubjects(subs)
        if (subs.length > 0 && !subs.includes(context.subject)) {
            setContext(prev => ({ ...prev, subject: subs[0], topic: '' }))
        }
    }, [context.grade])

    // Update chapters when subject changes
    useEffect(() => {
        if (context.subject) {
            const chs = getChaptersForSubject(context.grade, context.subject)
            setChapters(chs)
            if (chs.length > 0 && !chs.includes(context.topic)) {
                setContext(prev => ({ ...prev, topic: chs[0] }))
            }
        }
    }, [context.subject, context.grade])

    // Initialize audio and speech synthesis
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio()
            synthRef.current = window.speechSynthesis

            // Load saved settings
            const savedVoice = localStorage.getItem('call-gemini-voice')
            const savedVoiceId = localStorage.getItem('call-voice-id')
            if (savedVoice) setUseGeminiVoice(savedVoice === 'true')
            if (savedVoiceId) setGeminiVoiceId(savedVoiceId)
        }
    }, [])

    // Save settings
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('call-gemini-voice', String(useGeminiVoice))
            localStorage.setItem('call-voice-id', geminiVoiceId)
        }
    }, [useGeminiVoice, geminiVoiceId])

    // Call timer
    useEffect(() => {
        if (isCallActive) {
            callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current)
            }
        }
        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current)
            }
        }
    }, [isCallActive])

    const startCall = async () => {
        if (!isSpeechRecognitionSupported()) {
            toast.error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.')
            return
        }

        if (!context.subject || !context.topic) {
            toast.error('Please select a subject and topic first')
            return
        }

        const hasPermission = await checkMicrophonePermission()
        if (!hasPermission) {
            toast.error('Microphone permission denied. Please allow microphone access.')
            return
        }

        try {
            setIsCallActive(true)
            setCallDuration(0)
            setMessages([])
            setCurrentTranscript('')

            // Use a ref to track the latest transcript for the silence detector
            const latestTranscriptRef = { current: '' }

            // Initialize speech recognition
            recognitionRef.current = initializeSpeechRecognition()

            // Setup silence detector
            silenceDetectorRef.current = new SilenceDetector(3000, () => {
                if (latestTranscriptRef.current.trim()) {
                    handleUserSpeechEnd(latestTranscriptRef.current)
                    setCurrentTranscript('')
                    latestTranscriptRef.current = ''
                }
            })

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = ''
                let finalTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript
                    } else {
                        interimTranscript += transcript
                    }
                }

                const fullTranscript = finalTranscript || interimTranscript
                setCurrentTranscript(fullTranscript)
                latestTranscriptRef.current = fullTranscript

                // Reset silence timer on speech
                if (fullTranscript.trim()) {
                    silenceDetectorRef.current?.resetTimer()

                    if (isAISpeaking) {
                        stopSpeakingAi()
                    }
                }
            }

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)

                // Don't restart on 'no-speech' - this is normal when user pauses
                if (event.error === 'no-speech') {
                    return
                }

                // Don't restart on 'aborted' - this happens when we manually stop
                if (event.error === 'aborted') {
                    return
                }

                // For other errors, show a message but try to continue
                if (event.error === 'audio-capture') {
                    toast.error('Microphone error. Please check your microphone.')
                } else if (event.error === 'not-allowed') {
                    toast.error('Microphone permission denied.')
                    endCall()
                } else {
                    console.warn('Speech recognition error, will auto-restart:', event.error)
                }
            }

            recognitionRef.current.onend = () => {
                // Only auto-restart if call is active, not muted, and AI is NOT speaking
                // The useEffect will handle restarting after AI finishes
                if (isCallActive && !isMuted && !isAISpeaking) {
                    try {
                        setTimeout(() => {
                            if (recognitionRef.current && isCallActive && !isMuted && !isAISpeaking) {
                                try {
                                    recognitionRef.current.start()
                                } catch (e: any) {
                                    if (!e.message?.includes('already started')) {
                                        console.error('Failed to restart recognition:', e)
                                    }
                                }
                            }
                        }, 100)
                    } catch (e) {
                        console.error('Failed to restart recognition:', e)
                    }
                }
            }

            recognitionRef.current.start()

            // AI greeting
            const greeting = `Hello! I'm your AI tutor. I'm here to help you with ${context.topic} for ${context.grade} ${context.subject}. What would you like to learn today?`
            const aiMessage: Message = {
                role: 'assistant',
                content: greeting,
                timestamp: new Date()
            }
            setMessages([aiMessage])
            await speak(greeting)

            toast.success('Call started! Start speaking...')
        } catch (error: any) {
            console.error('Failed to start call:', error)
            toast.error('Failed to start call. Please try again.')
            setIsCallActive(false)
        }
    }

    const stopSpeakingAi = () => {
        setIsAISpeaking(false)
        if (synthRef.current) synthRef.current.cancel()
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        if (isCallActive && !isMuted && recognitionRef.current) {
            try { recognitionRef.current.start() } catch (e) { }
        }
    }

    const endCall = () => {
        setIsCallActive(false)
        setIsMuted(false)
        setCurrentTranscript('')

        // Stop speech recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
        }

        // Stop silence detector
        silenceDetectorRef.current?.stop()
        silenceDetectorRef.current = null

        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }

        if (synthRef.current) {
            synthRef.current.cancel()
        }

        setIsAISpeaking(false)
        setIsProcessing(false)

        toast.success(`Call ended. Duration: ${formatCallDuration(callDuration)}`)
    }

    const toggleMute = () => {
        if (isMuted) {
            // Unmute - restart recognition
            setIsMuted(false)
            try {
                recognitionRef.current?.start()
                toast.success('Microphone unmuted')
            } catch (e) {
                console.error('Failed to restart recognition:', e)
            }
        } else {
            // Mute - stop recognition
            setIsMuted(true)
            recognitionRef.current?.stop()
            setCurrentTranscript('')
            toast.success('Microphone muted')
        }
    }

    // Pause recognition when AI is speaking
    useEffect(() => {
        if (!isCallActive || isMuted) return

        if (isAISpeaking && recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch (e) {
                // Ignore errors when stopping - it might already be stopped
            }
        } else if (!isAISpeaking && recognitionRef.current) {
            // Use a timeout to avoid rapid start/stop cycles
            const timeoutId = setTimeout(() => {
                if (recognitionRef.current && !isAISpeaking && !isMuted && isCallActive) {
                    try {
                        recognitionRef.current.start()
                    } catch (e: any) {
                        // Only log if it's not the "already started" error
                        if (!e.message?.includes('already started')) {
                            console.error('Error restarting recognition:', e)
                        }
                    }
                }
            }, 500)

            return () => clearTimeout(timeoutId)
        }
    }, [isAISpeaking, isCallActive, isMuted])

    const handleUserSpeechEnd = async (transcript: string) => {
        const sanitized = sanitizeTranscript(transcript)

        if (!sanitized || sanitized.length < 3) {
            console.warn('Transcript too short, ignoring')
            return
        }

        const userMessage: Message = {
            role: 'user',
            content: sanitized,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setIsProcessing(true)

        try {
            const response = await fetch('/api/ai/voice-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context
                })
            })

            if (!response.ok) {
                console.error('AI API error:', response.status)
                throw new Error('Failed to get AI response')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader available')

            let aiContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new TextDecoder().decode(value)
                aiContent += chunk
            }

            const aiMessage: Message = {
                role: 'assistant',
                content: aiContent,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, aiMessage])
            await speak(aiContent)

        } catch (error: any) {
            console.error('❌ AI response error:', error)
            toast.error('Failed to get AI response')
        } finally {
            setIsProcessing(false)
        }
    }

    const speak = async (text: string) => {
        // Try Gemini/Premium voice first if enabled
        if (useGeminiVoice) {
            try {
                setIsAISpeaking(true)

                const response = await fetch('/api/ai/text-to-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, voiceId: geminiVoiceId })
                })

                if (!response.ok) {
                    console.warn('Gemini Audio API error, falling back to browser')
                    // fallback to standard
                    speakStandard(text)
                    return
                }

                const blob = await response.blob()
                if (blob.size === 0) throw new Error('Empty audio')

                const url = URL.createObjectURL(blob)

                if (audioRef.current) {
                    audioRef.current.src = url
                    audioRef.current.volume = volume

                    audioRef.current.onended = () => {
                        setIsAISpeaking(false)
                        URL.revokeObjectURL(url)
                    }

                    audioRef.current.onerror = () => {
                        console.error('Gemini playback error')
                        speakStandard(text)
                    }

                    await audioRef.current.play()
                    return // Success
                }
            } catch (error) {
                console.error('Gemini TTS error:', error)
            }
        }

        // Fallback or default
        speakStandard(text)
    }

    const speakStandard = (text: string) => {
        if (!synthRef.current) {
            console.error('Speech synthesis not available')
            return
        }

        try {
            // Cancel any ongoing speech
            synthRef.current.cancel()

            // Small delay to ensure cancel completes
            setTimeout(() => {
                if (!synthRef.current) return

                const utterance = new SpeechSynthesisUtterance(text)
                utterance.volume = volume
                utterance.rate = 1.0
                utterance.pitch = 1.0
                utterance.lang = 'en-US'  // Default to US English

                // Prioritize Premium Google Voices (Chrome Native)
                const voices = synthRef.current.getVoices()
                const googleVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('US')) ||
                    voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
                    voices.find(v => v.lang === 'en-US')

                if (googleVoice) {
                    utterance.voice = googleVoice
                    // Google's native voices can be a bit slow, speed them up for natural conv
                    if (googleVoice.name.includes('Google')) {
                        utterance.rate = 1.15
                    }
                }

                utterance.onstart = () => {
                    setIsAISpeaking(true)
                }

                utterance.onend = () => {
                    setIsAISpeaking(false)
                }

                utterance.onerror = (event) => {
                    console.error('❌ Browser TTS error:', event.error)
                    setIsAISpeaking(false)
                    if (event.error !== 'interrupted') {
                        // Only toast on actual errors
                        console.warn('Speech playback interrupted or failed')
                    }
                }

                synthRef.current.speak(utterance)
            }, 50)
        } catch (error) {
            console.error('TTS error:', error)
            setIsAISpeaking(false)
        }
    }

    if (!isOpen) return null

    const handleVisualizerClick = () => {
        if (isAISpeaking) {
            toast.info("Stopped speaking")
            stopSpeakingAi()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            {/* Main Container */}
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[85vh]">

                {/* Global Close button */}
                {!isCallActive && (
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X size={20} className="text-zinc-400" />
                    </button>
                )}

                {/* Settings Panel Overlay */}
                {showSettings && (
                    <div className="absolute inset-0 z-60 bg-black/95 backdrop-blur-xl p-6 lg:p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-6 lg:mb-10">
                            <h3 className="text-xl font-bold text-white tracking-tight">Settings</h3>
                            <Button variant="ghost" size="icon" className="rounded-full bg-white/5" onClick={() => setShowSettings(false)}>
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400">Gemini Voice Model</h4>
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">High Fidelity Audio</p>
                                </div>
                                <button
                                    onClick={() => setUseGeminiVoice(!useGeminiVoice)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${useGeminiVoice ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useGeminiVoice ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {useGeminiVoice && (
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Voice Selection</Label>
                                    <select
                                        value={geminiVoiceId}
                                        onChange={(e) => setGeminiVoiceId(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        {geminiVoices.map((v) => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Output Volume</Label>
                                    <span className="text-xs font-bold text-emerald-500">{Math.round(volume * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowSettings(false)}
                            className="mt-auto w-full h-14 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200"
                        >
                            Done
                        </Button>
                    </div>
                )}

                {!isCallActive ? (
                    /* PRE-CALL CONFIGURATION UI */
                    <div className="flex-1 flex flex-col p-8 justify-center animate-in fade-in zoom-in duration-500">
                        <div className="text-center mb-10 space-y-4">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                <Phone size={40} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">Voice Tutor</h2>
                                <p className="text-zinc-500 text-sm mt-2 font-medium">Ready for your 1-on-1 session?</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">Grade</Label>
                                    <select
                                        value={context.grade}
                                        onChange={(e) => setContext({ ...context, grade: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:ring-1 focus:ring-emerald-500"
                                    >
                                        {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">Subject</Label>
                                    <select
                                        value={context.subject}
                                        onChange={(e) => setContext({ ...context, subject: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm text-white"
                                    >
                                        {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-zinc-500 ml-1">Focus Topic</Label>
                                <select
                                    value={context.topic}
                                    onChange={(e) => setContext({ ...context, topic: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm text-white"
                                >
                                    <option value="Full Book">Full Curriculum</option>
                                    {chapters.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <Button
                                onClick={() => setShowSettings(true)}
                                variant="outline"
                                className="w-14 h-14 rounded-2xl border-white/5 bg-white/5 text-white hover:bg-white/10"
                            >
                                <Settings2 size={20} />
                            </Button>
                            <Button
                                onClick={startCall}
                                className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg shadow-lg shadow-emerald-500/20"
                            >
                                Start Session
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ACTIVE CALL UI (GEMINI STYLE) */
                    <div className="flex-1 flex flex-col animate-in fade-in duration-700">
                        {/* Status Bar */}
                        <div className="p-4 lg:p-8 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">{context.subject}</span>
                                <span className="text-xs text-zinc-500 font-mono mt-1">{formatCallDuration(callDuration)}</span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{context.topic}</span>
                            </div>
                        </div>

                        {/* Animated Core - Optimized for Mobile */}
                        <div className="flex-1 flex flex-col items-center justify-center -mt-12">
                            <div className="relative w-64 h-64 lg:w-72 lg:h-72 flex items-center justify-center cursor-pointer transform-gpu" onClick={handleVisualizerClick}>
                                {/* Ambient Glow - Reduced blur */}
                                <div className={`absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl lg:blur-[80px] transition-all duration-1000 ${isAISpeaking ? 'opacity-100 scale-125' : 'opacity-30 scale-100'} will-change-transform`} />

                                {/* Orbiting Ring */}
                                <div className={`absolute inset-0 border border-emerald-500/10 rounded-full animate-[spin_15s_linear_infinite] ${isAISpeaking ? 'opacity-40' : 'opacity-10'} will-change-transform`} />

                                {/* The Sphere */}
                                <div className={`relative w-48 h-48 lg:w-48 lg:h-48 transition-all duration-700 ease-in-out ${isAISpeaking ? 'scale-110' : 'scale-100'} will-change-transform`}>
                                    {/* Morphing Liquid Layers - Optimized */}
                                    <div className="absolute inset-0 bg-linear-to-tr from-emerald-600/40 via-cyan-500/40 to-blue-600/40 rounded-full blur-xl lg:blur-2xl animate-pulse will-change-opacity" />

                                    <div className={`absolute inset-0 bg-linear-to-br from-emerald-400/50 to-teal-300/50 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] mix-blend-screen filter blur-lg lg:blur-xl animate-[blob_7s_infinite_linear] ${isAISpeaking ? 'brightness-125' : 'brightness-75'} will-change-transform`} />

                                    <div className={`absolute inset-4 bg-linear-to-tr from-cyan-400/30 to-emerald-200/30 rounded-[60%_40%_30%_70%/50%_60%_40%_60%] mix-blend-overlay filter blur-md lg:blur-lg animate-[blob_10s_infinite_linear_reverse] will-change-transform`} />

                                    {/* Glass Core */}
                                    <div className="relative w-full h-full rounded-full border border-white/20 bg-white/5 backdrop-blur-md lg:backdrop-blur-2xl shadow-inner flex items-center justify-center overflow-hidden transform-gpu">
                                        <div className={`w-full h-full bg-linear-to-t from-emerald-500/10 to-transparent transition-opacity duration-500 ${isAISpeaking ? 'opacity-100' : 'opacity-0'}`} />
                                        {isProcessing && <Loader2 className="absolute animate-spin text-emerald-500/50" size={32} />}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Subtitle / Status */}
                            <div className="mt-12 text-center h-12 px-6 lg:px-10">
                                {isAISpeaking ? (
                                    <p className="text-zinc-300 text-sm font-medium leading-relaxed animate-in slide-in-from-bottom-2">Gemini is explaining...</p>
                                ) : isProcessing ? (
                                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Thinking</p>
                                ) : (
                                    <p className="text-zinc-500 text-sm font-medium italic opacity-50">Listening...</p>
                                )}
                            </div>
                        </div>

                        {/* Mini Transcript Area */}
                        <div className="px-6 lg:px-10 h-24 overflow-y-auto mb-4 scrollbar-hide">
                            <div className="space-y-3">
                                {currentTranscript && (
                                    <p className="text-xs text-emerald-400/60 font-medium leading-relaxed italic animate-pulse">
                                        "{currentTranscript}..."
                                    </p>
                                )}
                                {messages.slice(-1).map((msg, i) => (
                                    <p key={i} className={`text-xs leading-relaxed ${msg.role === 'user' ? 'text-zinc-500' : 'text-zinc-300'}`}>
                                        {msg.content.length > 120 ? msg.content.substring(0, 120) + '...' : msg.content}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Premium Control Bar */}
                        <div className="p-8 pt-0">
                            <div className="bg-zinc-900/80 backdrop-blur-3xl border border-white/5 p-2 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                                <button
                                    onClick={toggleMute}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/10 text-red-500' : 'text-zinc-400 hover:bg-white/5'}`}
                                >
                                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                                </button>

                                <button
                                    onClick={endCall}
                                    className="px-10 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-red-500/20"
                                >
                                    <PhoneOff size={20} fill="currentColor" />
                                    <span className="font-bold text-sm uppercase tracking-widest">End</span>
                                </button>

                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-zinc-400 hover:bg-white/5"
                                >
                                    <Settings2 size={22} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Animations */}
            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(0deg) scale(1); }
                    33% { border-radius: 60% 40% 50% 70% / 50% 30% 70% 40%; transform: rotate(120deg) scale(1.1); }
                    66% { border-radius: 50% 60% 30% 70% / 60% 40% 60% 30%; transform: rotate(240deg) scale(0.95); }
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}
