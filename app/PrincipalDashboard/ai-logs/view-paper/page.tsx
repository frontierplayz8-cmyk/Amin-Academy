"use client"

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Printer,
    Download,
    ChevronLeft,
    FileText,
    Pencil,
    Save,
    X,
    Loader2,
    Layout,
    Maximize2,
    Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { EditableText } from '@/components/EditableText'

import { useAuth } from '@/context/AuthContext'

interface PaperData {
    paperInfo: {
        class: string
        subject: string
        chapters: string[]
    }
    mcqs: Array<{
        en: string
        ur: string
        type?: "verb_form" | "spelling" | "meaning" | "grammar" | "hissa_nasr" | "hissa_shairi" | "mcq_grammar" | "mcq_usage"
        options: Array<{
            en: string
            ur: string
        }>
    }>
    shortQuestions: Array<{
        en: string
        ur: string
    }>
    longQuestions: Array<{
        en: string
        ur: string
        parts: Array<{
            en: string
            ur: string
        }>
    }>
    headerDetails?: {
        session: string
        schoolName: string
        systemBadge: string
        rollNoLabel: string
        paperLabel: string
        timeObjective: string
        marksObjective: string
        mcqInstruction: string
        part2Title: string
        timeSubjective: string
        marksSubjective: string
        longQInstruction: string
    }
    content?: any
    watermark?: any
    englishData?: {
        paraphrasing?: Array<{
            stanza: string
            reference?: string
            id?: string
        }>
        stanzaComprehension?: {
            stanza: string
            questions: Array<{ question: string, marks: number }>
        }
        passageComprehension?: {
            passage: string
            questions: Array<{ question: string, marks: number }>
        }
        idioms?: Array<{ word: string, meaning: string }>
        letterStoryDialogue?: { type: string, topic: string }
        translation?: Array<{ ur: string, en: string }>
        voice?: Array<{ active: string, passive: string }>
        summary?: { topic: string, poem: string, userSummary?: string }
    }
    urduData?: {
        khulasa: any
        shyrNazm?: Array<{ couplet: string, poet?: string }>
        shyrGhazal?: Array<{ couplet: string, poet?: string }>
        siaqoSabaq?: { paragraph: string, lesson: string, author: string }
        khulasaSabaq?: { lessonTitle: string }
        khulasaNazm?: { poemTitle: string }
        mazmoon?: string[]
        khatDarkhwast?: { type: string, prompt: string }
        dialogueStory?: { type: string, prompt: string }
        sentenceCorrection?: string[]
    }
    quranData?: {
        vocabulary: Array<{ arabic: string, urdu: string }>
        verses: Array<{ arabic: string, urdu: string }>
    }
}

function PaperViewer() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [paperData, setPaperData] = useState<PaperData | null>(null)
    const [originalPaperData, setOriginalPaperData] = useState<PaperData | null>(null) // For undo/cancel
    const [isExporting, setIsExporting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const [debugError, setDebugError] = useState<string | null>(null)
    const paperRef = useRef<HTMLDivElement>(null)

    const id = searchParams.get('id')
    const title = searchParams.get('title') || 'Generated Exam Paper'
    const { user } = useAuth()

    const defaultHeaderDetails = {
        session: "Inter Part-I (Session 2025-26)",
        schoolName: "Amin Model High School and Science Academy",
        systemBadge: "BISE REPLICA EXAMINATION SYSTEM",
        rollNoLabel: "Roll No: ______________",
        paperLabel: "PAPER: II (Objective)",
        timeObjective: "TIME: 1.45 Hours",
        marksObjective: "MARKS: 12",
        mcqInstruction: "Note: You have four choices for each objective type question as A, B, C and D. The choice which you think is correct, fill that circle in front of that question number.",
        part2Title: "Part-II (Subjective)",
        timeSubjective: "TIME: 2:10 Hours",
        marksSubjective: "MARKS: 63",
        longQInstruction: "Note: Attempt any THREE (3) questions."
    }

    useEffect(() => {
        const loadData = async () => {
            if (id && user) {
                try {
                    const token = await user.getIdToken()
                    const res = await fetch(`/api/admin/exams/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    const data = await res.json()
                    if (data.success) {
                        const parsed = data.exam.content
                        if (!parsed.headerDetails) parsed.headerDetails = defaultHeaderDetails
                        setPaperData(parsed)
                        setOriginalPaperData(parsed)
                        return
                    }
                } catch (e) {
                    console.error("Failed to load from DB", e)
                }
            }

            // Fallback
            const data = localStorage.getItem('lastGeneratedPaper')
            if (data) {
                try {
                    const parsed = JSON.parse(data)
                    // Ensure headerDetails exists for backward compatibility
                    if (!parsed.headerDetails) {
                        parsed.headerDetails = defaultHeaderDetails
                    }
                    setPaperData(parsed)
                    setOriginalPaperData(parsed)
                } catch (e) {
                    console.error("Failed to parse paper data", e)
                    toast.error("Corrupted paper data")
                }
            }
        }
        loadData()
    }, [id, user])

    const convertNumberToWord = (num: number) => {
        const words = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY'];
        return words[num] || num.toString();
    }

    const safeRender = (val: any): string => {
        if (typeof val === 'string') return val
        if (typeof val === 'number') return val.toString()
        if (typeof val === 'object' && val !== null) {
            return val.en || val.ur || JSON.stringify(val)
        }
        return ''
    }

    const handlePrint = () => {
        // Ensure editing is disabled before printing to remove borders
        if (isEditing) {
            toast.warning("Please save or cancel editing before printing")
            return
        }
        window.print()
    }

    const handleDownloadPDF = async () => {
        if (isEditing) {
            toast.warning("Please save or cancel editing before downloading")
            return
        }
        if (!paperRef.current) return
        setIsExporting(true)
        const toastId = toast.loading("Syncing Neural Assets (Fonts)...")

        try {
            await document.fonts.ready
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.loading("Analyzing Question Boundaries...", { id: toastId })

            // Find all elements that should not be split
            const avoidBreakElements = paperRef.current.querySelectorAll('.page-break-inside-avoid')
            const breakPoints: number[] = [0]

            avoidBreakElements.forEach((el) => {
                const rect = el.getBoundingClientRect()
                const containerRect = paperRef.current!.getBoundingClientRect()
                const relativeTop = rect.top - containerRect.top
                const relativeBottom = rect.bottom - containerRect.top

                breakPoints.push(relativeTop)
                breakPoints.push(relativeBottom)
            })

            breakPoints.sort((a, b) => a - b)

            toast.loading("Capturing High-Quality Render...", { id: toastId })

            const el = paperRef.current;
            el.classList.add('pdf-capture-safe');

            const canvas = await html2canvas(el, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight,
                height: el.scrollHeight,
                onclone: (clonedDoc) => {
                    const allElements = clonedDoc.querySelectorAll('*')
                    allElements.forEach((el: any) => {
                        try {
                            const style = window.getComputedStyle(el)
                            const hasBadColor = (val: string | null) => val && (val.includes('oklch') || val.includes('lab') || val.includes('color-mix'))

                            if (hasBadColor(style.color)) el.style.setProperty('color', '#000000', 'important')
                            if (hasBadColor(style.backgroundColor)) el.style.setProperty('background-color', '#ffffff', 'important')
                            if (hasBadColor(style.borderColor)) el.style.setProperty('border-color', '#000000', 'important')
                            if (hasBadColor(style.fill)) el.style.setProperty('fill', '#000000', 'important')
                            if (hasBadColor(style.stroke)) el.style.setProperty('stroke', '#000000', 'important')
                            if (hasBadColor(style.boxShadow)) el.style.setProperty('box-shadow', 'none', 'important')
                            if (hasBadColor(style.textShadow)) el.style.setProperty('text-shadow', 'none', 'important')

                            if (el.classList.contains('text-emerald-500') || el.classList.contains('text-emerald-600')) {
                                el.style.setProperty('color', '#059669', 'important')
                            }
                            if (el.classList.contains('text-zinc-500')) {
                                el.style.setProperty('color', '#71717a', 'important')
                            }

                            if (el.style.fontFamily && el.style.fontFamily.includes('Nastaliq')) {
                                el.style.setProperty('font-family', "'Noto Nastaliq Urdu', serif", 'important')
                            }
                        } catch (e) { }
                    })
                }
            })

            toast.loading("Building Multi-Page PDF with Smart Breaks...", { id: toastId })

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            const canvasWidth = canvas.width
            const canvasHeight = canvas.height

            const scale = 3
            const ratio = canvasWidth / pdfWidth
            const pageHeightInCanvas = pdfHeight * ratio

            let currentY = 0
            let pageNumber = 0

            while (currentY < canvasHeight) {
                if (pageNumber > 0) {
                    pdf.addPage()
                }

                let targetY = currentY + pageHeightInCanvas

                // Find the best break point near the target
                if (targetY < canvasHeight) {
                    const targetYInPx = targetY / scale
                    const searchRange = 100 // pixels to search around target

                    let bestBreak = targetY
                    let maxGap = 0

                    for (let i = 0; i < breakPoints.length - 1; i++) {
                        const gapStart = breakPoints[i] * scale
                        const gapEnd = breakPoints[i + 1] * scale
                        const gapMid = (gapStart + gapEnd) / 2

                        if (Math.abs(gapMid - targetY) < searchRange * scale) {
                            const gapSize = gapEnd - gapStart
                            if (gapSize > maxGap) {
                                maxGap = gapSize
                                bestBreak = gapEnd
                            }
                        }
                    }

                    if (maxGap > 20 * scale) { // Only use if gap is significant
                        targetY = bestBreak
                    }
                }

                const remainingHeight = canvasHeight - currentY
                const sliceHeight = Math.min(targetY - currentY, remainingHeight)

                const pageCanvas = document.createElement('canvas')
                pageCanvas.width = canvasWidth
                pageCanvas.height = sliceHeight

                const pageCtx = pageCanvas.getContext('2d')
                if (pageCtx) {
                    pageCtx.drawImage(
                        canvas,
                        0, currentY,
                        canvasWidth, sliceHeight,
                        0, 0,
                        canvasWidth, sliceHeight
                    )

                    const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
                    const imgHeight = (sliceHeight / canvasWidth) * pdfWidth

                    pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST')
                }

                currentY += sliceHeight
                pageNumber++
            }

            pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
            el.classList.remove('pdf-capture-safe');
            toast.success("Exam Paper Exported Successfully", { id: toastId })
        } catch (error: any) {
            paperRef.current?.classList.remove('pdf-capture-safe');
            console.error("FULL PDF EXPORT ERROR TRACE:", error)
            const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
            setDebugError(errorMessage)
            toast.error(`Export Failed: ${errorMessage.substring(0, 100)}`, { id: toastId, duration: 8000 })
        } finally {
            setIsExporting(false)
        }
    }

    // --- State Update Handlers ---

    const updatePaperInfo = (field: keyof PaperData['paperInfo'], value: string) => {
        if (!paperData) return
        setPaperData({
            ...paperData,
            paperInfo: { ...paperData.paperInfo, [field]: value }
        })
    }

    const updateHeaderDetail = (field: keyof NonNullable<PaperData['headerDetails']>, value: string) => {
        if (!paperData || !paperData.headerDetails) return
        setPaperData({
            ...paperData,
            headerDetails: { ...paperData.headerDetails, [field]: value }
        })
    }

    const updateMcq = (index: number, field: 'en' | 'ur', value: string) => {
        if (!paperData) return
        const newMcqs = [...paperData.mcqs]
        newMcqs[index] = { ...newMcqs[index], [field]: value }
        setPaperData({ ...paperData, mcqs: newMcqs })
    }

    const updateMcqOption = (qIndex: number, optIndex: number, field: 'en' | 'ur', value: string) => {
        if (!paperData) return
        const newMcqs = [...paperData.mcqs]
        const newOptions = [...newMcqs[qIndex].options]
        newOptions[optIndex] = { ...newOptions[optIndex], [field]: value }
        newMcqs[qIndex] = { ...newMcqs[qIndex], options: newOptions }
        setPaperData({ ...paperData, mcqs: newMcqs })
    }

    const updateShortQuestion = (index: number, field: 'en' | 'ur', value: string) => {
        if (!paperData) return
        const newSqs = [...paperData.shortQuestions]
        newSqs[index] = { ...newSqs[index], [field]: value }
        setPaperData({ ...paperData, shortQuestions: newSqs })
    }

    const updateLongQuestion = (index: number, field: 'en' | 'ur', value: string) => {
        if (!paperData) return
        const newLqs = [...paperData.longQuestions]
        newLqs[index] = { ...newLqs[index], [field]: value }
        setPaperData({ ...paperData, longQuestions: newLqs })
    }

    const updateLongQuestionPart = (qIndex: number, pIndex: number, field: 'en' | 'ur', value: string) => {
        if (!paperData) return
        const newLqs = [...paperData.longQuestions]
        const newParts = [...newLqs[qIndex].parts]
        newParts[pIndex] = { ...newParts[pIndex], [field]: value }
        newLqs[qIndex] = { ...newLqs[qIndex], parts: newParts }
        setPaperData({ ...paperData, longQuestions: newLqs })
    }

    const handleSave = () => {
        if (!paperData) return
        localStorage.setItem('lastGeneratedPaper', JSON.stringify(paperData))
        setOriginalPaperData(paperData)
        setIsEditing(false)
        toast.success("Exam paper updated successfully")
    }

    const handleCancel = () => {
        setPaperData(originalPaperData)
        setIsEditing(false)
        toast.info("Edits discarded")
    }

    if (!paperData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No Paper Data Found</p>
                <Button
                    variant="ghost"
                    className="mt-4 text-emerald-500"
                    onClick={() => router.back()}
                >
                    <ChevronLeft size={16} /> Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-full bg-[#020202] py-8 px-6 md:px-10">

            {/* Action Bar */}
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-white relative z-10">
                <div className="flex flex-col">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all text-[10px] font-black uppercase tracking-[0.2em] mb-3 group"
                    >
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Generator
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <FileText size={20} />
                        </div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                            Exam <span className="text-emerald-500">REVIEW</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto p-2 rounded-[1.5rem] bg-zinc-900/30 border border-white/5 backdrop-blur-md">
                    {/* Editing Controls */}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="h-12 bg-white/5 border-white/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                <X size={16} className="mr-2" /> Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="h-12 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                            >
                                <Save size={16} className="mr-2" /> Save Changes
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    localStorage.setItem('architect_payload', JSON.stringify(paperData))
                                    if (id) {
                                        router.push(`/paper-editor?id=${id}`)
                                    } else {
                                        router.push('/paper-editor')
                                    }
                                }}
                                className="h-12 border-emerald-500 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:bg-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.3)] group"
                            >
                                <Sparkles size={16} className="mr-2 group-hover:rotate-12 transition-transform" /> Advanced Editor
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="h-12 bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                <Pencil size={14} className="mr-2" /> Edit Paper
                            </Button>
                        </div>
                    )}

                    <Separator orientation="vertical" className="h-8 bg-white/5 mx-1" />

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            disabled={isEditing}
                            className="h-12 bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                            <Printer size={16} className="mr-2" /> Print
                        </Button>
                        <Button
                            disabled={isExporting || isEditing}
                            onClick={handleDownloadPDF}
                            className="h-12 bg-white text-black hover:bg-emerald-500 hover:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 group"
                        >
                            {isExporting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download size={16} className="mr-2 group-hover:translate-y-0.5 transition-transform" />}
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error Overlay for Debugging */}
            {debugError && (
                <div className="max-w-5xl mx-auto mt-4 p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] backdrop-blur-md animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 text-red-500 mb-3">
                        <X size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Engine Failure Trace</span>
                    </div>
                    <code className="block text-zinc-300 text-[10px] font-mono whitespace-pre-wrap break-all bg-black/40 p-4 rounded-xl border border-white/5">
                        {debugError}
                    </code>
                    <button
                        onClick={() => setDebugError(null)}
                        className="mt-4 text-[9px] text-zinc-500 hover:text-emerald-500 uppercase font-black tracking-widest transition-all"
                    >
                        Clear Diagnostics
                    </button>
                </div>
            )}

            {/* Paper Preview Content */}

            <div className="max-w-5xl mx-auto p-4 md:p-12 bg-zinc-900/10 border border-white/5 rounded-[3rem] shadow-2xl relative">
                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full -z-10 opacity-30 pointer-events-none" />
                <div
                    ref={paperRef}
                    className="bg-white text-black p-8 md:p-16 shadow-2xl mx-auto pdf-capture-safe rounded-sm"
                    style={{
                        boxShadow: "0 0 50px rgba(0,0,0,0.5)",
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Watermark Overlay */}
                    {(paperData.content?.watermark?.text || paperData.content?.watermark?.image || paperData.watermark?.text || paperData.watermark?.image) && (() => {
                        const wm = paperData.content?.watermark || paperData.watermark || {};
                        return (
                            <div
                                className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                                style={{
                                    opacity: wm.opacity || 0.1,
                                    zIndex: wm.zIndex ?? 0
                                }}
                            >
                                <div style={{
                                    transform: `
                                        rotate(${wm.rotation || -45}deg) 
                                        scale(${wm.scale || 1})
                                        translate(${wm.hOffset || 0}px, ${wm.vOffset || 0}px)
                                    `,
                                    filter: `
                                        ${wm.grayscale ? 'grayscale(1)' : ''} 
                                        ${wm.invert ? 'invert(1)' : ''}
                                    `.trim()
                                }}>
                                    {wm.image ? (
                                        <img
                                            src={wm.image}
                                            alt="Watermark"
                                            className="max-w-[80%] h-auto select-none"
                                        />
                                    ) : (
                                        <div
                                            className="text-[120px] font-black uppercase tracking-[20px] select-none text-zinc-300"
                                        >
                                            {wm.text}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* --- BISE OFFICIAL HEADER --- */}
                    <div className="border-b-2 border-black pb-4 mb-6">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-[12px] font-bold italic">
                                <EditableText
                                    value={paperData.headerDetails?.session || "Inter Part-I (Session 2025-26)"}
                                    onSave={(val) => updateHeaderDetail('session', val)}
                                    isEditing={isEditing}
                                />
                            </div>
                            <div className="text-center flex-1 pr-6 flex flex-col items-center">
                                <h1 className="text-xl md:text-2xl font-black uppercase underline decoration-double underline-offset-4 leading-tight mb-2">
                                    <EditableText
                                        value={paperData.headerDetails?.schoolName || "Amin Model High School and Science Academy"}
                                        onSave={(val) => updateHeaderDetail('schoolName', val)}
                                        isEditing={isEditing}
                                    />
                                </h1>
                                <p className="text-md font-bold text-zinc-800">
                                    <EditableText
                                        value={safeRender(paperData.headerDetails?.systemBadge || "BISE REPLICA EXAMINATION SYSTEM")}
                                        onSave={(val) => updateHeaderDetail('systemBadge', val)}
                                        isEditing={isEditing}
                                    />
                                </p>
                            </div>
                            <div className="border-2 border-black p-2 text-sm font-bold min-w-[200px]">
                                <EditableText
                                    value={safeRender(paperData.headerDetails?.rollNoLabel || "Roll No: ______________")}
                                    onSave={(val) => updateHeaderDetail('rollNoLabel', val)}
                                    isEditing={isEditing}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 text-[13px] font-bold mt-4 border-t border-black pt-2">
                            <div>
                                SUBJECT: <span className="uppercase">
                                    <EditableText
                                        value={safeRender(paperData.paperInfo.subject)}
                                        onSave={(val) => updatePaperInfo('subject', val)}
                                        isEditing={isEditing}
                                    />
                                </span>
                            </div>
                            <div className="text-center">
                                CLASS: <span className="uppercase">
                                    <EditableText
                                        value={safeRender(paperData.paperInfo.class)}
                                        onSave={(val) => updatePaperInfo('class', val)}
                                        isEditing={isEditing}
                                    />
                                </span>
                            </div>
                            <div className="text-right">
                                <EditableText
                                    value={safeRender(paperData.headerDetails?.paperLabel || "PAPER: II (Objective)")}
                                    onSave={(val) => updateHeaderDetail('paperLabel', val)}
                                    isEditing={isEditing}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 text-[13px] font-bold">
                            <div>
                                <EditableText
                                    value={safeRender(paperData.headerDetails?.timeObjective || "TIME: 1.45 Hours")}
                                    onSave={(val) => updateHeaderDetail('timeObjective', val)}
                                    isEditing={isEditing}
                                />
                            </div>
                            <div className="text-center uppercase">Objective Type</div>
                            <div className="text-right">
                                <EditableText
                                    value={safeRender(paperData.headerDetails?.marksObjective || "MARKS: 12")}
                                    onSave={(val) => updateHeaderDetail('marksObjective', val)}
                                    isEditing={isEditing}
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION A: MCQS --- */}
                    <section className="mb-8">
                        <div className="text-[12px] font-bold mb-2 border border-black p-1 text-center">
                            <EditableText
                                value={safeRender(paperData.headerDetails?.mcqInstruction || "Note: You have four choices for each objective type question as A, B, C and D. The choice which you think is correct, fill that circle in front of that question number.")}
                                onSave={(val) => updateHeaderDetail('mcqInstruction', val)}
                                isEditing={isEditing}
                                tagName="p"
                            />
                        </div>

                        <div className="space-y-6">
                            {(() => {
                                if (paperData.paperInfo.subject === "English") {
                                    const mcqGroups = [
                                        { type: "verb_form", title: "(A)- Choose the correct form of verb." },
                                        { type: "spelling", title: "(B)- Choose the word with correct spellings." },
                                        { type: "meaning", title: "(C)- Choose the correct meanings of the underlined word." },
                                        { type: "grammar", title: "(D)- Choose the correct grammar." }
                                    ];

                                    return mcqGroups.map((group, gIdx) => {
                                        const groupMcqs = paperData.mcqs.filter(m => m.type === group.type);
                                        if (groupMcqs.length === 0) return null;

                                        return (
                                            <div key={gIdx} className="mb-6">
                                                <p className="font-bold text-[14px] mb-2">{group.title}</p>
                                                {groupMcqs.map((mcq, mIdx) => {
                                                    // Find original index for numbering
                                                    const originalIdx = paperData.mcqs.indexOf(mcq);
                                                    return (
                                                        <div key={mIdx} className="page-break-inside-avoid border-b border-dotted border-zinc-300 pb-4 mb-2">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <div className="text-[14px] flex-1 pr-4">
                                                                    <span className="font-bold mr-2">{originalIdx + 1}.</span>
                                                                    <EditableText
                                                                        value={safeRender(mcq.en)}
                                                                        onSave={(val) => updateMcq(originalIdx, 'en', val)}
                                                                        isEditing={isEditing}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-x-2 mt-2 border-t border-dotted border-zinc-200 pt-1">
                                                                {mcq.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="flex items-start text-[12px] leading-tight group">
                                                                        <span className="font-bold mr-2 mt-0.5">({String.fromCharCode(65 + oIdx)})</span>
                                                                        <div className="flex justify-between flex-1 min-w-0">
                                                                            <span className="block wrap-break-word">
                                                                                <EditableText
                                                                                    value={safeRender(opt.en)}
                                                                                    onSave={(val) => updateMcqOption(originalIdx, oIdx, 'en', val)}
                                                                                    isEditing={isEditing}
                                                                                    className="hover:bg-zinc-100 px-0.5 rounded"
                                                                                />
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    });
                                }

                                if (paperData.paperInfo.subject === "Urdu") {
                                    const urduMcqGroups = [
                                        { type: "hissa_nasr", title: "(1)- حصہ نثر کے مطابق درست جواب کی نشاندہی کریں۔ (5 نمبر)" },
                                        { type: "hissa_shairi", title: "(2)- حصہ شاعری کے مطابق درست جواب کی نشاندہی کریں۔ (5 نمبر)" },
                                        { type: "mcq_grammar", title: "(3)- مطابقت اور حروف کے درست استعمال کی نشاندہی کریں۔ (5 نمبر)" },
                                        { type: "mcq_usage", title: "(4)- رموزِ اوقاف اور جملوں کی درستگی کی نشاندہی کریں۔ (5 نمبر)" }
                                    ];

                                    const groupedContent = urduMcqGroups.map((group, gIdx) => {
                                        const groupMcqs = paperData.mcqs.filter(m => m.type === group.type);
                                        if (groupMcqs.length === 0) return null;

                                        return (
                                            <div key={gIdx} className="mb-6 text-right" dir="rtl">
                                                <p className="font-urdu font-bold text-[18px] mb-4 border-b border-zinc-200 pb-2">{group.title}</p>
                                                {groupMcqs.map((mcq, mIdx) => {
                                                    const originalIdx = paperData.mcqs.indexOf(mcq);
                                                    return (
                                                        <div key={mIdx} className="page-break-inside-avoid border-b border-dotted border-zinc-200 pb-6 mb-4">
                                                            <div className="flex flex-row-reverse justify-between items-start mb-4">
                                                                <div className="font-urdu text-[18px] flex-1">
                                                                    <span className="font-bold ml-4">{originalIdx + 1}-</span>
                                                                    <EditableText
                                                                        value={safeRender(mcq.ur)}
                                                                        onSave={(val) => updateMcq(originalIdx, 'ur', val)}
                                                                        isEditing={isEditing}
                                                                        className="font-urdu"
                                                                        dir="rtl"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                                                {mcq.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="flex flex-row-reverse items-start text-[16px] leading-relaxed group">
                                                                        <span className="font-urdu font-bold ml-2 text-emerald-600">({['الف', 'ب', 'ج', 'د'][oIdx]})</span>
                                                                        <div className="font-urdu flex-1 min-w-0 text-right">
                                                                            <EditableText
                                                                                value={opt.ur}
                                                                                onSave={(val) => updateMcqOption(originalIdx, oIdx, 'ur', val)}
                                                                                isEditing={isEditing}
                                                                                className="hover:bg-zinc-100 px-1 rounded font-urdu"
                                                                                dir="rtl"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    });

                                    if (groupedContent.some(c => c !== null)) return groupedContent;
                                }

                                return paperData.mcqs.map((mcq, idx) => (
                                    <div key={idx} className="page-break-inside-avoid border-b border-dotted border-zinc-300 pb-4 mb-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-[14px] flex-1 pr-4">
                                                <span className="font-bold mr-2">{idx + 1}.</span>
                                                <EditableText
                                                    value={safeRender(mcq.en)}
                                                    onSave={(val) => updateMcq(idx, 'en', val)}
                                                    isEditing={isEditing}
                                                />
                                            </div>
                                            <div className="text-[14px] font-medium text-right flex-1 font-nastaleeq leading-normal" dir="rtl">
                                                <EditableText
                                                    value={safeRender(mcq.ur)}
                                                    onSave={(val) => updateMcq(idx, 'ur', val)}
                                                    isEditing={isEditing}
                                                    dir="rtl"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-x-2 mt-2 border-t border-dotted border-zinc-200 pt-1">
                                            {mcq.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-start text-[12px] leading-tight group">
                                                    {/* Official Label Style */}
                                                    <span className="font-bold mr-2 mt-0.5">({String.fromCharCode(65 + oIdx)})</span>

                                                    <div className="flex justify-between flex-1 min-w-0">
                                                        {/* English Option */}
                                                        <span className="block wrap-break-word">
                                                            <EditableText
                                                                value={safeRender(opt.en)}
                                                                onSave={(val) => updateMcqOption(idx, oIdx, 'en', val)}
                                                                isEditing={isEditing}
                                                                className="hover:bg-zinc-100 px-0.5 rounded"
                                                            />
                                                        </span>

                                                        {/* Urdu Option */}
                                                        <span className="font-nastaleeq text-[11px] text-right mt-0.5 block wrap-break-word leading-relaxed" dir="rtl">
                                                            <EditableText
                                                                value={safeRender(opt.ur)}
                                                                onSave={(val) => updateMcqOption(idx, oIdx, 'ur', val)}
                                                                isEditing={isEditing}
                                                                dir="rtl"
                                                                className="hover:bg-zinc-100 px-0.5 rounded"
                                                            />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            })()}
                        </div>
                    </section>

                    {/* --- SUBJECTIVE PART --- */}
                    <div className="page-break-before-always border-t-4 border-double border-black pt-4">
                        <div className="text-center mb-6">
                            <h2 className="text-lg font-bold uppercase underline">
                                <EditableText
                                    value={safeRender(paperData.headerDetails?.part2Title || "Part-II (Subjective)")}
                                    onSave={(val) => updateHeaderDetail('part2Title', val)}
                                    isEditing={isEditing}
                                />
                            </h2>
                            <div className="flex justify-between text-[13px] font-bold mt-2">
                                <span>
                                    <EditableText
                                        value={safeRender(paperData.headerDetails?.timeSubjective || "TIME: 2:10 Hours")}
                                        onSave={(val) => updateHeaderDetail('timeSubjective', val)}
                                        isEditing={isEditing}
                                    />
                                </span>
                                <span>
                                    <EditableText
                                        value={safeRender(paperData.headerDetails?.marksSubjective || "MARKS: 63")}
                                        onSave={(val) => updateHeaderDetail('marksSubjective', val)}
                                        isEditing={isEditing}
                                    />
                                </span>
                            </div>
                        </div>

                        {/* Short Questions */}
                        {/* Short Questions Section */}
                        <div className="mb-6">
                            {(() => {
                                if (paperData.paperInfo.subject === "Urdu") {
                                    return (
                                        <div className="space-y-12" dir="rtl">
                                            {/* Q2: Poetry Tashreeh (10 Marks) */}
                                            {paperData.urduData?.shyrNazm || paperData.urduData?.shyrGhazal ? (
                                                <div className="mb-8">
                                                    <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                        <span>سوال نمبر 2: مندرجہ ذیل اشعار کی تشریح کریں، نظم کا عنوان اور شاعر کا نام بھی لکھیں۔</span>
                                                        <span>(10)</span>
                                                    </div>

                                                    {paperData.urduData.shyrNazm && paperData.urduData.shyrNazm.length > 0 && (
                                                        <div className="mb-8">
                                                            <p className="font-bold font-urdu text-[16px] mb-4 text-emerald-800 underline">الف- حصہ نظم:</p>
                                                            <div className="grid grid-cols-1 gap-6 px-4">
                                                                {paperData.urduData.shyrNazm.map((shyr, idx) => (
                                                                    <div key={idx} className="page-break-inside-avoid italic text-center text-[20px] font-urdu border-b border-dotted border-zinc-200 pb-4 leading-loose">
                                                                        <EditableText
                                                                            value={safeRender(shyr.couplet)}
                                                                            onSave={(val) => {
                                                                                const newData = [...paperData.urduData!.shyrNazm!];
                                                                                newData[idx] = { ...shyr, couplet: val };
                                                                                setPaperData({ ...paperData, urduData: { ...paperData.urduData!, shyrNazm: newData } });
                                                                            }}
                                                                            isEditing={isEditing}
                                                                            dir="rtl"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {paperData.urduData.shyrGhazal && paperData.urduData.shyrGhazal.length > 0 && (
                                                        <div className="mb-8">
                                                            <p className="font-bold font-urdu text-[16px] mb-4 text-emerald-800 underline">ب- حصہ غزل:</p>
                                                            <div className="grid grid-cols-1 gap-6 px-4">
                                                                {paperData.urduData.shyrGhazal.map((shyr, idx) => (
                                                                    <div key={idx} className="page-break-inside-avoid italic text-center text-[20px] font-urdu border-b border-dotted border-zinc-200 pb-4 leading-loose">
                                                                        <EditableText
                                                                            value={safeRender(shyr.couplet)}
                                                                            onSave={(val) => {
                                                                                const newData = [...paperData.urduData!.shyrGhazal!];
                                                                                newData[idx] = { ...shyr, couplet: val };
                                                                                setPaperData({ ...paperData, urduData: { ...paperData.urduData!, shyrGhazal: newData } });
                                                                            }}
                                                                            isEditing={isEditing}
                                                                            dir="rtl"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            {/* Q3: Siaq-o-Sabaq (15 Marks) */}
                                            {paperData.urduData?.siaqoSabaq && (
                                                <div className="page-break-inside-avoid mb-8">
                                                    <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                        <span>سوال نمبر 3: سیاق و سباق کے حوالے سے کسی ایک جزو کی تشریح کریں (سبق کا عنوان اور مصنف کا نام بھی لکھیں)۔</span>
                                                        <span>(15)</span>
                                                    </div>
                                                    <div className="p-6 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl text-[18px] font-urdu leading-extra-loose text-justify">
                                                        <EditableText
                                                            value={safeRender(paperData.urduData.siaqoSabaq.paragraph)}
                                                            onSave={(val) => setPaperData({ ...paperData, urduData: { ...paperData.urduData!, siaqoSabaq: { ...paperData.urduData!.siaqoSabaq!, paragraph: val } } })}
                                                            isEditing={isEditing}
                                                            dir="rtl"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Q4 & Q5 Summaries */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                                {paperData.urduData?.khulasaSabaq && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                            <span>سوال نمبر 4: سبق کا خلاصہ لکھیں۔</span>
                                                            <span>(05)</span>
                                                        </div>
                                                        <div className="text-center py-6 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl">
                                                            <p className="text-[14px] text-emerald-600 font-bold uppercase tracking-widest mb-2 font-sans">سبق کا عنوان</p>
                                                            <div className="text-[22px] font-bold font-urdu">
                                                                <EditableText
                                                                    value={safeRender(paperData.urduData.khulasaSabaq.lessonTitle)}
                                                                    onSave={(val) => setPaperData({ ...paperData, urduData: { ...paperData.urduData!, khulasaSabaq: { lessonTitle: val } } })}
                                                                    isEditing={isEditing}
                                                                    dir="rtl"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {paperData.urduData?.khulasaNazm && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                            <span>سوال نمبر 5: نظم کا خلاصہ لکھیں۔</span>
                                                            <span>(05)</span>
                                                        </div>
                                                        <div className="text-center py-6 bg-blue-50/50 border-2 border-blue-100 rounded-2xl">
                                                            <p className="text-[14px] text-blue-600 font-bold uppercase tracking-widest mb-2 font-sans">نظم کا عنوان</p>
                                                            <div className="text-[22px] font-bold font-urdu">
                                                                <EditableText
                                                                    value={safeRender(paperData.urduData.khulasaNazm.poemTitle)}
                                                                    onSave={(val) => setPaperData({ ...paperData, urduData: { ...paperData.urduData!, khulasaNazm: { poemTitle: val } } })}
                                                                    isEditing={isEditing}
                                                                    dir="rtl"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Q6: Letter/Application (10 Marks) */}
                                            {paperData.urduData?.khatDarkhwast && (
                                                <div className="page-break-inside-avoid mb-8">
                                                    <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                        <span>سوال نمبر 6: {paperData.urduData.khatDarkhwast.type} تحریر کریں۔</span>
                                                        <span>(10)</span>
                                                    </div>
                                                    <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-[18px] font-urdu leading-relaxed">
                                                        <EditableText
                                                            value={safeRender(paperData.urduData.khatDarkhwast.prompt)}
                                                            onSave={(val) => setPaperData({ ...paperData, urduData: { ...paperData.urduData!, khatDarkhwast: { ...paperData.urduData!.khatDarkhwast!, prompt: val } } })}
                                                            isEditing={isEditing}
                                                            dir="rtl"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Q7: Dialogue/Story (05 Marks) */}
                                            {paperData.urduData?.dialogueStory && (
                                                <div className="page-break-inside-avoid mb-8">
                                                    <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                        <span>سوال نمبر 7: {paperData.urduData.dialogueStory.type} تحریر کریں۔</span>
                                                        <span>(05)</span>
                                                    </div>
                                                    <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-[18px] font-urdu leading-relaxed italic text-emerald-800">
                                                        <EditableText
                                                            value={safeRender(paperData.urduData.dialogueStory.prompt)}
                                                            onSave={(val) => setPaperData({ ...paperData, urduData: { ...paperData.urduData!, dialogueStory: { ...paperData.urduData!.dialogueStory!, prompt: val } } })}
                                                            isEditing={isEditing}
                                                            dir="rtl"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Q8: Sentence Correction (05 Marks) */}
                                            {paperData.urduData?.sentenceCorrection && (
                                                <div className="page-break-inside-avoid mb-8">
                                                    <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                        <span>سوال نمبر 8: جملوں کی درستگی کریں۔ (کوئی سے پانچ)</span>
                                                        <span>(05)</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 px-4">
                                                        {paperData.urduData.sentenceCorrection.map((sentence, idx) => (
                                                            <div key={idx} className="flex items-center text-[18px] font-urdu border-b border-dotted border-zinc-200 pb-2">
                                                                <span className="font-bold ml-4">({idx + 1})</span>
                                                                <EditableText
                                                                    value={safeRender(sentence)}
                                                                    onSave={(val) => {
                                                                        const newData = [...paperData.urduData!.sentenceCorrection!];
                                                                        newData[idx] = val;
                                                                        setPaperData({ ...paperData, urduData: { ...paperData.urduData!, sentenceCorrection: newData } });
                                                                    }}
                                                                    isEditing={isEditing}
                                                                    dir="rtl"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Q9: Essay (Mazmoon) (20 Marks) */}
                                            {paperData.urduData?.mazmoon && (
                                                <div className="page-break-inside-avoid mb-8">
                                                    <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                        <span>سوال نمبر 9: مندرجہ ذیل میں سے کسی ایک عنوان پر جامع مضمون لکھیں۔</span>
                                                        <span>(20)</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {paperData.urduData.mazmoon.map((topic, idx) => (
                                                            <div key={idx} className="p-6 border-2 border-emerald-500/20 rounded-2xl bg-emerald-50/30 text-center font-bold text-[18px] font-urdu hover:bg-emerald-50 transition-colors">
                                                                <EditableText
                                                                    value={safeRender(topic)}
                                                                    onSave={(val) => {
                                                                        const newMazmoons = [...paperData.urduData!.mazmoon!];
                                                                        newMazmoons[idx] = val;
                                                                        setPaperData({ ...paperData, urduData: { ...paperData.urduData!, mazmoon: newMazmoons } });
                                                                    }}
                                                                    isEditing={isEditing}
                                                                    dir="rtl"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                }

                                // Default/English Short Questions Section
                                const chunks: Array<Array<{ data: { en: string; ur: string }; globalIdx: number }>> = []
                                const rawQuestions = paperData.shortQuestions.map((q, i) => ({ data: q, globalIdx: i }))

                                for (let i = 0; i < rawQuestions.length; i += 6) {
                                    chunks.push(rawQuestions.slice(i, i + 6))
                                }

                                // Merge last chunk if it's too small (< 5) and not the only chunk
                                if (chunks.length > 1) {
                                    const lastChunk = chunks[chunks.length - 1]
                                    if (lastChunk.length < 5) {
                                        const prevChunk = chunks[chunks.length - 2]
                                        prevChunk.push(...lastChunk)
                                        chunks.pop()
                                    }
                                }

                                // 2. Render Chunks
                                return chunks.map((chunk, cIdx) => {
                                    const questionNumber = 2 + cIdx
                                    // Standard board rule: approx 2/3 choice. e.g. 6->4, 8->5, 9->6, 12->8
                                    const attemptCount = Math.floor(chunk.length * 2 / 3)

                                    return (
                                        <div key={cIdx} className="mb-8">
                                            <div className="flex justify-between font-bold border-b border-black mb-2 text-[14px]">
                                                <span>
                                                    <span className="mr-1">{questionNumber}.</span>
                                                    Write short answers to any {convertNumberToWord(attemptCount)} ({attemptCount}) questions.
                                                </span>
                                                <span>(2 x {attemptCount} = {attemptCount * 2})</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-y-2">
                                                {chunk.map(({ data: sq, globalIdx }, idx) => (
                                                    <div key={globalIdx} className="flex justify-between items-center text-[14px] py-1 border-b border-zinc-100 page-break-inside-avoid">
                                                        <p className="flex-1 pr-4">
                                                            <span className="font-bold mr-2">{idx + 1}-</span>
                                                            <EditableText
                                                                value={safeRender(sq.en)}
                                                                onSave={(val) => updateShortQuestion(globalIdx, 'en', val)}
                                                                isEditing={isEditing}
                                                            />
                                                        </p>
                                                        <p className="flex-1 text-right font-nastaleeq font-semibold text-[11px]" dir="rtl">
                                                            <span className="font-bold mr-2 text-[10px]">{idx + 1}- </span>
                                                            <EditableText
                                                                value={safeRender(sq.ur)}
                                                                onSave={(val) => updateShortQuestion(globalIdx, 'ur', val)}
                                                                isEditing={isEditing}
                                                                dir="rtl"
                                                            />
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })
                            })()}
                        </div>


                        {/* --- ENGLISH SPECIAL SECTIONS --- */}
                        {paperData.englishData && (
                            <div className="mb-8 space-y-8">
                                {/* Q2: Paraphrasing */}
                                {paperData.englishData.paraphrasing && paperData.englishData.paraphrasing.length > 0 && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">2.</span>Paraphrase one of the following stanzas.</span>
                                            <span>(5)</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                                            {paperData.englishData.paraphrasing.map((stanza, idx) => (
                                                <div key={idx} className="italic text-center">
                                                    <span className="font-bold not-italic block mb-2 text-left">
                                                        {idx === 0 ? '(i)' : '(ii)'}
                                                    </span>
                                                    <div className="whitespace-pre-line leading-relaxed font-serif text-[15px]">
                                                        <EditableText
                                                            value={safeRender(stanza.stanza)}
                                                            onSave={(val) => {
                                                                if (!paperData.englishData?.paraphrasing) return;
                                                                const newData = [...paperData.englishData.paraphrasing];
                                                                newData[idx] = { ...stanza, stanza: val };
                                                                setPaperData({ ...paperData, englishData: { ...paperData.englishData, paraphrasing: newData } });
                                                            }}
                                                            isEditing={isEditing}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Q3: Stanza Comprehension */}
                                {paperData.englishData.stanzaComprehension && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">3.</span>Read the stanza carefully and answer the questions given at the end.</span>
                                            <span>(8)</span>
                                        </div>
                                        <div className="bg-zinc-50 p-4 border rounded-lg mb-4 italic text-center font-serif text-[15px] whitespace-pre-line">
                                            <EditableText
                                                value={safeRender(paperData.englishData.stanzaComprehension.stanza)}
                                                onSave={(val) => {
                                                    if (!paperData.englishData?.stanzaComprehension) return;
                                                    setPaperData({ ...paperData, englishData: { ...paperData.englishData, stanzaComprehension: { ...paperData.englishData.stanzaComprehension, stanza: val } } });
                                                }}
                                                isEditing={isEditing}
                                            />
                                        </div>
                                        <div className="space-y-2 pl-4">
                                            <p className="font-bold text-[13px] mb-2 uppercase">QUESTIONS: NOTE: Each answer should be in one to two sentences.</p>
                                            {paperData.englishData.stanzaComprehension.questions.map((q, idx) => (
                                                <div key={idx} className="flex justify-between text-[14px]">
                                                    <span className="flex-1">
                                                        <span className="font-bold mr-2">{['i', 'ii', 'iii', 'iv'][idx]}.</span>
                                                        <EditableText
                                                            value={safeRender(q.question)}
                                                            onSave={(val) => {
                                                                if (!paperData.englishData?.stanzaComprehension) return;
                                                                const newQs = [...paperData.englishData.stanzaComprehension.questions];
                                                                newQs[idx] = { ...q, question: val };
                                                                setPaperData({ ...paperData, englishData: { ...paperData.englishData, stanzaComprehension: { ...paperData.englishData.stanzaComprehension, questions: newQs } } });
                                                            }}
                                                            isEditing={isEditing}
                                                        />
                                                    </span>
                                                    <span className="font-bold">{q.marks}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Q4: Passage Comprehension */}
                                {paperData.englishData.passageComprehension && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">4.</span>Read the following passage carefully and answer the questions given at the end.</span>
                                            <span>({paperData.englishData.passageComprehension.questions.length} x 2 = {paperData.englishData.passageComprehension.questions.length * 2})</span>
                                        </div>
                                        <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-lg mb-4 text-justify font-serif text-[13px] leading-relaxed">
                                            <EditableText
                                                value={paperData.englishData.passageComprehension.passage}
                                                onSave={(val) => {
                                                    if (!paperData.englishData?.passageComprehension) return;
                                                    setPaperData({ ...paperData, englishData: { ...paperData.englishData, passageComprehension: { ...paperData.englishData.passageComprehension, passage: val } } });
                                                }}
                                                isEditing={isEditing}
                                            />
                                        </div>
                                        <div className="space-y-3 pl-4 mb-4">
                                            {paperData.englishData.passageComprehension.questions.map((q, idx) => (
                                                <div key={idx} className="flex justify-between text-[14px]">
                                                    <span className="flex-1">
                                                        <span className="font-bold mr-2">({idx + 1})</span>
                                                        <EditableText
                                                            value={q.question}
                                                            onSave={(val) => {
                                                                if (!paperData.englishData?.passageComprehension) return;
                                                                const newQs = [...paperData.englishData.passageComprehension.questions];
                                                                newQs[idx] = { ...q, question: val };
                                                                setPaperData({ ...paperData, englishData: { ...paperData.englishData, passageComprehension: { ...paperData.englishData.passageComprehension, questions: newQs } } });
                                                            }}
                                                            isEditing={isEditing}
                                                        />
                                                    </span>
                                                    <span className="font-bold">({q.marks})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Q5: Summary */}
                                {paperData.englishData.summary && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">5.</span>{paperData.englishData.summary.userSummary ? 'Read the summary and answer the questions.' : 'Write down the summary of the poem.'}</span>
                                            <span>(5)</span>
                                        </div>

                                        {paperData.englishData.summary.userSummary ? (
                                            <div className="px-6 py-4 border border-zinc-200 rounded-lg bg-zinc-50/50 text-[13px] leading-relaxed font-serif whitespace-pre-line text-justify">
                                                <EditableText
                                                    value={paperData.englishData.summary.userSummary}
                                                    onSave={(val) => {
                                                        if (!paperData.englishData?.summary) return;
                                                        setPaperData({
                                                            ...paperData,
                                                            englishData: {
                                                                ...paperData.englishData,
                                                                summary: { ...paperData.englishData.summary, userSummary: val }
                                                            }
                                                        });
                                                    }}
                                                    isEditing={isEditing}
                                                />
                                            </div>
                                        ) : (
                                            <div className="px-8 py-6 border-2 border-dashed border-zinc-200 rounded-xl text-center bg-zinc-50/30">
                                                <span className="text-[14px] font-black uppercase tracking-[0.2em] italic text-zinc-400">Poem Title: </span>
                                                <span className="text-[18px] font-black text-emerald-600 ml-2">
                                                    <EditableText
                                                        value={safeRender(paperData.englishData.summary.poem)}
                                                        onSave={(val) => setPaperData({
                                                            ...paperData,
                                                            englishData: {
                                                                ...paperData.englishData!,
                                                                summary: { ...paperData.englishData!.summary!, poem: val }
                                                            }
                                                        })}
                                                        isEditing={isEditing}
                                                    />
                                                </span>
                                                <div className="mt-4 text-[9px] text-zinc-400 uppercase font-black tracking-widest leading-tight">
                                                    Student is required to write the summary of the poem <br /> on the provided answer sheet.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Q6: Idioms */}
                                {paperData.englishData.idioms && paperData.englishData.idioms.length > 0 && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">6.</span>Use the following words / phrases / idioms in your sentences.</span>
                                            <span>({paperData.englishData.idioms.length} x 1 = {paperData.englishData.idioms.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-8 gap-y-2 px-4 italic font-bold text-[14px]">
                                            {paperData.englishData.idioms.map((item, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <span>{['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)'][idx]}</span>
                                                    <EditableText
                                                        value={safeRender(item.word)}
                                                        onSave={(val) => {
                                                            if (!paperData.englishData?.idioms) return;
                                                            const newData = [...paperData.englishData.idioms];
                                                            newData[idx] = { ...item, word: val };
                                                            setPaperData({ ...paperData, englishData: { ...paperData.englishData, idioms: newData } });
                                                        }}
                                                        isEditing={isEditing}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Q7: Letter/Story/Dialogue */}
                                {paperData.englishData.letterStoryDialogue && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">7.</span>Write a {paperData.englishData.letterStoryDialogue.type} on the following.</span>
                                            <span>(8)</span>
                                        </div>
                                        <div className="px-4 font-bold text-[14px] italic text-emerald-700">
                                            <EditableText
                                                value={safeRender(paperData.englishData.letterStoryDialogue.topic)}
                                                onSave={(val) => {
                                                    if (!paperData.englishData?.letterStoryDialogue) return;
                                                    setPaperData({ ...paperData, englishData: { ...paperData.englishData, letterStoryDialogue: { ...paperData.englishData.letterStoryDialogue, topic: val } } });
                                                }}
                                                isEditing={isEditing}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Q8: Translation */}
                                {paperData.englishData.translation && paperData.englishData.translation.length > 0 && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">8.</span>Translate the following sentences into English.</span>
                                            <span>(4)</span>
                                        </div>
                                        <div className="space-y-4 px-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {paperData.englishData.translation.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[14px] font-nastaleeq border-b border-zinc-50 pb-2" dir="rtl">
                                                        <span className="font-bold ml-2">({['i', 'ii', 'iii', 'iv', 'v'][idx]})</span>
                                                        <EditableText
                                                            value={safeRender(item.ur)}
                                                            onSave={(val) => {
                                                                if (!paperData.englishData?.translation) return;
                                                                const newData = [...paperData.englishData.translation];
                                                                newData[idx] = { ...item, ur: val };
                                                                setPaperData({ ...paperData, englishData: { ...paperData.englishData, translation: newData } });
                                                            }}
                                                            isEditing={isEditing}
                                                            dir="rtl"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Q9: Change of Voice */}
                                {paperData.englishData.voice && paperData.englishData.voice.length > 0 && (
                                    <div className="page-break-inside-avoid">
                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                            <span><span className="mr-1">9.</span>Change the voice of the following.</span>
                                            <span>({paperData.englishData.voice.length})</span>
                                        </div>
                                        <div className="space-y-2 px-4 italic">
                                            {paperData.englishData.voice.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 text-[14px]">
                                                    <span className="font-bold">({['i', 'ii', 'iii', 'iv', 'v'][idx]})</span>
                                                    <EditableText
                                                        value={safeRender(item.active)}
                                                        onSave={(val) => {
                                                            if (!paperData.englishData?.voice) return;
                                                            const newData = [...paperData.englishData.voice];
                                                            newData[idx] = { ...item, active: val };
                                                            setPaperData({ ...paperData, englishData: { ...paperData.englishData, voice: newData } });
                                                        }}
                                                        isEditing={isEditing}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Manual Writing Area (Essay/Paragraph) */}
                        {paperData.paperInfo.subject === "English" && paperData.longQuestions.length > 0 && (
                            <div className="mt-12 page-break-inside-avoid border-t-2 border-zinc-100 pt-8">
                                <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                    <span><span className="mr-1">10.</span>Write an Essay / Paragraph on ANY ONE of the following topics.</span>
                                    <span>(15)</span>
                                </div>
                                <div className="px-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 font-bold text-[14px]">
                                        {paperData.longQuestions.map((lq, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <span>({['i', 'ii', 'iii', 'iv', 'v'][idx]})</span>
                                                <EditableText
                                                    value={safeRender(lq.en)}
                                                    onSave={(val) => updateLongQuestion(idx, 'en', val)}
                                                    isEditing={isEditing}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Writing Lines / Box */}
                                    <div className="mt-8 border-2 border-dashed border-zinc-200 h-[400px] flex flex-col items-center justify-center text-zinc-300 font-bold uppercase tracking-widest bg-zinc-50/50 rounded-lg">
                                        <div className="text-xl mb-2 opacity-30">Writing Area</div>
                                        <div className="text-[10px] opacity-20">Student will write their response here manually</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Print Styles */}
            <style jsx global>{`
s  @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');

  @media print {
    @page {
      size: A4;
      margin: 0.5in;
    }
    header, aside, .Action-Bar, button, .Action-Buttons, .no-print {
      display: none !important;
    }
    body {
      background: white !important;
      -webkit-print-color-adjust: exact;
    }
    .page-break-inside-avoid { page-break-inside: avoid; }
    .page-break-before-always { page-break-before: always; }
  }

  .bise-paper {
    font-family: "Times New Roman", Times, serif !important;
    color: black !important;
    line-height: 1.2;
  }

  .font-nastaleeq {
    font-family: 'Noto Nastaliq Urdu', serif;
    line-height: 1.6;
  }
`}</style>
        </div>
    )
}

export default function ViewPaperPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Loading Paper...</p>
            </div>
        }>
            <PaperViewer />
        </Suspense>
    )
}
