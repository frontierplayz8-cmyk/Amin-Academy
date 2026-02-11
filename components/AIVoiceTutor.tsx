"use client"

import { useState, useEffect, useRef } from 'react'
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Loader2,
    Settings2,
    ArrowUpRight,
    Speaker,
    MessageSquare
} from 'lucide-react'
import TranscriptViewer from './TranscriptViewer'
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function AIVoiceTutor() {
    const [isCallActive, setIsCallActive] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isAISpeaking, setIsAISpeaking] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [messages, setMessages] = useState<Message[]>([])
    const [currentTranscript, setCurrentTranscript] = useState('')
    const [volume, setVolume] = useState(1.0)
    const [showSettings, setShowSettings] = useState(false)
    const [showTranscript, setShowTranscript] = useState(false)
    const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedSystemVoice, setSelectedSystemVoice] = useState<string>('')

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
    const messagesRef = useRef<Message[]>([])
    const speechQueue = useRef<string[]>([])
    const isQueueProcessing = useRef(false)
    const spokenContentRef = useRef<string>('')

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
            const savedSystemVoice = localStorage.getItem('call-system-voice')
            if (savedVoice) setUseGeminiVoice(savedVoice === 'true')
            if (savedVoiceId) setGeminiVoiceId(savedVoiceId)
            if (savedSystemVoice) setSelectedSystemVoice(savedSystemVoice)

            // Load and monitor voices
            const loadVoices = () => {
                const available = window.speechSynthesis.getVoices()
                if (available.length > 0) {
                    const filtered = available.filter(v => v.lang.includes('en') || v.lang.includes('ur'))
                    setSystemVoices(filtered)

                    if (!selectedSystemVoice) {
                        const defaultVoice = filtered.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                            filtered.find(v => v.lang === 'en-US') ||
                            filtered[0]
                        if (defaultVoice) {
                            setSelectedSystemVoice(defaultVoice.name)
                            localStorage.setItem('call-system-voice', defaultVoice.name)
                        }
                    }
                }
            }

            loadVoices()
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [])

    // Save settings
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('call-gemini-voice', String(useGeminiVoice))
            localStorage.setItem('call-voice-id', geminiVoiceId)
            localStorage.setItem('call-system-voice', selectedSystemVoice)
        }
    }, [useGeminiVoice, geminiVoiceId, selectedSystemVoice])

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
            toast.error('Speech recognition not supported in this browser.')
            return
        }

        if (!context.subject || !context.topic) {
            toast.error('Please select a subject and topic first')
            return
        }

        const hasPermission = await checkMicrophonePermission()
        if (!hasPermission) {
            toast.error('Microphone permission denied.')
            return
        }

        try {
            setIsCallActive(true)
            setCallDuration(0)
            setMessages([])
            messagesRef.current = []
            setCurrentTranscript('')

            const latestTranscriptRef = { current: '' }
            recognitionRef.current = initializeSpeechRecognition()

            silenceDetectorRef.current = new SilenceDetector(2000, () => {
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

                if (fullTranscript.trim()) {
                    silenceDetectorRef.current?.resetTimer()
                    if (isAISpeaking) stopSpeakingAi()
                }
            }

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)
                if (event.error === 'no-speech' || event.error === 'aborted') return
                if (event.error === 'audio-capture') toast.error('Microphone error.')
                else if (event.error === 'not-allowed') {
                    toast.error('Permission denied.')
                    endCall()
                }
            }

            recognitionRef.current.onend = () => {
                if (isCallActive && !isMuted && !isAISpeaking) {
                    setTimeout(() => {
                        if (recognitionRef.current && isCallActive && !isMuted && !isAISpeaking) {
                            try { recognitionRef.current.start() } catch (e) { }
                        }
                    }, 100)
                }
            }

            recognitionRef.current.start()

            const greeting = `Hello! I'm your AI tutor. I'm here to help you with ${context.topic} for ${context.grade} ${context.subject}. What would you like to learn today?`
            const aiMessage: Message = { role: 'assistant', content: greeting, timestamp: new Date() }
            setMessages([aiMessage])
            messagesRef.current = [aiMessage]

            setTimeout(() => speak(greeting), 1000)
            toast.success('Session started!')
        } catch (error: any) {
            console.error('Failed to start call:', error)
            toast.error('Failed to start call.')
            setIsCallActive(false)
        }
    }

    const stopSpeakingAi = () => {
        setIsAISpeaking(false)
        speechQueue.current = []
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
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
        }
        silenceDetectorRef.current?.stop()
        silenceDetectorRef.current = null
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        if (synthRef.current) synthRef.current.cancel()
        setIsAISpeaking(false)
        setIsProcessing(false)
        toast.info(`Session ended. Duration: ${formatCallDuration(callDuration)}`)
    }

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false)
            try { recognitionRef.current?.start() } catch (e) { }
            toast.success('Microphone unmuted')
        } else {
            setIsMuted(true)
            recognitionRef.current?.stop()
            setCurrentTranscript('')
            toast.success('Microphone muted')
        }
    }

    useEffect(() => {
        if (!isCallActive || isMuted) return
        if (isAISpeaking && recognitionRef.current) {
            try { recognitionRef.current.stop() } catch (e) { }
        } else if (!isAISpeaking && recognitionRef.current) {
            const timeoutId = setTimeout(() => {
                if (recognitionRef.current && !isAISpeaking && !isMuted && isCallActive) {
                    try { recognitionRef.current.start() } catch (e: any) { }
                }
            }, 300)
            return () => clearTimeout(timeoutId)
        }
    }, [isAISpeaking, isCallActive, isMuted])

    const addToQueue = (text: string) => {
        if (!text.trim()) return
        speechQueue.current.push(text)
        processQueue()
    }

    const processQueue = async () => {
        if (isQueueProcessing.current || speechQueue.current.length === 0) return
        isQueueProcessing.current = true
        while (speechQueue.current.length > 0) {
            const nextText = speechQueue.current.shift()
            if (nextText) await speak(nextText)
        }
        isQueueProcessing.current = false
    }

    const handleUserSpeechEnd = async (transcript: string) => {
        if (isProcessing || isAISpeaking) return
        const sanitized = sanitizeTranscript(transcript)
        if (!sanitized || sanitized.length < 2) return

        const userMessage: Message = { role: 'user', content: sanitized, timestamp: new Date() }
        const updatedMessages = [...messagesRef.current, userMessage]
        setMessages(updatedMessages)
        messagesRef.current = updatedMessages
        setIsProcessing(true)

        try {
            const response = await fetch('/api/student/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    context
                })
            })

            if (!response.ok) throw new Error('Failed to get AI response')

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader')

            let aiContent = ""
            spokenContentRef.current = ""

            // Initial AI message
            const aiMsg: Message = { role: 'assistant', content: "", timestamp: new Date() }
            setMessages(prev => [...prev, aiMsg])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new TextDecoder().decode(value)
                aiContent += chunk

                // Update UI stream
                setMessages(prev => {
                    const last = prev[prev.length - 1]
                    if (last && last.role === 'assistant') {
                        return [...prev.slice(0, -1), { ...last, content: aiContent }]
                    }
                    return prev
                })

                // Queue sentences
                const remaining = aiContent.substring(spokenContentRef.current.length)
                const sentences = remaining.match(/.*?[.!?](\s|$)/g)
                if (sentences) {
                    for (const s of sentences) {
                        addToQueue(s.trim())
                        spokenContentRef.current += s
                    }
                }
            }

            // Sync messages ref at the end
            messagesRef.current = [...updatedMessages, { role: 'assistant', content: aiContent, timestamp: new Date() }]

            // Final bit
            if (aiContent.length > spokenContentRef.current.length) {
                addToQueue(aiContent.substring(spokenContentRef.current.length).trim())
            }

        } catch (error: any) {
            console.error('AI response error:', error)
            toast.error('AI Tutor is busy.')
        } finally {
            setIsProcessing(false)
        }
    }

    const speak = (text: string): Promise<void> => {
        return new Promise(async (resolve) => {
            if (!text) return resolve()
            if (synthRef.current) synthRef.current.cancel()
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
            setIsAISpeaking(true)

            if (useGeminiVoice) {
                try {
                    const response = await fetch('/api/ai/text-to-speech', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, voiceId: geminiVoiceId })
                    })
                    if (!response.ok) { await speakStandard(text); return resolve(); }
                    const blob = await response.blob()
                    if (blob.size === 0) { await speakStandard(text); return resolve(); }
                    const url = URL.createObjectURL(blob)
                    if (audioRef.current) {
                        audioRef.current.src = url
                        audioRef.current.volume = volume
                        audioRef.current.onended = () => { setIsAISpeaking(false); URL.revokeObjectURL(url); resolve(); }
                        audioRef.current.onerror = () => { setIsAISpeaking(false); URL.revokeObjectURL(url); resolve(); }
                        await audioRef.current.play()
                    } else resolve()
                } catch (error) { await speakStandard(text); resolve(); }
            } else {
                await speakStandard(text);
                resolve();
            }
        })
    }

    const speakStandard = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!synthRef.current) return resolve()
            try {
                synthRef.current.cancel()
                setTimeout(() => {
                    if (!synthRef.current) return resolve()
                    const utterance = new SpeechSynthesisUtterance(text)
                    utterance.volume = volume

                    const voices = synthRef.current.getVoices()
                    const voice = voices.find(v => v.name === selectedSystemVoice) ||
                        voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                        voices[0]

                    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }

                    utterance.onstart = () => setIsAISpeaking(true)
                    utterance.onend = () => { setIsAISpeaking(false); resolve(); }
                    utterance.onerror = () => { setIsAISpeaking(false); resolve(); }
                    synthRef.current.speak(utterance)
                }, 50)
            } catch (error) { setIsAISpeaking(false); resolve(); }
        })
    }

    const handleVisualizerClick = () => {
        if (isAISpeaking) stopSpeakingAi()
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#020202] py-2 lg:py-4 px-4 lg:px-6 animate-in fade-in duration-500 overflow-hidden">
            {/* Main Container */}
            <div className="relative w-full max-w-5xl mx-auto bg-[#080808] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-full">

                {/* Settings Dialog */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogContent className="bg-zinc-950 border-white/5 text-white rounded-[2rem] max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">Terminal Configuration</DialogTitle>
                            <DialogDescription className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Adjust your neural learning parameters</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8 py-6">
                            <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                        <Speaker size={16} /> Gemini Engine
                                    </h4>
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">High Fidelity Audio Synthesis</p>
                                </div>
                                <Switch checked={useGeminiVoice} onCheckedChange={setUseGeminiVoice} />
                            </div>

                            {useGeminiVoice ? (
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em] ml-1">Voice Profile (Gemini)</Label>
                                    <Select value={geminiVoiceId} onValueChange={(v) => v && setGeminiVoiceId(v)}>
                                        <SelectTrigger className="w-full bg-zinc-900/50 border-white/5 rounded-2xl h-14 px-6 text-sm">
                                            <SelectValue placeholder="Select a voice" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/5 text-white rounded-xl">
                                            {geminiVoices.map((v) => (
                                                <SelectItem key={v.id} value={v.id} className="focus:bg-emerald-500 focus:text-black">{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em] ml-1">System Voice (Free)</Label>
                                    <Select value={selectedSystemVoice} onValueChange={(v) => v && setSelectedSystemVoice(v)}>
                                        <SelectTrigger className="w-full bg-zinc-900/50 border-white/5 rounded-2xl h-14 px-6 text-sm">
                                            <SelectValue placeholder="Default System Voice" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/5 text-white rounded-xl">
                                            {systemVoices.length > 0 ? (
                                                systemVoices.map((v, i) => (
                                                    <SelectItem key={`${v.name}-${i}`} value={v.name} className="focus:bg-emerald-500 focus:text-black">
                                                        {v.name} ({v.lang})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-4 text-xs text-zinc-500 italic">No system voices detected</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-4 px-1">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Volume Gain</Label>
                                    <Badge variant="outline" className="text-[10px] font-black tabular-nums border-emerald-500/20 text-emerald-500">{Math.round(volume * 100)}%</Badge>
                                </div>
                                <Slider
                                    value={[volume * 100]}
                                    onValueChange={(v: any) => setVolume(v[0] / 100)}
                                    max={100}
                                    step={1}
                                    className="py-4"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowSettings(false)}
                            className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                        >
                            Sync Protocols
                        </Button>
                    </DialogContent>
                </Dialog>

                {!isCallActive ? (
                    /* PRE-CALL CONFIGURATION UI */
                    <div className="flex-1 flex flex-col p-8 lg:p-12 justify-center max-w-2xl mx-auto w-full animate-in zoom-in duration-700">
                        <div className="text-center mb-12 space-y-4">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 relative group">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse group-hover:bg-emerald-500/40 transition-all" />
                                <Phone size={40} className="text-emerald-500 relative z-10" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">AI Study Room</h2>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Personalized Neural Tutoring</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-600 ml-4 tracking-widest">Academic Grade</Label>
                                    <Select value={context.grade} onValueChange={(v) => v && setContext({ ...context, grade: v })}>
                                        <SelectTrigger className="w-full bg-zinc-900/30 border-white/5 rounded-2xl h-14 px-6 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/5 text-white rounded-xl">
                                            {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-600 ml-4 tracking-widest">Target Subject</Label>
                                    <Select value={context.subject} onValueChange={(v) => v && setContext({ ...context, subject: v })}>
                                        <SelectTrigger className="w-full bg-zinc-900/30 border-white/5 rounded-2xl h-14 px-6 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/5 text-white rounded-xl">
                                            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-zinc-600 ml-4 tracking-widest">Analysis Focus</Label>
                                <Select value={context.topic} onValueChange={(v) => v && setContext({ ...context, topic: v })}>
                                    <SelectTrigger className="w-full bg-zinc-900/30 border-white/5 rounded-2xl h-14 px-6 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/5 text-white rounded-xl">
                                        <SelectItem value="Full Book">Full Curriculum Analysis</SelectItem>
                                        {chapters.map((ch) => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-12 flex gap-4">
                            <Button
                                onClick={() => setShowSettings(true)}
                                variant="outline"
                                className="w-16 h-16 rounded-2xl border-white/5 bg-white/5 text-white hover:bg-white/10 shrink-0"
                            >
                                <Settings2 size={24} />
                            </Button>
                            <Button
                                onClick={startCall}
                                className="flex-1 h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic tracking-widest text-lg shadow-lg shadow-emerald-500/20 group"
                            >
                                Initialize Learning Session <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ACTIVE CALL UI */
                    <div className="flex-1 flex flex-col animate-in fade-in duration-700">
                        {/* Status Bar - Only show when ORB is visible */}
                        {!showTranscript && (
                            <div className="p-6 lg:p-10 flex justify-between items-center border-b border-white/2 animate-in fade-in duration-300">
                                <div className="flex flex-col">
                                    <span className="text-sm text-zinc-500 font-black tabular-nums tracking-widest italic">{formatCallDuration(callDuration)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-white/5 text-zinc-400 border-white/10 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 h-auto">
                                        {context.topic}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        {/* Main Content Area: Swaps between Orb and Transcript */}
                        <div className="flex-1 flex flex-col min-h-0 relative">
                            {!showTranscript ? (
                                /* ORB VIEW (Animated Core) */
                                <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 animate-in fade-in zoom-in duration-500">
                                    <div
                                        className="relative w-64 h-64 lg:w-80 lg:h-80 flex items-center justify-center cursor-pointer transform-gpu group"
                                        onClick={handleVisualizerClick}
                                    >
                                        {/* Ambient Glow */}
                                        <div className={cn(
                                            "absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl lg:blur-[100px] transition-all duration-1000 will-change-transform",
                                            isAISpeaking ? 'opacity-100 scale-125' : 'opacity-30 scale-100'
                                        )} />

                                        {/* The Sphere */}
                                        <div className={cn(
                                            "relative w-40 h-40 lg:w-56 lg:h-56 transition-all duration-700 ease-in-out will-change-transform",
                                            isAISpeaking ? 'scale-110' : 'scale-100'
                                        )}>
                                            {/* Morphing Liquid Layers */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/40 via-cyan-500/40 to-blue-600/40 rounded-full blur-2xl animate-pulse" />
                                            <div className={cn(
                                                "absolute inset-0 bg-gradient-to-br from-emerald-400/50 to-teal-300/50 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] mix-blend-screen filter blur-xl animate-[blob_7s_infinite_linear] transition-all",
                                                isAISpeaking ? 'brightness-125 opacity-100' : 'brightness-75 opacity-50'
                                            )} />

                                            {/* Glass Core */}
                                            <div className="relative w-full h-full rounded-full border border-white/20 bg-white/5 backdrop-blur-2xl shadow-inner flex items-center justify-center overflow-hidden transform-gpu">
                                                <div className={cn(
                                                    "w-full h-full bg-gradient-to-t from-emerald-500/20 to-transparent transition-opacity duration-500",
                                                    isAISpeaking ? 'opacity-100' : 'opacity-0'
                                                )} />
                                                {isProcessing && <Loader2 className="absolute animate-spin text-emerald-500/50" size={32} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Status Text */}
                                    <div className="mt-6 text-center h-6">
                                        {isAISpeaking ? (
                                            <p className="text-zinc-200 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 uppercase tracking-wide">Ai Tutor Active</p>
                                        ) : isProcessing ? (
                                            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Processing Query</p>
                                        ) : (
                                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] italic opacity-50">Listening for Signal</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* TRANSCRIPT VIEW */
                                <div className="flex-1 min-h-0 animate-in fade-in zoom-in-95 duration-500">
                                    <TranscriptViewer messages={messages} isOpen={true} />
                                </div>
                            )}
                        </div>

                        {/* Recent Transcript Insight - Only show when ORB is visible */}
                        {!showTranscript && (
                            <div className="px-6 lg:px-10 h-16 min-h-[4rem] overflow-hidden mb-2 max-w-2xl mx-auto w-full flex flex-col items-center justify-center text-center shrink-0 animate-in fade-in duration-300">
                                {currentTranscript ? (
                                    <p className="text-xs text-emerald-400/60 font-bold leading-relaxed italic animate-pulse px-4 border-x border-emerald-500/20">
                                        "{currentTranscript}..."
                                    </p>
                                ) : messages.length > 0 ? (
                                    <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-md line-clamp-2">
                                        {messages[messages.length - 1].content}
                                    </p>
                                ) : null}
                            </div>
                        )}

                        {/* Control Bar */}
                        <div className="p-4 lg:p-6 pt-0 flex justify-center">
                            <div className="bg-zinc-950 border border-white/5 p-2 rounded-full flex items-center gap-4 shadow-2xl">
                                <Button
                                    onClick={toggleMute}
                                    variant="ghost"
                                    className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                                        isMuted ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                    )}
                                >
                                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                                </Button>

                                <Button
                                    onClick={endCall}
                                    className="px-8 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-red-500/20"
                                >
                                    <PhoneOff size={20} fill="currentColor" />
                                    End Session
                                </Button>

                                <Button
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    variant="ghost"
                                    className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                                        showTranscript ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                    )}
                                >
                                    <MessageSquare size={22} />
                                </Button>

                                <Button
                                    onClick={() => setShowSettings(true)}
                                    variant="ghost"
                                    className="w-14 h-14 rounded-full bg-white/5 text-zinc-400 hover:bg-white/10"
                                >
                                    <Settings2 size={22} />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(0deg) scale(1); }
                    33% { border-radius: 60% 40% 50% 70% / 50% 30% 70% 40%; transform: rotate(120deg) scale(1.1); }
                    66% { border-radius: 50% 60% 30% 70% / 60% 40% 60% 30%; transform: rotate(240deg) scale(0.95); }
                }
            `}</style>
        </div>
    )
}
