"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Settings2,
    Zap,
    Loader2,
    CheckCircle2,
    FileText,
    Eye,
    Trash2,
    Download,
    RefreshCw,
    History,
    ArrowRight
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { RotateCcw, Sparkles, Filter, LayoutDashboard, Database, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { GRADES, STREAMS, getSubjectsForGradeAndStream, getChaptersForSubject, setDynamicCurriculum, getSubjectsForGrade } from '@/app/lib/curriculum-data'
import { buildInternetSystemPrompt } from '@/app/lib/ai-prompt-builder'
import { useAuthenticatedFetch } from "@/lib/useAuthenticatedFetch"
import { generateTestInternet } from '@/app/actions/gemini'
import { useAuth } from '@/context/AuthContext'

export default function GenerateTestPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { authFetch } = useAuthenticatedFetch()
    const [isGenerating, setIsGenerating] = useState(false)
    const [savedPapers, setSavedPapers] = useState<any[]>([])

    // Load history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return
            try {
                const token = await user.getIdToken()
                const res = await fetch('/api/admin/exams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()
                if (data.success) {
                    setSavedPapers(data.exams.map((p: any) => ({
                        id: p.id,
                        timestamp: new Date(p.createdAt).toLocaleString(),
                        subject: p.subject,
                        chapters: p.config?.chapters || 'Full Book',
                        data: p.content,
                        config: p.config
                    })))
                } else {
                    const history = localStorage.getItem('examPaperHistory')
                    if (history) setSavedPapers(JSON.parse(history))
                }
            } catch (e) {
                console.error("Failed to load history")
            }
        }
        fetchHistory()
    }, [user])

    const [config, setConfig] = useState({
        grade: '10th Grade',
        stream: 'Computer',
        subject: 'Biology',
        chapterMode: 'single' as 'single' | 'multiple',
        selectedChapters: [] as string[],
        manualChapter: 'Chapter 10: Gaseous Exchange',
        difficulty: 'Board Standard',
        mcqCount: 12,
        shortCount: 15,
        longCount: 3,
        customParagraph: "",
        includeSummary: true,
        mcqSpelling: 0,
        mcqVerbForm: 0,
        mcqMeaning: 5,
        mcqGrammar: 5
    })

    useEffect(() => {
        const fetchCurriculum = async () => {
            try {
                const res = await authFetch("/api/admin/curriculum")
                if (res.ok) {
                    const data = await res.json()
                    setDynamicCurriculum(data)
                }
            } catch (error) {
                console.error("Failed to load dynamic curriculum:", error)
            }
        }
        fetchCurriculum()
    }, [])

    const handleGenerate = async () => {
        setIsGenerating(true)
        const toastId = toast.loading("Connecting to Academic Knowledge Node...")

        try {
            const finalChapters = config.selectedChapters.length > 0
                ? config.selectedChapters.join(", ")
                : config.manualChapter

            const systemPrompt = buildInternetSystemPrompt({
                grade: config.grade,
                subject: config.subject,
                scope: finalChapters,
                difficulty: config.difficulty as any,
                mcqCount: config.mcqCount,
                shortCount: config.shortCount,
                longCount: config.longCount,
                englishConfig: config.subject === "English" ? {
                    mcqVerbForm: config.mcqVerbForm || 0,
                    mcqSpelling: config.mcqSpelling || 0,
                    mcqMeaning: config.mcqMeaning || 5,
                    mcqGrammar: config.mcqGrammar || 5,
                    includeIdioms: true,
                    includeLetterStoryDialogue: true,
                    includeTranslation: true,
                    includeVoice: true,
                    includeParaphrasing: true,
                    includeStanzaComprehension: true,
                    includePassageComprehension: true,
                    includeEssay: true,
                    customParagraph: config.customParagraph,
                    includeSummary: config.includeSummary
                } : undefined
            })

            toast.loading("Gathering Data from Internet...", { id: toastId })

            const response = await generateTestInternet({ systemPrompt })

            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                console.error("RAW RESPONSE:", response)
                throw new Error("Invalid AI Response Format: No JSON found")
            }

            const paperData = JSON.parse(jsonMatch[0])

            const genConfig = {
                grade: config.grade,
                subject: config.subject,
                chapters: finalChapters,
                difficulty: config.difficulty,
                mcqCount: config.mcqCount,
                shortCount: config.shortCount,
                longCount: config.longCount
            }

            let savedDbId = Date.now().toString()

            try {
                const token = await user?.getIdToken()
                const saveRes = await fetch('/api/admin/exams', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: `Class ${config.grade} ${config.subject} Paper`,
                        subject: config.subject,
                        grade: config.grade,
                        content: paperData,
                        config: genConfig
                    })
                })
                const saveData = await saveRes.json()
                if (saveData.success && saveData.exam) {
                    savedDbId = saveData.exam.id
                }
            } catch (e) {
                console.error("DB Save Fail:", e)
            }

            const newHistoryItem = {
                id: savedDbId,
                timestamp: new Date().toLocaleString(),
                subject: config.subject,
                chapters: finalChapters,
                data: paperData,
                config: genConfig
            }

            const updatedHistory = [newHistoryItem, ...savedPapers]
            setSavedPapers(updatedHistory)
            localStorage.setItem('examPaperHistory', JSON.stringify(updatedHistory))

            // localStorage.setItem('lastGeneratedPaper', JSON.stringify(paperData))

            toast.success("Exam Paper Synthesized!", { id: toastId })
            router.push(`/paper-editor?id=${savedDbId}`)

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Synthesis Failed", { id: toastId })
        } finally {
            setIsGenerating(false)
        }
    }

    const deletePaper = async (id: string) => {
        const updated = savedPapers.filter((p: any) => p.id !== id)
        setSavedPapers(updated)
        localStorage.setItem('examPaperHistory', JSON.stringify(updated))

        try {
            const token = await user?.getIdToken()
            const res = await fetch(`/api/admin/exams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()

            if (data.success) {
                toast.success("Paper deleted permanentally")
            } else {
                toast.info("Removed from history")
            }
        } catch (e) {
            console.error("Background sync failed:", e)
            toast.info("Removed from local records")
        }
    }

    const reuseConfig = (reusePaper: any) => {
        if (!reusePaper.config) {
            toast.error("No configuration found to reuse")
            return
        }
        setConfig({
            grade: reusePaper.config.grade || config.grade,
            stream: reusePaper.config.stream || config.stream,
            subject: reusePaper.config.subject || config.subject,
            chapterMode: reusePaper.config.chapters === "Full Book" ? 'single' : 'multiple',
            selectedChapters: [],
            manualChapter: reusePaper.config.chapters || "",
            difficulty: reusePaper.config.difficulty || "Board Standard",
            mcqCount: reusePaper.config.mcqCount || 12,
            shortCount: reusePaper.config.shortCount || 15,
            longCount: reusePaper.config.longCount || 3,
            customParagraph: reusePaper.config.englishConfig?.customParagraph || "",
            includeSummary: reusePaper.config.englishConfig?.includeSummary ?? true,
            mcqSpelling: reusePaper.config.englishConfig?.mcqSpelling || 0,
            mcqVerbForm: reusePaper.config.englishConfig?.mcqVerbForm || 0,
            mcqMeaning: reusePaper.config.englishConfig?.mcqMeaning || 5,
            mcqGrammar: reusePaper.config.englishConfig?.mcqGrammar || 5
        })
        toast.success("Academic Configuration Restored!")
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const viewPaper = (paper: any) => {
        router.push(`/paper-editor?id=${paper.id}`)
    }

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between text-white">
                <div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Gen AI Node</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        AI <span className="text-emerald-500 not-italic"> TEST GENERATOR</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Zap size={12} className="text-emerald-500" />
                        Knowledge Retrieval & Exam Synthesis Engine
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
                {/* Configuration Panel */}
                <Card className="bg-[#080808]/50 border-white/5 w-full rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-emerald-500 shadow-xl">
                                <Settings2 size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-white">Configuration Matrix</CardTitle>
                                <CardDescription className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mt-1">Define Academic Parameters</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <Separator className="bg-white/5" />
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Academic Grade</Label>
                            <div className="flex flex-wrap gap-2">
                                {GRADES.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => {
                                            const subjects = getSubjectsForGrade(g)
                                            setConfig({
                                                ...config,
                                                grade: g,
                                                subject: subjects[0] || "",
                                                selectedChapters: []
                                            });
                                        }}
                                        className={cn(
                                            "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            config.grade === g
                                                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                                : "bg-white/2 border-white/5 text-zinc-600 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>



                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Core Subject</Label>
                            <div className="flex flex-wrap gap-2">
                                {getSubjectsForGrade(config.grade).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setConfig({ ...config, subject: s, selectedChapters: [] })}
                                        className={cn(
                                            "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            config.subject === s
                                                ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                                : "bg-white/2 border-white/5 text-zinc-600 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Topic Resolution</Label>
                                <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setConfig({ ...config, chapterMode: 'single' })}
                                        className={cn(
                                            "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            config.chapterMode === 'single' ? "bg-white/5 text-emerald-500" : "text-zinc-600 hover:text-white"
                                        )}
                                    >
                                        Focused
                                    </button>
                                    <button
                                        onClick={() => setConfig({ ...config, chapterMode: 'multiple' })}
                                        className={cn(
                                            "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            config.chapterMode === 'multiple' ? "bg-white/5 text-emerald-500" : "text-zinc-600 hover:text-white"
                                        )}
                                    >
                                        Distributed
                                    </button>
                                </div>
                            </div>

                            {getChaptersForSubject(config.grade, config.subject).length > 0 ? (
                                <ScrollArea className="h-48 rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {getChaptersForSubject(config.grade, config.subject).map((ch: string) => (
                                            <button
                                                key={ch}
                                                onClick={() => {
                                                    if (config.chapterMode === 'single') {
                                                        setConfig({ ...config, selectedChapters: [ch] })
                                                    } else {
                                                        setConfig({
                                                            ...config,
                                                            selectedChapters: config.selectedChapters.includes(ch)
                                                                ? config.selectedChapters.filter(c => c !== ch)
                                                                : [...config.selectedChapters, ch]
                                                        })
                                                    }
                                                }}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border",
                                                    (config.subject === "Urdu" || config.subject === "Islamiat" || config.subject === "Turjama-tul-Quran") && "font-nastaleeq text-sm",
                                                    config.selectedChapters.includes(ch)
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                        : "bg-white/2 border-white/5 text-zinc-600 hover:text-white"
                                                )}
                                            >
                                                {ch}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <Input
                                    value={config.manualChapter}
                                    onChange={(e) => setConfig({ ...config, manualChapter: e.target.value })}
                                    className="h-12 bg-zinc-950/50 border-white/5 rounded-xl px-4 text-xs font-bold text-white focus:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                                    placeholder="e.g. Chapter 1: Introduction"
                                />
                            )}

                            {config.selectedChapters.length > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 transition-all duration-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">
                                        {config.selectedChapters.length} Target Units Synchronized
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">MCQ Qty</Label>
                                <Input
                                    type="number"
                                    value={config.mcqCount}
                                    onChange={(e) => setConfig({ ...config, mcqCount: parseInt(e.target.value) })}
                                    className="h-12 bg-zinc-950/50 border-white/5 rounded-xl text-center font-bold text-white focus:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Short Qty</Label>
                                <Input
                                    type="number"
                                    value={config.shortCount}
                                    onChange={(e) => setConfig({ ...config, shortCount: parseInt(e.target.value) })}
                                    className="h-12 bg-zinc-950/50 border-white/5 rounded-xl text-center font-bold text-white focus:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Long Qty</Label>
                                <Input
                                    type="number"
                                    value={config.longCount}
                                    onChange={(e) => setConfig({ ...config, longCount: parseInt(e.target.value) })}
                                    className="h-12 bg-zinc-950/50 border-white/5 rounded-xl text-center font-bold text-white focus:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        {config.subject === "English" && (
                            <div className="space-y-6 animate-in slide-in-from-top duration-500">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Custom Paragraph (Optional)</Label>
                                    <textarea
                                        value={config.customParagraph}
                                        onChange={(e) => setConfig({ ...config, customParagraph: e.target.value })}
                                        className="w-full bg-zinc-950/50 border-white/5 rounded-2xl p-4 text-xs font-bold text-white min-h-[120px] focus:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                                        placeholder="Paste a specific paragraph for comprehension or translation..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Spelling", key: "mcqSpelling" },
                                        { label: "Verb Form", key: "mcqVerbForm" },
                                        { label: "Meanings", key: "mcqMeaning" },
                                        { label: "Grammar", key: "mcqGrammar" }
                                    ].map((item) => (
                                        <div key={item.key} className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</Label>
                                            <Input
                                                type="number"
                                                value={(config as any)[item.key] || 0}
                                                onChange={(e) => setConfig({ ...config, [item.key]: parseInt(e.target.value) || 0 })}
                                                className="h-10 bg-zinc-950/50 border-white/5 rounded-xl text-center font-bold text-white focus:border-emerald-500/50"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white">Include Summary</Label>
                                        <p className="text-[8px] text-zinc-500 uppercase font-bold mt-1">Add poem summary section</p>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, includeSummary: !config.includeSummary })}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all relative",
                                            config.includeSummary ? "bg-emerald-500" : "bg-zinc-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                            config.includeSummary ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Complexity Matrix</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Easy', 'Medium', 'Hard', 'Board Standard'].map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => setConfig({ ...config, difficulty: lvl })}
                                        className={cn(
                                            "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            config.difficulty === lvl
                                                ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                                : "bg-white/2 border-white/5 text-zinc-600 hover:text-white"
                                        )}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full h-16 bg-white text-black hover:bg-emerald-500 hover:text-black font-black uppercase italic tracking-[0.2em] rounded-2xl shadow-[0_4px_20px_rgba(255,255,255,0.05)] transition-all group"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="animate-spin mr-3" size={20} />
                                    Synthesizing Intelligence
                                </>
                            ) : (
                                <>
                                    <Zap className="mr-3 group-hover:fill-current" size={20} />
                                    Generate Paper
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Saved Papers Section */}
            <div className="mt-10 animate-in fade-in duration-1000">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mb-6">
                    <History className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Local Memory Hub</span>
                </div>
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                        Recent <span className="text-emerald-500 not-italic">SYNTHESIS</span>
                    </h2>
                </div>

                {savedPapers.length === 0 ? (
                    <div className="bg-zinc-900/5 border-2 border-dashed border-white/5 rounded-[3rem] p-24 flex flex-col items-center text-zinc-800">
                        <FileText size={64} className="mb-6 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Historical records unavailable</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {savedPapers.slice(0, 9).map((paper: any) => (
                            <Card key={paper.id} className="bg-[#080808]/50 border-white/5 p-8 rounded-[2.5rem] hover:border-emerald-500/20 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => deletePaper(paper.id)}
                                                        className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                }
                                            />
                                            <TooltipContent className="bg-zinc-950 border-white/5 text-[10px] font-black uppercase tracking-widest text-red-500">Purge Record</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-emerald-500 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest">
                                            {paper.subject}
                                        </Badge>
                                        <p className="text-zinc-600 text-[10px] font-bold uppercase mt-2 tracking-widest italic">{paper.timestamp}</p>
                                    </div>
                                </div>

                                <h4 className="text-white text-lg font-black mb-1 truncate uppercase italic tracking-tight">{paper.chapters}</h4>
                                <div className="flex items-center gap-2 mb-10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">Board Standards Calibrated</span>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => viewPaper(paper)}
                                        className="flex-1 h-12 bg-white text-black hover:bg-emerald-500 hover:text-black font-black uppercase italic tracking-widest rounded-xl transition-all"
                                    >
                                        <Eye size={14} className="mr-2" /> View Paper
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => reuseConfig(paper)}
                                        className="w-12 h-12 bg-zinc-950 border-white/5 hover:border-emerald-500/50 text-zinc-500 hover:text-emerald-500 rounded-xl transition-all"
                                    >
                                        <RefreshCw size={18} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function ProtocolStep({ number, title, desc }: { number: string, title: string, desc: string }) {
    return (
        <div className="flex gap-6 group/step">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-emerald-500 flex items-center justify-center font-black text-sm shrink-0 border border-white/5 shadow-2xl group-hover/step:border-emerald-500/20 group-hover/step:scale-110 transition-all duration-500">
                {number}
            </div>
            <div>
                <h4 className="text-white text-sm font-black uppercase italic tracking-tighter mb-2 group-hover/step:text-emerald-500 transition-colors">{title}</h4>
                <p className="text-zinc-600 text-[10px] font-bold leading-relaxed uppercase tracking-widest">
                    {desc}
                </p>
            </div>
        </div>
    )
}


