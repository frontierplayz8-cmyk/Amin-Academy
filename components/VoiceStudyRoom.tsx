"use client"

import React, { useState, useEffect, useRef } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import {
    Mic,
    MicOff,
    Send,
    Volume2,
    VolumeX,
    BookOpen,
    GraduationCap,
    MessageSquare,
    Play,
    Pause,
    Loader2,
    Settings2,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { GRADES, getSubjectsForGrade, getChaptersForSubject } from '@/app/lib/curriculum-data'

interface Message {
    role: 'user' | 'ai'
    content: string
}

function MathContent({ content, className }: { content: string, className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            // Priority: Block math $$, then Inline math $
            let processed = content
                .replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
                    try { return katex.renderToString(formula, { displayMode: true, throwOnError: false }); }
                    catch { return match; }
                })
                .replace(/\$(.*?)\$/g, (match, formula) => {
                    try { return katex.renderToString(formula, { displayMode: false, throwOnError: false }); }
                    catch { return match; }
                });

            // If no $ signs, check for common math patterns like ^2, x^3
            if (processed === content && (content.includes('^') || content.includes('_') || content.includes('='))) {
                // Heuristic: if it looks like math but lacks delimiters, try a cautious render if it's short
                if (content.length < 50 && !content.includes(' ')) {
                    try { processed = katex.renderToString(content, { throwOnError: false }); } catch { }
                }
            }
            containerRef.current.innerHTML = processed;
        }
    }, [content]);
    return <div ref={containerRef} className={className} />;
}

export default function VoiceStudyRoom() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [autoSpeak, setAutoSpeak] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const [debugLog, setDebugLog] = useState<string[]>([])
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [reportData, setReportData] = useState<any>(null)
    const [showReport, setShowReport] = useState(false)

    const addLog = (msg: string) => {
        setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`])
    }

    // Voice Config (Standard)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<string>('')
    const [pitch, setPitch] = useState(1.0)
    const [rate, setRate] = useState(1.0)

    // Premium Voice Config (ElevenLabs)
    const [usePremiumVoice, setUsePremiumVoice] = useState(false)
    const [premiumVoiceId, setPremiumVoiceId] = useState('JBFqnCBsd6RMkjVDRZzb') // Verified: George
    const elevenLabsVoices = [
        { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Warm)', category: 'Premium' },
        { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Resonant)', category: 'Premium' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Mature)', category: 'Premium' },
        { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Quirky)', category: 'Premium' },
        { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Deep)', category: 'Premium' },
    ]

    // Session Context
    const [context, setContext] = useState({
        grade: '10th Grade',
        subject: '',
        topic: ''
    })

    // Dropdown Data
    const [subjects, setSubjects] = useState<string[]>([])
    const [chapters, setChapters] = useState<string[]>([])

    useEffect(() => {
        const labs = getSubjectsForGrade(context.grade)
        setSubjects(labs)
        if (labs.length > 0 && !labs.includes(context.subject)) {
            setContext(prev => ({ ...prev, subject: labs[0], topic: '' }))
        }
    }, [context.grade])

    useEffect(() => {
        if (context.subject) {
            const chs = getChaptersForSubject(context.grade, context.subject)
            setChapters(chs)
            if (chs.length > 0 && !chs.includes(context.topic)) {
                setContext(prev => ({ ...prev, topic: chs[0] }))
            }
        }
    }, [context.subject, context.grade])

    const [isStarted, setIsStarted] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)
    const synthRef = useRef<SpeechSynthesis | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const speechQueue = useRef<string[]>([])
    const isQueueProcessing = useRef(false)
    const spokenContentRef = useRef<string>('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio()
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition()
                recognitionRef.current.continuous = false
                recognitionRef.current.interimResults = false
                recognitionRef.current.lang = 'en-US'

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript
                    setInput(transcript)
                    setIsListening(false)
                    handleSend(transcript)
                }

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech Recognition Error:", event.error)
                    setIsListening(false)
                    toast.error("Speech recognition failed. Try typing instead.")
                }
            }
            synthRef.current = window.speechSynthesis

            // 1. LOAD PERSISTENT SETTINGS
            try {
                const savedVoice = localStorage.getItem('v-study-voice')
                const savedPremium = localStorage.getItem('v-study-premium')
                const savedPremiumId = localStorage.getItem('v-study-premium-id')
                const savedPitch = localStorage.getItem('v-study-pitch')
                const savedRate = localStorage.getItem('v-study-rate')
                const savedAutoSpeak = localStorage.getItem('v-study-autospeak')

                if (savedVoice) setSelectedVoice(savedVoice)
                if (savedPremium) setUsePremiumVoice(savedPremium === 'true')
                if (savedPremiumId) setPremiumVoiceId(savedPremiumId)
                if (savedPitch) setPitch(parseFloat(savedPitch))
                if (savedRate) setRate(parseFloat(savedRate))
                if (savedAutoSpeak) setAutoSpeak(savedAutoSpeak === 'true')

                addLog(`Settings loaded from memory. Selected Voice: ${savedVoice || 'None'}`)
            } catch (e) {
                addLog("Storage recall failed")
            }

            // 2. Fetch voices
            const loadSystemVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices()
                if (availableVoices.length === 0) return

                const filtered = availableVoices.filter(v => v.lang.includes('en') || v.lang.includes('ur'))
                setVoices(filtered)

                const currentSelection = localStorage.getItem('v-study-voice') || selectedVoice

                if (!currentSelection && filtered.length > 0) {
                    const bestVoice = filtered.find(v => v.name.includes('Google') && v.lang.includes('US')) ||
                        filtered.find(v => v.lang.includes('en-US')) ||
                        filtered[0]
                    if (bestVoice) {
                        setSelectedVoice(bestVoice.name)
                        addLog(`Default voice set: ${bestVoice.name}`)
                    }
                }
            }

            loadSystemVoices()
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadSystemVoices
            }
        }
    }, []) // Removed dependency, manual selection handled in specific logic

    // SAVE SETTINGS ON CHANGE
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('v-study-voice', selectedVoice)
            localStorage.setItem('v-study-premium', String(usePremiumVoice))
            localStorage.setItem('v-study-premium-id', premiumVoiceId)
            localStorage.setItem('v-study-pitch', String(pitch))
            localStorage.setItem('v-study-rate', String(rate))
            localStorage.setItem('v-study-autospeak', String(autoSpeak))
        }
    }, [selectedVoice, usePremiumVoice, premiumVoiceId, pitch, rate, autoSpeak])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const addToQueue = (text: string) => {
        if (!text.trim()) return
        // Split by sentences if too long, but usually we get sentences from stream
        speechQueue.current.push(text)
        processQueue()
    }

    const processQueue = async () => {
        if (isQueueProcessing.current || speechQueue.current.length === 0) return
        isQueueProcessing.current = true

        while (speechQueue.current.length > 0) {
            const nextText = speechQueue.current.shift()
            if (nextText) {
                await speak(nextText)
            }
        }

        isQueueProcessing.current = false
    }

    const speak = (text: string): Promise<void> => {
        return new Promise(async (resolve) => {
            if (!autoSpeak || !text) return resolve()
            addLog(`Speaking: ${text.substring(0, 30)}...`)

            if (usePremiumVoice) {
                try {
                    const res = await fetch('/api/ai/text-to-speech', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, voiceId: premiumVoiceId })
                    })
                    if (!res.ok) throw new Error("TTS API Fail")
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    if (audioRef.current) {
                        setIsSpeaking(true)
                        audioRef.current.src = url
                        audioRef.current.onended = () => {
                            setIsSpeaking(false)
                            URL.revokeObjectURL(url)
                            resolve()
                        }
                        audioRef.current.onerror = () => {
                            setIsSpeaking(false)
                            resolve()
                        }
                        await audioRef.current.play()
                    } else resolve()
                } catch (err) {
                    await speakStandard(text)
                    resolve()
                }
            } else {
                await speakStandard(text)
                resolve()
            }
        })
    }

    const speakStandard = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!synthRef.current) return resolve()
            synthRef.current.cancel()

            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text)
                const allVoices = window.speechSynthesis.getVoices()
                const voice = allVoices.find(v => v.name === selectedVoice) ||
                    allVoices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                    allVoices[0]

                if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
                utterance.pitch = pitch; utterance.rate = rate;

                utterance.onstart = () => setIsSpeaking(true)
                utterance.onend = () => { setIsSpeaking(false); resolve(); }
                utterance.onerror = () => { setIsSpeaking(false); resolve(); }

                window.speechSynthesis.speak(utterance)
            }, 50)
        })
    }

    const toggleListening = () => {
        if (isListening) {
            addLog("STT: Stopping microphone")
            recognitionRef.current?.stop()
            setIsListening(false)
        } else {
            if (!recognitionRef.current) {
                addLog("STT: Browser NOT supported")
                toast.error("Speech recognition is not supported in this browser.")
                return
            }
            addLog("STT: Starting microphone...")
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (err: any) {
                addLog(`STT Error: ${err.message}`)
            }
        }
    }

    const handleSend = async (textOverride?: string) => {
        const content = textOverride || input
        if (!content.trim()) return

        const userMsg: Message = { role: 'user', content }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)
        addLog(`Chat: Initiating stream for "${content.substring(0, 15)}..."`)

        try {
            const res = await fetch('/api/ai/study-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({
                        role: m.role === 'ai' ? 'assistant' : 'user',
                        content: m.content
                    })),
                    context
                })
            })

            if (!res.ok) throw new Error("Stream Connection Failed")

            const reader = res.body?.getReader()
            if (!reader) throw new Error("No reader available")

            const decoder = new TextEncoder()
            spokenContentRef.current = ""
            let aiContent = ""

            // Initial empty AI message for streaming
            const aiMsg: Message = { role: 'ai', content: "" }
            setMessages(prev => [...prev, aiMsg])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new TextDecoder().decode(value)
                aiContent += chunk

                // Update UI in real-time
                setMessages(prev => {
                    const last = prev[prev.length - 1]
                    if (last && last.role === 'ai') return [...prev.slice(0, -1), { ...last, content: aiContent }]
                    return prev
                })

                // Sentence-by-sentence queue trigger
                if (autoSpeak) {
                    const remaining = aiContent.substring(spokenContentRef.current.length)
                    const sentences = remaining.match(/.*?[.!?](\s|$)/g)
                    if (sentences) {
                        for (const s of sentences) {
                            addToQueue(s.trim())
                            spokenContentRef.current += s
                        }
                    }
                }
            }

            // Final bit of text if no punctuation
            if (autoSpeak && aiContent.length > spokenContentRef.current.length) {
                addToQueue(aiContent.substring(spokenContentRef.current.length).trim())
            }

        } catch (error: any) {
            addLog(`Chat Stream Error: ${error.message}`)
            toast.error(error.message || "Connection lost.")
        } finally {
            setIsLoading(false)
        }
    }

    const finishSession = async () => {
        if (messages.length < 2) {
            toast.error("Finish at least one exchange before generating a report!")
            return
        }

        setIsGeneratingReport(true)
        setShowReport(true)
        addLog("Report: Analyzing session...")

        try {
            const res = await fetch('/api/ai/session-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({
                        role: m.role === 'ai' ? 'assistant' : 'user',
                        content: m.content
                    })),
                    context
                })
            })

            if (!res.ok) throw new Error("Report Engine Failed")

            const data = await res.json()
            setReportData(data)
            addLog("Report: Analysis complete")
        } catch (error: any) {
            addLog(`Report Error: ${error.message}`)
            toast.error("Failed to generate session report.")
            setShowReport(false)
        } finally {
            setIsGeneratingReport(false)
        }
    }

    const startSession = () => {
        setIsStarted(true)
        addLog("Session: Starting protocols...")
        const initialGreet = `Hello! I'm your Amin Academy tutor. Hmm, let's see... we're studying ${context.topic} for ${context.grade} ${context.subject} today. That's a great choice! To get started, what's your current basic understanding of ${context.topic}?`
        const aiMsg: Message = { role: 'ai', content: initialGreet }
        setMessages([aiMsg])

        // Give it a tiny bit of time to render the chat area
        setTimeout(() => speak(initialGreet), 300)
    }

    const stopSpeakingAi = () => {
        setIsSpeaking(false)
        speechQueue.current = []
        if (synthRef.current) synthRef.current.cancel()
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        // Restart listening immediately if we were expecting input
        if (isListening && recognitionRef.current) {
            try {
                recognitionRef.current.start()
            } catch (e: any) {
                // ignore already started
            }
        }
    }

    // IMPROVED: Distinct visualizer click to interrupt
    const handleVisualizerClick = () => {
        if (isSpeaking) {
            toast.info("Interrupted")
            stopSpeakingAi()
        }
    }

    if (!isStarted) {
        return (
            <div className="flex items-center justify-center p-6 min-h-[400px]">
                <Card className="w-full max-w-md bg-zinc-900/50 border-white/5 backdrop-blur-xl rounded-[40px] overflow-hidden">
                    <CardContent className="p-10 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-black mx-auto shadow-lg shadow-emerald-500/20">
                                <MessageSquare size={32} />
                            </div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mt-4">Voice Study Room</h2>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Configure your study node</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Grade Level</Label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                                    <select
                                        value={context.grade}
                                        onChange={(e) => setContext({ ...context, grade: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                                    >
                                        {GRADES.map((g) => (
                                            <option key={g} value={g} className="bg-zinc-900">{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Subject</Label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                                    <select
                                        value={context.subject}
                                        onChange={(e) => setContext({ ...context, subject: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                                    >
                                        {subjects.length === 0 && <option value="">Select Class First</option>}
                                        {subjects.map((s) => (
                                            <option key={s} value={s} className="bg-zinc-900">{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Topic / Chapter</Label>
                                <div className="relative">
                                    <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                                    <select
                                        value={context.topic}
                                        onChange={(e) => setContext({ ...context, topic: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                                    >
                                        {chapters.length === 0 && <option value="">Select Subject First</option>}
                                        <option value="Full Book" className="bg-zinc-900 font-black">Full Book</option>
                                        {chapters.map((ch) => (
                                            <option key={ch} value={ch} className="bg-zinc-900">{ch}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={startSession}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black h-14 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        >
                            Initialize Session
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto p-6 relative">

            {/* Settings Overlay */}
            {showSettings && (
                <div className="absolute inset-0 z-50 bg-[#020202]/95 backdrop-blur-md rounded-[40px] p-8 border border-white/5 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Voice & Tone Settings</h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
                            <X size={24} />
                        </Button>
                    </div>

                    <div className="space-y-6 max-w-md mx-auto">
                        <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">Premium Audio</h4>
                                <p className="text-[8px] text-zinc-500 uppercase font-bold">Powered by ElevenLabs</p>
                            </div>
                            <button
                                onClick={() => setUsePremiumVoice(!usePremiumVoice)}
                                className={`w-12 h-6 rounded-full transition-all relative ${usePremiumVoice ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${usePremiumVoice ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {usePremiumVoice ? (
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">ElevenLabs Voice Model</Label>
                                <select
                                    value={premiumVoiceId}
                                    onChange={(e) => setPremiumVoiceId(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
                                >
                                    {elevenLabsVoices.map((v, i) => (
                                        <option key={i} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tutor Voice Engine</Label>
                                <select
                                    value={selectedVoice}
                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
                                >
                                    {voices.map((v, i) => (
                                        <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                                    ))}
                                </select>
                                <p className="text-[8px] text-zinc-600 italic uppercase">Pro Tip: Select 'Natural' or 'Neural' voices if available for better quality.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Voice Pitch</Label>
                                    <span className="text-[10px] font-bold text-emerald-500">{pitch}</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2" step="0.1" value={pitch}
                                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Talking Rate</Label>
                                    <span className="text-[10px] font-bold text-emerald-500">{rate}</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2" step="0.1" value={rate}
                                    onChange={(e) => setRate(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button
                                onClick={() => speak("Testing neural audio output. Can you hear me clearly?")}
                                variant="outline"
                                className="w-full border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em]"
                            >
                                <Play size={14} className="mr-2" /> Test Protocol Output
                            </Button>

                            <Button
                                onClick={() => setShowSettings(false)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                            >
                                Apply Protocol
                            </Button>
                        </div>

                        {/* Debug Log */}
                        {debugLog.length > 0 && (
                            <div className="mt-8 p-4 bg-black/40 rounded-2xl border border-white/5">
                                <p className="text-[8px] uppercase font-black tracking-widest text-zinc-600 mb-2">Protocol Debug Log</p>
                                <div className="space-y-1">
                                    {debugLog.map((log, i) => (
                                        <p key={i} className="text-[9px] font-mono text-emerald-500/70">{log}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">AI Study Advisor</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{context.subject} • {context.topic}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettings(true)}
                        className="rounded-xl bg-white/5 text-zinc-500 hover:text-white"
                        title="Voice Settings"
                    >
                        <Settings2 size={18} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        className={`rounded-xl ${autoSpeak ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}
                    >
                        {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={finishSession}
                        className="rounded-xl px-4 bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/20"
                    >
                        Finish Session
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsStarted(false)}
                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500"
                    >
                        Change Topic
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-6 pr-4 mb-6 custom-scrollbar"
            >
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-5 rounded-[28px] ${msg.role === 'user'
                            ? 'bg-emerald-600 text-black font-bold rounded-tr-none'
                            : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-none'
                            }`}>
                            <MathContent content={msg.content} className="text-sm leading-relaxed" />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-900 border border-white/5 p-4 rounded-full rounded-tl-none">
                            <Loader2 size={24} className="animate-spin text-emerald-500" />
                        </div>
                    </div>
                )}
            </div>

            {/* Control Bar */}
            <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-[32px] backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={toggleListening}
                        className={`w-16 h-16 rounded-[24px] shrink-0 transition-all ${isListening
                            ? 'bg-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                            } text-black`}
                    >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </Button>

                    <div className="flex-1 relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder={isLoading ? "AI is thinking..." : isListening ? "Listening..." : "Message your tutor..."}
                            className="bg-black/60 border-white/5 h-16 pl-6 pr-14 rounded-[24px] font-bold text-white focus-visible:ring-emerald-500/30"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:text-emerald-400 transition-colors disabled:text-zinc-700 disabled:cursor-not-allowed"
                        >
                            <Send size={24} />
                        </button>
                    </div>

                    {isSpeaking && (
                        <div className="w-12 h-16 flex items-center justify-center gap-1">
                            <div className="w-1 bg-emerald-500 rounded-full animate-[h-pulse_1s_infinite_0s]" />
                            <div className="w-1 bg-emerald-500 rounded-full animate-[h-pulse_1s_infinite_0.2s]" />
                            <div className="w-1 bg-emerald-500 rounded-full animate-[h-pulse_1s_infinite_0.4s]" />
                        </div>
                    )}
                </div>
            </div>

            {/* Session Report Overlay */}
            {showReport && (
                <div className="absolute inset-0 z-60 bg-[#020202]/95 backdrop-blur-2xl rounded-[40px] p-8 border border-white/5 animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center">
                    {isGeneratingReport ? (
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Synthesizing Report</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AI is analyzing your session performance...</p>
                        </div>
                    ) : reportData ? (
                        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="text-center">
                                <div className="inline-block p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 mb-4">
                                    <GraduationCap className="text-emerald-500" size={48} />
                                </div>
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Session Summary</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">
                                    {context.grade} • {context.subject} • {context.topic}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 text-center">
                                    <div className="text-3xl font-black text-emerald-500 mb-1">{reportData.score}%</div>
                                    <div className="text-[8px] uppercase font-black tracking-widest text-zinc-500">Mastery Score</div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 text-center">
                                    <div className="text-3xl font-black text-emerald-500 mb-1">{reportData.knowledgeLevel}</div>
                                    <div className="text-[8px] uppercase font-black tracking-widest text-zinc-500">Knowledge Clarity</div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 text-center">
                                    <div className="text-3xl font-black text-emerald-500 mb-1">{reportData.practiceGrade}</div>
                                    <div className="text-[8px] uppercase font-black tracking-widest text-zinc-500">Practice Grade</div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 space-y-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Tutor Feedback</div>
                                <p className="text-zinc-300 text-sm italic leading-relaxed">"{reportData.feedback}"</p>

                                <div className="pt-4 space-y-2">
                                    <div className="text-[8px] uppercase font-black tracking-widest text-zinc-600">Focus Areas</div>
                                    <div className="flex flex-wrap gap-2">
                                        {reportData.focusAreas.map((area: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-zinc-800 rounded-full text-[9px] font-bold text-zinc-400">
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={() => {
                                        setShowReport(false)
                                        setIsStarted(false)
                                    }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black h-16 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                                >
                                    Start New Protocol
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReport(false)}
                                    className="flex-1 border-white/10 hover:bg-white/5 text-white h-16 rounded-[24px] font-black uppercase tracking-widest text-[10px]"
                                >
                                    Continue Discussion
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-zinc-500 font-bold">Analysis Engine Offline</p>
                            <Button onClick={() => setShowReport(false)}>Exit Report Room</Button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes h-pulse {
                    0%, 100% { height: 8px; }
                    50% { height: 24px; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 20px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                    transition: all 0.3s ease;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(16, 185, 129, 0.4);
                    background-clip: content-box;
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(16, 185, 129, 0.1) transparent;
                }
            `}</style>
            <audio ref={audioRef} className="hidden" />
        </div>
    )
}
