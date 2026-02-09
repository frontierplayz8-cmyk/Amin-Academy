"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    Search,
    Sparkles,
    Brain,
    BookOpen,
    Clock,
    Target,
    Rocket,
    ChevronRight,
    ChevronLeft,
    Calendar,
    FileText,
    FileBadge,
    Library,
    Layers,
    GraduationCap,
    Minus,
    Plus
} from "lucide-react"
import { generateTestInternet } from "@/app/actions/gemini"
import { buildInternetSystemPrompt, DifficultyLevel } from "@/app/lib/ai-prompt-builder"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { CURRICULUM_DATA, GRADES, STREAMS, getSubjectsForGradeAndStream, getChaptersForSubject, setDynamicCurriculum } from "@/app/lib/curriculum-data"
import { safeJSONParse } from "@/app/lib/safe-json"
import { useAuthenticatedFetch } from "@/lib/useAuthenticatedFetch"

interface ExamGeneratorModalProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    initialConfig?: any
    redirectPath?: string
}

export default function ExamGeneratorModal({ isOpen, setIsOpen, initialConfig, redirectPath }: ExamGeneratorModalProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const { authFetch } = useAuthenticatedFetch()

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
        if (isOpen) {
            fetchCurriculum()
        }
    }, [isOpen])

    // Selection State
    const [grade, setGrade] = useState("")
    const [stream, setStream] = useState("")
    const [subject, setSubject] = useState("")
    const [scope, setScope] = useState<"Full Book" | "Selected Chapters">("Full Book")
    const [selectedChapters, setSelectedChapters] = useState<string[]>([])
    const [manualChapters, setManualChapters] = useState("")
    const [mcqCount, setMcqCount] = useState(12)
    const [shortCount, setShortCount] = useState(15)
    const [longCount, setLongCount] = useState(3)
    const [difficulty, setDifficulty] = useState<DifficultyLevel>("Board Standard")

    const [englishConfig, setEnglishConfig] = useState({
        mcqVerbForm: 2,
        mcqSpelling: 2,
        mcqMeaning: 2,
        mcqGrammar: 2,
        includeIdioms: true,
        includeLetterStoryDialogue: true,
        includeTranslation: true,
        includeVoice: true,
        includeParaphrasing: true,
        includeStanzaComprehension: true,
        includePassageComprehension: true,
        includeEssay: true,
        customParagraph: "",
        includeSummary: true,
        userSummary: "",
    })

    const [urduConfig, setUrduConfig] = useState({
        mcqNasr: 5,
        mcqShairi: 5,
        mcqGrammar: 5,
        mcqUsage: 5,
        shyrNazm: 3,
        shyrGhazal: 3,
        includeSiaqoSabaq: true,
        includeKhulasaSabaq: true,
        includeKhulasaNazm: true,
        includeMazmoon: true,
        includeKhatDarkhwast: true,
        includeDialogueStory: true,
        includeSentenceCorrection: true,
    })

    // Pre-fill state if initialConfig is provided
    useEffect(() => {
        if (isOpen && initialConfig) {
            setGrade(initialConfig.grade || "")
            setSubject(initialConfig.subject || "")
            setMcqCount(initialConfig.mcqCount || 12)
            setShortCount(initialConfig.shortCount || 15)
            setLongCount(initialConfig.longCount || 3)
            setDifficulty(initialConfig.difficulty || "Board Standard")
            setStream(initialConfig.stream || "")

            if (initialConfig.englishConfig) {
                setEnglishConfig({
                    ...englishConfig,
                    ...initialConfig.englishConfig
                })
            }

            if (initialConfig.chapters) {
                if (initialConfig.chapters === "Full Book") {
                    setScope("Full Book")
                } else {
                    setScope("Selected Chapters")
                    setManualChapters(initialConfig.chapters)
                }
            }
            // Move to config step if we have at least grade and subject
            if (initialConfig.grade && initialConfig.subject) {
                setStep(4)
            }
        } else if (isOpen && !initialConfig) {
            resetForm()
        }
    }, [isOpen, initialConfig])

    const resetForm = () => {
        setStep(1)
        setGrade("")
        setStream("")
        setSubject("")
        setScope("Full Book")
        setSelectedChapters([])
        setManualChapters("")
        setMcqCount(12)
        setShortCount(15)
        setLongCount(3)
        setDifficulty("Board Standard")
        setEnglishConfig({
            mcqVerbForm: 2,
            mcqSpelling: 2,
            mcqMeaning: 2,
            mcqGrammar: 2,
            includeIdioms: true,
            includeLetterStoryDialogue: true,
            includeTranslation: true,
            includeVoice: true,
            includeParaphrasing: true,
            includeStanzaComprehension: true,
            includePassageComprehension: true,
            includeEssay: true,
            customParagraph: "",
            includeSummary: true,
            userSummary: "",
        })
        setUrduConfig({
            mcqNasr: 5,
            mcqShairi: 5,
            mcqGrammar: 5,
            mcqUsage: 5,
            shyrNazm: 3,
            shyrGhazal: 3,
            includeSiaqoSabaq: true,
            includeKhulasaSabaq: true,
            includeKhulasaNazm: true,
            includeMazmoon: true,
            includeKhatDarkhwast: true,
            includeDialogueStory: true,
            includeSentenceCorrection: true,
        })
    }

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const finalChapters = selectedChapters.length > 0
                ? selectedChapters.join(", ")
                : manualChapters

            const config = {
                grade,
                subject,
                scope: scope === "Full Book" ? "Full Book" : finalChapters,
                difficulty,
                mcqCount,
                shortCount,
                longCount,
                englishConfig: subject === "English" ? englishConfig : undefined,
                urduConfig: subject === "Urdu" ? urduConfig : undefined
            }

            const systemPrompt = buildInternetSystemPrompt(config)
            const result = await generateTestInternet({ systemPrompt })

            // ROBUST JSON EXTRACTION
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                console.error("RAW RESPONSE:", result)
                throw new Error("Invalid AI Response Format: No JSON found")
            }

            const paperData = safeJSONParse(jsonMatch[0], null)

            if (!paperData) {
                console.error("PARSING FAILED. RAW JSON SEGMENT:", jsonMatch[0])
                throw new Error("Neural output reconstruction failed. Please retry.")
            }

            // NEW: Save to Database
            const genConfig = {
                grade,
                subject,
                chapters: finalChapters,
                difficulty,
                mcqCount,
                shortCount,
                longCount
            }

            let savedDbId = Date.now().toString()

            try {
                const saveRes = await fetch('/api/admin/exams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: `Class ${grade} ${subject} Paper`,
                        subject,
                        grade,
                        content: paperData,
                        config: genConfig
                    })
                })
                const saveData = await saveRes.json()
                if (saveData.success && saveData.exam) {
                    console.log("DB_SAVE_SUCCESS", saveData.exam.id)
                    savedDbId = saveData.exam.id
                } else {
                    console.error("DB_SAVE_FAIL_DATA", saveData)
                }
            } catch (e) {
                console.error("DB Save Fail:", e)
            }

            // Keep local history for immediate UI updates if needed
            const newHistoryItem = {
                id: savedDbId,
                timestamp: new Date().toLocaleString(),
                subject: grade === "Urdu" || grade === "Islamiat" ? grade : subject,
                chapters: finalChapters,
                data: paperData,
                config: genConfig
            }

            const existingHistory = JSON.parse(localStorage.getItem('examPaperHistory') || '[]')
            const updatedHistory = [newHistoryItem, ...existingHistory]
            localStorage.setItem('examPaperHistory', JSON.stringify(updatedHistory))
            // localStorage.setItem('lastGeneratedPaper', JSON.stringify(paperData))

            toast.success("Exam paper generated successfully!")

            // const targetPath = redirectPath || '/PrincipalDashboard/ai-logs/view-paper'
            // router.push(`${targetPath}?title=Generated_${subject}_${finalChapters.replace(/[^a-zA-Z0-9]/g, '_')}`)

            // Redirect to View Paper with ID
            const targetPath = redirectPath || '/PrincipalDashboard/ai-logs/view-paper'
            router.push(`${targetPath}?id=${newHistoryItem.id}&title=Generated_${subject}_${finalChapters.replace(/[^a-zA-Z0-9]/g, '_')}`)
            setIsOpen(false)
            resetForm()
        } catch (error: any) {
            console.error("Generation Error:", error)
            toast.error(error.message || "Failed to generate paper")
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => setStep(s => Math.min(s + 1, 4))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    const isNextDisabled = () => {
        if (step === 1) return !grade || !stream
        if (step === 2) return !subject
        if (step === 3 && scope === "Selected Chapters") {
            return selectedChapters.length === 0 && !manualChapters
        }
        return false
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) resetForm()
        }}>
            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-zinc-100 p-0 overflow-hidden">

                {/* Progress Header */}
                <div className="bg-emerald-600/10 h-1.5 w-full">
                    <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                <DialogHeader className="p-8 pb-0">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <Sparkles size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Architect v2.0</span>
                    </div>
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                        {step === 1 && "Select Academic Level"}
                        {step === 2 && "Choose Subject"}
                        {step === 3 && "Define Scope"}
                        {step === 4 && "Configure Parameters"}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 min-h-[300px]">

                    {/* STEP 1: GRADE & STREAM */}
                    {step === 1 && (
                        <div className="space-y-8">
                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-4">Choose Academic Level</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {GRADES.map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setGrade(g)}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                                                grade === g
                                                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                                                    : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                                            )}
                                        >
                                            <GraduationCap size={18} />
                                            <span className="font-bold uppercase tracking-wider text-[10px]">{g}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-4">Choose Stream / Group</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["Computer", "Biology", "Arts"].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStream(s)}
                                            className={cn(
                                                "p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                                stream === s
                                                    ? "bg-emerald-600 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                    : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-emerald-500/30 hover:text-white"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SUBJECT */}
                    {step === 2 && (
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                <Search size={18} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {getSubjectsForGradeAndStream(grade, stream).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSubject(s)}
                                        className={cn(
                                            "p-4 rounded-xl border text-sm font-bold transition-all",
                                            subject === s
                                                ? "bg-emerald-600 border-emerald-500 text-black"
                                                : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-emerald-500/30"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SCOPE */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setScope("Full Book")}
                                    className={cn(
                                        "flex-1 p-8 rounded-2xl border flex flex-col items-center gap-4 transition-all",
                                        scope === "Full Book"
                                            ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                                            : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10"
                                    )}
                                >
                                    <BookOpen size={32} />
                                    <span className="font-bold uppercase tracking-widest text-sm">Full Book</span>
                                </button>
                                <button
                                    onClick={() => setScope("Selected Chapters")}
                                    className={cn(
                                        "flex-1 p-8 rounded-2xl border flex flex-col items-center gap-4 transition-all",
                                        scope === "Selected Chapters"
                                            ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                                            : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10"
                                    )}
                                >
                                    <Layers size={32} />
                                    <span className="font-bold uppercase tracking-widest text-sm">Specific Chapters</span>
                                </button>
                            </div>

                            {scope === "Selected Chapters" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {getChaptersForSubject(grade, subject).length > 0 ? (
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Select One or More Chapters</Label>
                                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 bg-zinc-900/40 rounded-xl border border-white/5">
                                                {getChaptersForSubject(grade, subject).map((ch: string) => (
                                                    <button
                                                        key={ch}
                                                        onClick={() => {
                                                            setSelectedChapters(prev =>
                                                                prev.includes(ch) ? prev.filter(p => p !== ch) : [...prev, ch]
                                                            )
                                                        }}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border",
                                                            (subject === "Urdu" || subject === "Islamiat") && "font-nastaleeq text-sm",
                                                            selectedChapters.includes(ch)
                                                                ? "bg-emerald-500 text-black border-emerald-500"
                                                                : "bg-zinc-800 border-white/5 text-zinc-500 hover:text-white"
                                                        )}
                                                    >
                                                        {ch}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedChapters.length > 0 && (
                                                <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] animate-pulse">
                                                    {selectedChapters.length} Chapter(s) Selected
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Enter Chapters Manually (e.g. 10, 11, 12)</Label>
                                            <Input
                                                placeholder="Chapter numbers or names..."
                                                className="bg-zinc-900/80 border-white/10 text-white placeholder:text-zinc-600 py-6"
                                                value={manualChapters}
                                                onChange={(e) => setManualChapters(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: CONFIGURATION */}
                    {step === 4 && (
                        <><div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">Question Distribution</Label>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold text-zinc-400 uppercase">MCQs</span>
                                            <input
                                                type="number"
                                                value={mcqCount}
                                                onChange={(e) => setMcqCount(parseInt(e.target.value))}
                                                className="w-12 bg-transparent text-right font-mono font-bold text-emerald-500 outline-none" />
                                        </div>
                                        <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold text-zinc-400 uppercase">Short Qs</span>
                                            <input
                                                type="number"
                                                value={shortCount}
                                                onChange={(e) => setShortCount(parseInt(e.target.value))}
                                                className="w-12 bg-transparent text-right font-mono font-bold text-emerald-500 outline-none" />
                                        </div>
                                        <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold text-zinc-400 uppercase">Long Qs</span>
                                            <input
                                                type="number"
                                                value={longCount}
                                                onChange={(e) => setLongCount(parseInt(e.target.value))}
                                                className="w-12 bg-transparent text-right font-mono font-bold text-emerald-500 outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {subject === "English" && (
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">Optional Paper Summary</Label>
                                        <textarea
                                            placeholder="Enter paper summary here (Optional). If left blank, the summary section will not be shown."
                                            className="w-full bg-zinc-900/80 border border-white/5 rounded-xl p-3 text-[11px] text-zinc-300 min-h-[100px] outline-none focus:border-emerald-500/50 transition-all font-serif italic"
                                            value={englishConfig.userSummary}
                                            onChange={(e) => setEnglishConfig(prev => ({ ...prev, userSummary: e.target.value }))} />

                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">Optional Paragraph Source</Label>
                                        <textarea
                                            placeholder="Paste a specific paragraph here for the AI to use in comprehension/translation (Optional)..."
                                            className="w-full bg-zinc-900/80 border border-white/5 rounded-xl p-3 text-[11px] text-zinc-300 min-h-[100px] outline-none focus:border-emerald-500/50 transition-all font-serif italic"
                                            value={englishConfig.customParagraph}
                                            onChange={(e) => setEnglishConfig(prev => ({ ...prev, customParagraph: e.target.value }))} />

                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: "Spelling", key: "mcqSpelling" },
                                                { label: "Verb Form", key: "mcqVerbForm" },
                                                { label: "Meanings", key: "mcqMeaning" },
                                                { label: "Grammar", key: "mcqGrammar" }
                                            ].map((item) => (
                                                <div key={item.key} className="flex justify-between items-center bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">{item.label}</span>
                                                    <input
                                                        type="number"
                                                        value={(englishConfig as any)[item.key]}
                                                        onChange={(e) => setEnglishConfig(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                                                        className="w-8 bg-transparent text-right font-mono text-[10px] font-bold text-emerald-500 outline-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {subject === "Urdu" && (
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">MCQ Distribution (Objective - 20 Marks)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: "Nasr (Prose)", key: "mcqNasr" },
                                                { label: "Shairi (Poetry)", key: "mcqShairi" },
                                                { label: "Grammar (Qawaid)", key: "mcqGrammar" },
                                                { label: "Usage (Mutabiqat)", key: "mcqUsage" }
                                            ].map((item) => (
                                                <div key={item.key} className="flex justify-between items-center bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">{item.label}</span>
                                                    <input
                                                        type="number"
                                                        value={(urduConfig as any)[item.key]}
                                                        onChange={(e) => setUrduConfig(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                                                        className="w-8 bg-transparent text-right font-mono text-[10px] font-bold text-emerald-500 outline-none" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">Poetry Explanation (Q2: Tashreeh)</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { label: "Nazm Couplets", key: "shyrNazm" },
                                                    { label: "Ghazal Couplets", key: "shyrGhazal" }
                                                ].map((item) => (
                                                    <div key={item.key} className="flex justify-between items-center bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase">{item.label}</span>
                                                        <input
                                                            type="number"
                                                            value={(urduConfig as any)[item.key]}
                                                            onChange={(e) => setUrduConfig(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                                                            className="w-8 bg-transparent text-right font-mono text-[10px] font-bold text-emerald-500 outline-none" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">Subjective Sections (Q3-Q8)</Label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { label: "Q3: Paragraph Explanation (Siaq-o-Sabaq)", key: "includeSiaqoSabaq" },
                                                    { label: "Q4: Lesson Summary (Sabaq Khulasa)", key: "includeKhulasaSabaq" },
                                                    { label: "Q5: Poem Summary (Nazm Khulasa)", key: "includeKhulasaNazm" },
                                                    { label: "Q6: Letter / Application", key: "includeKhatDarkhwast" },
                                                    { label: "Q7: Dialogue / Story", key: "includeDialogueStory" },
                                                    { label: "Q8: Sentence Correction", key: "includeSentenceCorrection" },
                                                    { label: "Custom Essay (Mazmoon)", key: "includeMazmoon" }
                                                ].map((item) => (
                                                    <button
                                                        key={item.key}
                                                        onClick={() => setUrduConfig(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                                                        className={cn(
                                                            "flex justify-between items-center p-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                                                            (urduConfig as any)[item.key]
                                                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                                                : "bg-zinc-900/50 border-white/5 text-zinc-600"
                                                        )}
                                                    >
                                                        {item.label}
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            (urduConfig as any)[item.key] ? "bg-emerald-500 animate-pulse" : "bg-zinc-800"
                                                        )} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-6">
                                {subject === "English" ? (
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">Include Sections</Label>
                                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                            {[
                                                { label: "Idioms / Phrases", key: "includeIdioms" },
                                                { label: "Letter/Story/Dialogue", key: "includeLetterStoryDialogue" },
                                                { label: "Translation (U to E)", key: "includeTranslation" },
                                                { label: "Change of Voice", key: "includeVoice" },
                                                { label: "Stanza Paraphrasing", key: "includeParaphrasing" },
                                                { label: "Stanza Comprehension", key: "includeStanzaComprehension" },
                                                { label: "Passage Comprehension", key: "includePassageComprehension" },
                                                { label: "Essay / Paragraph", key: "includeEssay" }
                                            ].map((item) => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => setEnglishConfig(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                                                    className={cn(
                                                        "flex justify-between items-center p-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                                                        (englishConfig as any)[item.key]
                                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                                            : "bg-zinc-900/50 border-white/5 text-zinc-600"
                                                    )}
                                                >
                                                    {item.label}
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        (englishConfig as any)[item.key] ? "bg-emerald-500 animate-pulse" : "bg-zinc-800"
                                                    )} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-3">Difficulty Standard</Label>
                                        <div className="flex flex-col gap-2">
                                            {["Easy", "Medium", "Hard", "Board Standard"].map((d) => (
                                                <button
                                                    key={d}
                                                    onClick={() => setDifficulty(d as DifficultyLevel)}
                                                    className={cn(
                                                        "px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all border",
                                                        difficulty === d
                                                            ? "bg-white text-black border-white"
                                                            : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white"
                                                    )}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        </>
                    )}
                </div>

                <DialogFooter className="p-8 bg-zinc-900/20 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                className="bg-zinc-900 border-white/10 hover:bg-zinc-800 rounded-xl"
                            >
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex items-center gap-1.5 ml-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        i === step ? "bg-emerald-500 w-4" : i < step ? "bg-emerald-500/40" : "bg-zinc-800"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {step < 4 ? (
                        <Button
                            onClick={nextStep}
                            disabled={isNextDisabled()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest px-8 rounded-xl disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600"
                        >
                            Continue <ArrowRight size={18} />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest px-8 rounded-xl"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> Analyzing Syllabus...
                                </>
                            ) : (
                                <>
                                    Generate Paper <Sparkles size={18} />
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
