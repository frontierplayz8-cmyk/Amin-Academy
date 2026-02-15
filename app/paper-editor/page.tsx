"use client"

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Printer, Save, ChevronLeft, ZoomIn, ZoomOut, Grid3x3, Languages,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
    Type, Palette, GripVertical,
    Trash2, Sparkles, Layout, Image as ImageIcon,
    RotateCcw, ArrowUp, ArrowDown, X,
    Upload, Layers, MoveHorizontal, MoveVertical, Shrink, Wand2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { ScholarPanel } from '@/components/scholar/ScholarPanel'
import { PaperRenderer, SUBJECT_LAYOUTS, getSubjectType } from '@/components/PaperRenderer'
import { AISectionPromptModal } from '@/components/AISectionPromptModal'

function PaperEditorContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const paperId = searchParams.get('id')
    const { user } = useAuth()

    const [paperData, setPaperData] = useState<any>(null)
    const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
    const [sectionStyles, setSectionStyles] = useState<Record<string, any>>({})
    const [zoom, setZoom] = useState(100)
    const [showGrid, setShowGrid] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(400)
    const [isResizing, setIsResizing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isScholarOpen, setIsScholarOpen] = useState(false)
    const [isAIModalOpen, setIsAIModalOpen] = useState(false)
    const [activeSectionAI, setActiveSectionAI] = useState<any>(null)

    const canvasRef = useRef<HTMLDivElement>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)

    // Load data from ID or localStorage
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)

            if (paperId && user) {
                try {
                    const token = await user.getIdToken()
                    const res = await fetch(`/api/admin/exams/${paperId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    const data = await res.json()

                    if (data.success) {
                        const content = data.exam.content
                        const subjectType = getSubjectType(content.paperInfo?.subject || '')
                        const defaultLayout = SUBJECT_LAYOUTS[subjectType] || SUBJECT_LAYOUTS.general

                        // Sanitize current layout if it looks like the old "mixed" layout
                        let finalLayout = content.sectionOrder || defaultLayout
                        if (finalLayout.length > 20) { // Old mixed layout was long
                            finalLayout = defaultLayout
                        }

                        setPaperData({
                            ...content,
                            floatingElements: content.floatingElements || [],
                            currentTheme: content.currentTheme || 'modern',
                            sectionOrder: finalLayout,
                            watermark: content.watermark || { text: '', opacity: 0.1, rotation: -45 }
                        })
                        setSectionStyles(content.sectionStyles || {})
                        toast.success("Paper loaded successfully")
                        setIsLoading(false)
                        return
                    }
                } catch (e) {
                    console.error("Fetch error:", e)
                }
            }

            const localData = localStorage.getItem('architect_payload')
            if (localData) {
                try {
                    const parsed = JSON.parse(localData)
                    const subjectType = getSubjectType(parsed.paperInfo?.subject || '')
                    const defaultLayout = SUBJECT_LAYOUTS[subjectType] || SUBJECT_LAYOUTS.general

                    // Sanitize current layout
                    let finalLayout = parsed.sectionOrder || defaultLayout
                    if (finalLayout.length > 20) {
                        finalLayout = defaultLayout
                    }

                    setPaperData({
                        ...parsed,
                        floatingElements: parsed.floatingElements || [],
                        currentTheme: parsed.currentTheme || 'modern',
                        sectionOrder: finalLayout,
                        watermark: parsed.watermark || { text: '', opacity: 0.1, rotation: -45 }
                    })
                    setSectionStyles(parsed.sectionStyles || {})
                    toast.info("Loaded from current session")
                } catch (e) {
                    toast.error("Failed to load session data")
                }
            }

            setIsLoading(false)
        }

        loadData()
    }, [paperId, user])

    // Resize logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            const newWidth = e.clientX
            if (newWidth > 320 && newWidth < 600) {
                setSidebarWidth(newWidth)
            }
        }
        const handleMouseUp = () => setIsResizing(false)

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    const handleSectionClick = (id: string, e: React.MouseEvent) => {
        if (e.shiftKey) {
            setSelectedSectionIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            )
        } else {
            setSelectedSectionIds([id])
        }
    }

    const handleAIAction = (id: string, type: string, title: string, content: any) => {
        setActiveSectionAI({ id, type, title, content: content || paperData })
        setIsAIModalOpen(true)
    }

    const handleAIGenerated = (data: any, action: 'ADD_CONTENT' | 'REPLACE_CONTENT' | 'IMPROVE_CONTENT') => {
        if (!activeSectionAI || !paperData) return

        const newPaperData = { ...paperData }
        const { type, id } = activeSectionAI

        if (type === 'mcq_group') {
            const newMcqs = data.questions || []
            if (action === 'ADD_CONTENT') {
                newPaperData.mcqs = [...newPaperData.mcqs, ...newMcqs]
            } else {
                newPaperData.mcqs = newMcqs
            }
        } else if (type === 'short_questions' || type === 'short-questions-lessons') {
            const newSq = data.items || []
            if (action === 'ADD_CONTENT') {
                newPaperData.shortQuestions = [...newPaperData.shortQuestions, ...newSq]
            } else {
                newPaperData.shortQuestions = newSq
            }
        } else if (type === 'long_questions' || type === 'subjective_q') {
            const newLq = data.items || []
            if (action === 'ADD_CONTENT') {
                newPaperData.longQuestions = [...newPaperData.longQuestions, ...newLq]
            } else {
                newPaperData.longQuestions = newLq
            }
        } else {
            // Header or Title fallback
            if (id.includes('header_')) {
                const key = id.replace('header_', '')
                newPaperData.headerDetails = { ...newPaperData.headerDetails, [key]: data.improvedText || data }
            } else if (id === 'subj_title') {
                newPaperData.headerDetails = { ...newPaperData.headerDetails, part2Title: data.improvedText || data }
            }
        }

        setPaperData(newPaperData)
        setIsAIModalOpen(false)
        setActiveSectionAI(null)
        toast.success("Magic Action Complete!")
    }

    const handleAIImprove = () => {
        if (selectedSectionIds.length === 0) {
            toast.error("Select a section first")
            return
        }

        const sectionId = selectedSectionIds[0]
        let sectionType = "general"
        let sectionContent = null
        let sectionTitle = "Selected Section"

        if (sectionId.includes('header')) {
            sectionType = 'header'
            sectionContent = paperData.headerDetails
            sectionTitle = "Header Details"
        } else if (sectionId.includes('mcq')) {
            sectionType = 'mcq_group'
            sectionContent = paperData.mcqs
            sectionTitle = "MCQ Section"
        } else if (sectionId === 'subj_title') {
            sectionType = 'subjective_title'
            sectionContent = paperData.headerDetails?.part2Title
            sectionTitle = "Subjective Title"
        } else if (sectionId.includes('sq') || sectionId.includes('short')) {
            sectionType = 'short_questions'
            sectionContent = paperData.shortQuestions
            sectionTitle = "Short Questions"
        }

        handleAIAction(sectionId, sectionType, sectionTitle, sectionContent)
    }

    const handleSave = async () => {
        if (!paperId || !user) {
            localStorage.setItem('architect_payload', JSON.stringify({
                ...paperData,
                sectionStyles
            }))
            toast.success("Draft saved to local session")
            return
        }

        toast.promise(async () => {
            const token = await user.getIdToken()
            const res = await fetch(`/api/admin/exams/${paperId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: {
                        ...paperData,
                        sectionStyles
                    }
                })
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.message)
        }, {
            loading: 'Saving to Secure Vault...',
            success: 'Paper permanently saved!',
            error: (err) => `Save failed: ${err.message}`
        })
    }


    const deleteSection = (key: string) => {
        const currentOrder = paperData.sectionOrder || []
        setPaperData({ ...paperData, sectionOrder: currentOrder.filter((k: string) => k !== key) })
        toast.info("Section removed")
    }

    const addSection = (key: string) => {
        const currentOrder = paperData.sectionOrder || []
        if (!currentOrder.includes(key)) {
            setPaperData({ ...paperData, sectionOrder: [...currentOrder, key] })
            toast.success("Section added")
        }
    }

    const BISE_SECTIONS: Record<string, any[]> = {
        'science': [
            { id: 'header', label: 'Main Header' },
            { id: 'mcqs', label: 'Objective (MCQs)' },
            { id: 'subjective-header', label: 'Subjective Header' },
            { id: 'short-questions', label: 'Short Questions (Section-I)' },
            { id: 'long-questions', label: 'Long Questions (Theory)' },
            { id: 'long-questions-numerical', label: 'Long Questions (Numerical)' },
            { id: 'diagram-practical', label: 'Diagram/Practical-Based' }
        ],
        'mathematics': [
            { id: 'header', label: 'Main Header' },
            { id: 'mcqs', label: 'Objective (MCQs)' },
            { id: 'subjective-header', label: 'Subjective Header' },
            { id: 'short-questions-math', label: 'Short Questions (Def & Alg)' },
            { id: 'long-theorems', label: 'Long Questions (Theorems)' },
            { id: 'long-calculations', label: 'Long Questions (Calculations)' }
        ],
        'languages': [
            { id: 'header', label: 'Main Header' },
            { id: 'mcqs-grammar', label: 'Objective (Grammar & Book)' },
            { id: 'subjective-header', label: 'Subjective Header' },
            { id: 'short-questions-lessons', label: 'Short Questions (Lessons)' },
            { id: 'poetry-explanation', label: 'Poetry Explanation' },
            { id: 'lesson-summary', label: 'Lesson Summary (Khulasa)' },
            { id: 'letter-application', label: 'Letter OR Application' },
            { id: 'story-writing', label: 'Story Writing' },
            { id: 'translation-idiomatic', label: 'Translation (Eng-Urdu)' },
            { id: 'grammar-application', label: 'Grammar Application' }
        ],
        'religious_social': [
            { id: 'header', label: 'Main Header' },
            { id: 'mcqs-religious', label: 'Objective (MCQs)' },
            { id: 'subjective-header', label: 'Subjective Header' },
            { id: 'short-questions-religious', label: 'Short Questions' },
            { id: 'quranic-verses', label: 'Quranic Verses (Tarjama)' },
            { id: 'ahadith-translation', label: 'Ahadith Translation' },
            { id: 'thematic-long-questions', label: 'Detailed Long Questions' },
            { id: 'surah-background', label: 'Surah Background/Intro' }
        ]
    }

    const getSubjectCategory = (subject: string = "") => {
        const s = subject.toLowerCase()
        if (['physics', 'chemistry', 'biology', 'computer science'].some(sub => s.includes(sub))) return 'science'
        if (s.includes('mathematics') || s.includes('math')) return 'mathematics'
        if (['english', 'urdu'].some(sub => s.includes(sub))) return 'languages'
        if (['islamiyat', 'islamiat', 'tarjama', 'pakistan studies'].some(sub => s.includes(sub))) return 'religious_social'
        return 'science' // default
    }

    const AVAILABLE_SECTIONS = BISE_SECTIONS[getSubjectCategory(paperData?.paperInfo?.subject)] || BISE_SECTIONS.science;

    const applyStyleToSelection = (style: any) => {
        if (selectedSectionIds.length === 0) {
            toast.error("Select elements first")
            return
        }
        const newStyles = { ...sectionStyles }
        selectedSectionIds.forEach(id => {
            const currentStyle = newStyles[id] || {}
            let finalStyle = { ...style }

            // Toggle logic
            Object.keys(style).forEach(key => {
                if (key === 'fontWeight' && style[key] === 'bold' && currentStyle[key] === 'bold') {
                    finalStyle[key] = 'normal'
                } else if (key === 'fontStyle' && style[key] === 'italic' && currentStyle[key] === 'italic') {
                    finalStyle[key] = 'normal'
                } else if (key === 'textDecoration' && style[key] === 'underline' && currentStyle[key] === 'underline') {
                    finalStyle[key] = 'none'
                }
            })

            newStyles[id] = { ...currentStyle, ...finalStyle }
        })
        setSectionStyles(newStyles)
    }

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...(paperData.sectionOrder || [])]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= newOrder.length) return

        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
        setPaperData({ ...paperData, sectionOrder: newOrder })
    }

    const updateWatermark = (updates: any) => {
        setPaperData({
            ...paperData,
            watermark: { ...(paperData.watermark || {}), ...updates }
        })
    }

    const handleExportPDF = async () => {
        if (!canvasRef.current) return
        toast.promise(async () => {
            const el = canvasRef.current!
            try {
                // Apply capture-safe styles to avoid oklch/lab errors in html2canvas
                el.classList.add('pdf-capture-safe')

                const canvas = await html2canvas(el, {
                    scale: 3,
                    useCORS: true,
                    logging: true,
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
                            } catch (e) { }
                        })
                    }
                })

                // Remove capture-safe styles
                el.classList.remove('pdf-capture-safe')

                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                })

                // Smart Pagination Logic
                const avoidBreakElements = el.querySelectorAll('.page-break-inside-avoid, .section-container')
                const breakPoints: number[] = [0]
                const containerRect = el.getBoundingClientRect()

                avoidBreakElements.forEach((element) => {
                    const rect = element.getBoundingClientRect()
                    const relativeTop = rect.top - containerRect.top
                    const relativeBottom = rect.bottom - containerRect.top
                    breakPoints.push(relativeTop)
                    breakPoints.push(relativeBottom)
                })
                breakPoints.sort((a, b) => a - b)

                const canvasWidth = canvas.width
                const canvasHeight = canvas.height
                const scale = 3 // Matches html2canvas scale in paper-editor
                const pdfWidth = pdf.internal.pageSize.getWidth()
                const pdfHeight = pdf.internal.pageSize.getHeight()
                const ratio = canvasWidth / pdfWidth
                const pageHeightInCanvas = pdfHeight * ratio

                let currentY = 0
                let pageNumber = 0

                while (currentY < canvasHeight) {
                    if (pageNumber > 0) pdf.addPage()

                    let targetY = currentY + pageHeightInCanvas

                    // Find the best break point near the target
                    if (targetY < canvasHeight) {
                        const searchRange = 100 * scale
                        let bestBreak = targetY
                        let maxGap = 0

                        for (let i = 0; i < breakPoints.length - 1; i++) {
                            const gapStart = breakPoints[i] * scale
                            const gapEnd = breakPoints[i + 1] * scale
                            const gapMid = (gapStart + gapEnd) / 2

                            if (Math.abs(gapMid - targetY) < searchRange) {
                                const gapSize = gapEnd - gapStart
                                if (gapSize > maxGap) {
                                    maxGap = gapSize
                                    bestBreak = gapEnd
                                }
                            }
                        }

                        if (maxGap > 20 * scale) {
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
                        pageCtx.drawImage(canvas, 0, currentY, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight)
                        const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
                        const imgHeightOnPdf = (sliceHeight / canvasWidth) * pdfWidth
                        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, imgHeightOnPdf, undefined, 'FAST')
                    }

                    currentY += sliceHeight
                    pageNumber++
                }

                pdf.save(`${paperData?.paperInfo?.subject || 'paper'}_advanced.pdf`)
            } catch (error: any) {
                el.classList.remove('pdf-capture-safe')
                console.error("Export failure:", error)
                throw error
            }
        }, {
            loading: 'Generating Razor Sharp PDF...',
            success: 'Paper Exported!',
            error: (err: any) => `Export failed: ${err.message || 'Unknown error'}`
        })
    }

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white gap-4">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xl font-bold tracking-widest uppercase animate-pulse text-emerald-500">Initializing Paper Editor...</p>
            </div>
        )
    }

    if (!paperData) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-zinc-500 gap-4">
                <Layout size={48} className="opacity-20 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">No Paper Content Found</p>
                <Button
                    variant="ghost"
                    className="mt-4 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10"
                    onClick={() => router.back()}
                >
                    <ChevronLeft size={16} className="mr-2" /> Return to Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="h-screen w-full bg-[#111] overflow-hidden flex flex-col font-sans select-none">
            {/* Top Toolbar */}
            <header className="h-16 bg-zinc-900 mt-15 border-b border-white/5 px-6 flex items-center justify-between z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-zinc-400 hover:text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">Advanced Editor</span>
                        <h1 className="text-sm font-bold text-white truncate max-w-[200px]">
                            {paperData?.paperInfo?.subject || "Unnamed Paper"} - {paperData?.paperInfo?.class}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-800 rounded-lg p-1 mr-4 border border-white/5 shadow-inner">
                        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(50, zoom - 10))} className="h-8 w-8 text-zinc-400 hover:text-white"><ZoomOut className="w-4 h-4" /></Button>
                        <span className="text-xs font-bold text-zinc-300 w-12 text-center">{zoom}%</span>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(200, zoom + 10))} className="h-8 w-8 text-zinc-400 hover:text-white"><ZoomIn className="w-4 h-4" /></Button>
                    </div>

                    <Button
                        variant="outline"
                        className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-bold gap-2"
                        onClick={handleAIImprove}
                    >
                        <Wand2 className="w-4 h-4" />
                        AI Magic
                    </Button>

                    <Button
                        onClick={handleSave}
                        variant="secondary" className="gap-2 font-bold px-6"
                    >
                        <Save className="w-4 h-4" />
                        Save Vault
                    </Button>

                    <Button
                        onClick={handleExportPDF}
                        className="bg-white text-black hover:bg-zinc-200 gap-2 font-bold px-6"
                    >
                        <Printer className="w-4 h-4" />
                        Print Ready
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Controls */}
                <aside
                    ref={sidebarRef}
                    style={{ width: sidebarWidth }}
                    className="bg-zinc-900 border-r border-white/5 flex flex-col relative shrink-0 transition-all duration-300 ease-in-out"
                >
                    <Tabs defaultValue="typography" className="flex-1 flex flex-col">
                        <div className="px-4 pt-4 shrink-0">
                            <TabsList className="bg-zinc-800/50 w-full p-1 h-auto grid grid-cols-4 gap-1">
                                <TabsTrigger value="typography" className="data-[state=active]:bg-zinc-700 py-2"><Type className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="styles" className="data-[state=active]:bg-zinc-700 py-2"><Palette className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="layout" className="data-[state=active]:bg-zinc-700 py-2"><Layout className="w-4 h-4" /></TabsTrigger>
                                <TabsTrigger value="media" className="data-[state=active]:bg-zinc-700 py-2"><ImageIcon className="w-4 h-4" /></TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 min-h-0 relative">
                            <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                                <div className="px-4 py-6 space-y-8">
                                    <TabsContent value="typography" className="m-0 space-y-6">
                                        <section className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Text Style</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button variant="outline" className="h-10 border-white/5 bg-zinc-800/50" onClick={() => applyStyleToSelection({ fontWeight: 'bold' })}>
                                                    <Bold className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" className="h-10 border-white/5 bg-zinc-800/50" onClick={() => applyStyleToSelection({ fontStyle: 'italic' })}>
                                                    <Italic className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" className="h-10 border-white/5 bg-zinc-800/50" onClick={() => applyStyleToSelection({ textDecoration: 'underline' })}>
                                                    <Underline className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Language Mode</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="h-10 border-white/5 bg-zinc-800/50 text-[10px] font-bold uppercase gap-2 hover:border-blue-500/50"
                                                    onClick={() => applyStyleToSelection({
                                                        fontFamily: 'inherit',
                                                        textAlign: 'left',
                                                        direction: 'ltr',
                                                        displayLanguage: 'en'
                                                    })}
                                                >
                                                    <Languages className="w-3 h-3" /> EN
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="h-10 border-white/5 bg-zinc-800/50 text-[10px] font-bold uppercase gap-2 hover:border-emerald-500/50 font-urdu"
                                                    onClick={() => applyStyleToSelection({
                                                        fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif",
                                                        textAlign: 'right',
                                                        direction: 'rtl',
                                                        displayLanguage: 'ur'
                                                    })}
                                                >
                                                    <Languages className="w-3 h-3" /> اردو
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="h-10 border-white/5 bg-zinc-800/50 text-[10px] font-bold uppercase hover:border-amber-500/50"
                                                    onClick={() => applyStyleToSelection({
                                                        displayLanguage: 'both'
                                                    })}
                                                >
                                                    Both
                                                </Button>
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Font Family</Label>
                                            <Select
                                                onValueChange={(v) => applyStyleToSelection({ fontFamily: v })}
                                            >
                                                <SelectTrigger className="bg-zinc-800/50 border-white/5 h-10">
                                                    <SelectValue placeholder="Select Font" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="inherit font-sans">Default Sans</SelectItem>
                                                    <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                                                    <SelectItem value="'Inter', sans-serif">Inter Sans</SelectItem>
                                                    <SelectItem value="'Fira Code', monospace">Fira Code Mono</SelectItem>
                                                    <SelectItem value="'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif">Nastaliq Urdu</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Alignment</Label>
                                            <div className="flex gap-2">
                                                <Button variant="outline" className="flex-1 h-10 border-white/5 bg-zinc-800/50" onClick={() => applyStyleToSelection({ textAlign: 'left' })}><AlignLeft className="w-4 h-4" /></Button>
                                                <Button variant="outline" className="flex-1 h-10 border-white/5 bg-zinc-800/50" onClick={() => applyStyleToSelection({ textAlign: 'center' })}><AlignCenter className="w-4 h-4" /></Button>
                                                <Button variant="outline" className="flex-1 h-10 border-white/5 bg-zinc-800/50" onClick={() => applyStyleToSelection({ textAlign: 'right' })}><AlignRight className="w-4 h-4" /></Button>
                                                <Button variant="outline" className="flex-1 h-10 border-white/5 bg-zinc-800/50" onClick={() => applyStyleToSelection({ textAlign: 'justify' })}><AlignJustify className="w-4 h-4" /></Button>
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Font Size</Label>
                                                <span className="text-[10px] font-black text-emerald-500">{(sectionStyles[selectedSectionIds[0]] as any)?.fontSize || '16'}PX</span>
                                            </div>
                                            <Slider
                                                defaultValue={[16]}
                                                max={72}
                                                min={8}
                                                step={1}
                                                onValueChange={(v) => applyStyleToSelection({ fontSize: `${Array.isArray(v) ? v[0] : v}px` })}
                                            />
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Line Height</Label>
                                                <span className="text-[10px] font-black text-emerald-500">RATIO</span>
                                            </div>
                                            <Slider
                                                defaultValue={[1.5]}
                                                max={3}
                                                min={1}
                                                step={0.1}
                                                onValueChange={(v) => applyStyleToSelection({ lineHeight: Array.isArray(v) ? v[0] : v })}
                                            />
                                        </section>

                                        <section className="space-y-6 pt-4 border-t border-white/5">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Letter Spacing</Label>
                                                    <span className="text-[10px] font-black text-emerald-500">PX</span>
                                                </div>
                                                <Slider
                                                    defaultValue={[0]}
                                                    max={10}
                                                    min={-2}
                                                    step={0.1}
                                                    onValueChange={(v) => applyStyleToSelection({ letterSpacing: `${Array.isArray(v) ? v[0] : v}px` })}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Word Spacing</Label>
                                                    <span className="text-[10px] font-black text-emerald-500">PX</span>
                                                </div>
                                                <Slider
                                                    defaultValue={[0]}
                                                    max={20}
                                                    min={0}
                                                    step={1}
                                                    onValueChange={(v) => applyStyleToSelection({ wordSpacing: `${Array.isArray(v) ? v[0] : v}px` })}
                                                />
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic block mb-2">Paddings (Granular)</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] text-zinc-500 uppercase">Top</Label>
                                                    <Input type="number" className="h-8 bg-zinc-800/50 border-white/5 text-xs"
                                                        onChange={(e) => applyStyleToSelection({ paddingTop: `${e.target.value}px` })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] text-zinc-500 uppercase">Bottom</Label>
                                                    <Input type="number" className="h-8 bg-zinc-800/50 border-white/5 text-xs"
                                                        onChange={(e) => applyStyleToSelection({ paddingBottom: `${e.target.value}px` })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] text-zinc-500 uppercase">Left</Label>
                                                    <Input type="number" className="h-8 bg-zinc-800/50 border-white/5 text-xs"
                                                        onChange={(e) => applyStyleToSelection({ paddingLeft: `${e.target.value}px` })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] text-zinc-500 uppercase">Right</Label>
                                                    <Input type="number" className="h-8 bg-zinc-800/50 border-white/5 text-xs"
                                                        onChange={(e) => applyStyleToSelection({ paddingRight: `${e.target.value}px` })} />
                                                </div>
                                            </div>
                                        </section>
                                    </TabsContent>

                                    <TabsContent value="styles" className="m-0 space-y-6">
                                        <section className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Global Theme</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['modern', 'royal', 'classic', 'minimal'].map(theme => (
                                                    <Button
                                                        key={theme}
                                                        variant="outline"
                                                        className={cn(
                                                            "h-16 border-white/5 bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest flex flex-col gap-1",
                                                            paperData.currentTheme === theme && "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                                                        )}
                                                        onClick={() => setPaperData({ ...paperData, currentTheme: theme })}
                                                    >
                                                        <div className={cn("w-6 h-1 rounded-full",
                                                            theme === 'modern' ? "bg-emerald-500" :
                                                                theme === 'royal' ? "bg-amber-500" :
                                                                    theme === 'classic' ? "bg-zinc-400" : "bg-white"
                                                        )} />
                                                        {theme}
                                                    </Button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Text Color</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {['#000000', '#18181b', '#059669', '#2563eb', '#dc2626', '#d97706'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => applyStyleToSelection({ color })}
                                                        className="w-8 h-8 rounded-full border border-white/10"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                                <Input
                                                    type="color"
                                                    className="w-8 h-8 p-0 border-none bg-transparent"
                                                    onChange={(e) => applyStyleToSelection({ color: e.target.value })}
                                                />
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Opacity</Label>
                                            <Slider
                                                defaultValue={[1]}
                                                max={1}
                                                min={0}
                                                step={0.1}
                                                onValueChange={(v) => applyStyleToSelection({ opacity: Array.isArray(v) ? v[0] : v })}
                                            />
                                        </section>
                                    </TabsContent>

                                    <TabsContent value="layout" className="m-0 space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center block">Page & Layout</Label>
                                        <Slider
                                            defaultValue={[0]}
                                            max={100}
                                            min={0}
                                            step={4}
                                            onValueChange={(v) => applyStyleToSelection({ marginBottom: `${Array.isArray(v) ? v[0] : v}px` })}
                                        />

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Advanced Paper Modes</Label>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Math Mode (Katex)</span>
                                                            <span className="text-[9px] text-zinc-500">Render $...$ as equations</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant={paperData.layout?.mathMode ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 text-[10px] px-3 transition-all",
                                                            paperData.layout?.mathMode ? "bg-emerald-500 text-white" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                                                        )}
                                                        onClick={() => setPaperData({
                                                            ...paperData,
                                                            layout: { ...paperData.layout, mathMode: !paperData.layout?.mathMode }
                                                        })}
                                                    >
                                                        {paperData.layout?.mathMode ? "ENABLED" : "DISABLED"}
                                                    </Button>
                                                </div>

                                                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Languages className="w-4 h-4 text-blue-500" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Side-by-Side Bilingual</span>
                                                            <span className="text-[9px] text-zinc-500">Dual column display</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant={paperData.layout?.bilingualMode === 'sideBySide' ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 text-[10px] px-3 transition-all",
                                                            paperData.layout?.bilingualMode === 'sideBySide' ? "bg-emerald-500 text-white" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                                                        )}
                                                        onClick={() => setPaperData({
                                                            ...paperData,
                                                            layout: { ...paperData.layout, bilingualMode: paperData.layout?.bilingualMode === 'sideBySide' ? 'stacked' : 'sideBySide' }
                                                        })}
                                                    >
                                                        {paperData.layout?.bilingualMode === 'sideBySide' ? "ENABLED" : "DISABLED"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className={cn("flex-1 h-12 font-bold", showGrid ? "border-emerald-500/50 text-emerald-500" : "border-white/5 text-zinc-400")}
                                                    onClick={() => setShowGrid(!showGrid)}
                                                >
                                                    <Grid3x3 className="w-4 h-4 mr-2" /> Grid
                                                </Button>
                                                <Button variant="outline" className="flex-1 h-12 border-white/5 text-zinc-400 font-bold">
                                                    <RotateCcw className="w-4 h-4 mr-2" /> Reset
                                                </Button>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 space-y-4">
                                                <Label className="text-[10px] font-black text-zinc-500 uppercase">Section Management</Label>
                                                <div className="space-y-2">
                                                    <div className="space-y-2">
                                                        {(paperData?.sectionOrder || []).map((key: string, idx: number) => (
                                                            <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex flex-col gap-1">
                                                                        <button onClick={() => moveSection(idx, 'up')} className="p-0.5 hover:text-emerald-500 disabled:opacity-30" disabled={idx === 0}><ArrowUp className="w-3 h-3" /></button>
                                                                        <button onClick={() => moveSection(idx, 'down')} className="p-0.5 hover:text-emerald-500 disabled:opacity-30" disabled={idx === (paperData.sectionOrder?.length || 0) - 1}><ArrowDown className="w-3 h-3" /></button>
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{key.replace(/-/g, ' ')}</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-zinc-500 hover:text-red-500"
                                                                    onClick={() => deleteSection(key)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Add Section Area */}
                                                    <div className="pt-4 mt-4 border-t border-white/5">
                                                        <Label className="text-[10px] font-black text-zinc-500 uppercase mb-2 block">Available Sections</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {AVAILABLE_SECTIONS.filter(s => !paperData.sectionOrder?.includes(s.id)).map(section => (
                                                                <Button
                                                                    key={section.id}
                                                                    variant="outline"
                                                                    className="justify-between border-dashed border-zinc-700 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/10"
                                                                    onClick={() => addSection(section.id)}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">{section.label}</span>
                                                                    <span className="text-xs">+</span>
                                                                </Button>
                                                            ))}
                                                            {AVAILABLE_SECTIONS.filter(s => !paperData.sectionOrder?.includes(s.id)).length === 0 && (
                                                                <p className="text-[10px] text-zinc-600 italic text-center py-2">All sections are active</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="media" className="m-0 space-y-6">
                                        <section className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Watermark</Label>
                                            <Input
                                                placeholder="Enter watermark text..."
                                                className="bg-zinc-800/50 border-white/5 h-10 text-xs font-bold"
                                                value={paperData.watermark?.text || ''}
                                                onChange={(e) => updateWatermark({ text: e.target.value, image: null })}
                                            />

                                            <div className="pt-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Or Upload Image</Label>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-dashed border-zinc-700 bg-zinc-800/30 h-10 text-[10px] font-bold uppercase gap-2 hover:border-emerald-500"
                                                        onClick={() => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'image/*';
                                                            input.onchange = (e: any) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (re => {
                                                                        updateWatermark({ image: re.target?.result as string, text: '' });
                                                                    });
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            };
                                                            input.click();
                                                        }}
                                                    >
                                                        <Upload className="w-3 h-3" /> Upload Watermark
                                                    </Button>
                                                    {paperData.watermark?.image && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 text-red-500 hover:bg-red-500/10"
                                                            onClick={() => updateWatermark({ image: null })}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-6 mt-4 pt-4 border-t border-white/5">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <Layers className="w-3 h-3 text-emerald-500" />
                                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Z-Index (Depth)</Label>
                                                        </div>
                                                        <span className="text-[10px] font-black text-emerald-500">{paperData.watermark?.zIndex || 0}</span>
                                                    </div>
                                                    <Slider
                                                        value={[paperData.watermark?.zIndex || 0]}
                                                        max={100} min={-10} step={1}
                                                        onValueChange={(v) => updateWatermark({ zIndex: Array.isArray(v) ? v[0] : v })}
                                                    />
                                                    <p className="text-[9px] text-zinc-600 italic">Use negative values to place behind content.</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <Shrink className="w-3 h-3 text-emerald-500" />
                                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Scale</Label>
                                                        </div>
                                                        <span className="text-[10px] font-black text-emerald-500">{paperData.watermark?.scale || 1}x</span>
                                                    </div>
                                                    <Slider
                                                        value={[paperData.watermark?.scale || 1]}
                                                        max={5} min={0.1} step={0.1}
                                                        onValueChange={(v) => updateWatermark({ scale: Array.isArray(v) ? v[0] : v })}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-[9px] font-black text-zinc-500 uppercase">Opacity</Label>
                                                        <Slider
                                                            value={[paperData.watermark?.opacity || 0.1]}
                                                            max={1} min={0} step={0.05}
                                                            onValueChange={(v) => updateWatermark({ opacity: Array.isArray(v) ? v[0] : v })}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[9px] font-black text-zinc-500 uppercase">Rotation</Label>
                                                        <Slider
                                                            value={[paperData.watermark?.rotation || -45]}
                                                            max={180} min={-180} step={5}
                                                            onValueChange={(v) => updateWatermark({ rotation: Array.isArray(v) ? v[0] : v })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <MoveHorizontal className="w-3 h-3 text-zinc-500" />
                                                            <Label className="text-[9px] font-black text-zinc-500 uppercase">H-Offset</Label>
                                                        </div>
                                                        <Slider
                                                            value={[paperData.watermark?.hOffset || 0]}
                                                            max={500} min={-500} step={10}
                                                            onValueChange={(v) => updateWatermark({ hOffset: Array.isArray(v) ? v[0] : v })}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <MoveVertical className="w-3 h-3 text-zinc-500" />
                                                            <Label className="text-[9px] font-black text-zinc-500 uppercase">V-Offset</Label>
                                                        </div>
                                                        <Slider
                                                            value={[paperData.watermark?.vOffset || 0]}
                                                            max={500} min={-500} step={10}
                                                            onValueChange={(v) => updateWatermark({ vOffset: Array.isArray(v) ? v[0] : v })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        className={cn("flex-1 text-[9px] font-black uppercase h-8 border-white/5", paperData.watermark?.grayscale && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}
                                                        onClick={() => updateWatermark({ grayscale: !paperData.watermark?.grayscale })}
                                                    >
                                                        Grayscale
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className={cn("flex-1 text-[9px] font-black uppercase h-8 border-white/5", paperData.watermark?.invert && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}
                                                        onClick={() => updateWatermark({ invert: !paperData.watermark?.invert })}
                                                    >
                                                        Invert
                                                    </Button>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4 border-t border-white/5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Institution Logo</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['left', 'center', 'right'].map(pos => (
                                                    <Button
                                                        key={pos}
                                                        variant="outline"
                                                        className={cn(
                                                            "h-10 border-white/5 bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest",
                                                            paperData.logo?.position === pos && "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
                                                        )}
                                                        onClick={() => setPaperData({ ...paperData, logo: { ...(paperData.logo || {}), position: pos } })}
                                                    >
                                                        {pos}
                                                    </Button>
                                                ))}
                                            </div>
                                            <Button variant="outline" className="w-full border-dashed border-zinc-700 bg-transparent text-zinc-500 hover:text-white hover:border-zinc-500 h-20 flex flex-col gap-2">
                                                <ImageIcon className="w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Upload Custom Logo</span>
                                            </Button>
                                        </section>
                                    </TabsContent>
                                </div>
                            </div>
                        </div>

                        {/* Selected Elements Info */}
                        {selectedSectionIds.length > 0 && (
                            <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20">
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Active Selection</span>
                                    <span className="text-xl font-black text-white">{selectedSectionIds.length}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="flex-1 text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white" onClick={() => setSelectedSectionIds([])}>Clear</Button>
                                    <Button size="sm" variant="ghost" className="flex-1 text-[10px] uppercase font-black tracking-widest text-red-500 hover:bg-red-500 hover:text-white" onClick={() => {
                                        toast.info("Delete section logic coming soon")
                                    }}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                                </div>
                            </div>
                        )}
                    </Tabs>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={() => setIsResizing(true)}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/50 transition-colors z-50 group"
                    >
                        <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-4 h-8 bg-zinc-800 border border-white/5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <GripVertical className="w-3 h-3 text-zinc-500" />
                        </div>
                    </div>
                </aside>
                {/* Main Workspace */}
                <main className="flex-1 bg-[#151515] overflow-auto relative custom-scrollbar p-20 flex flex-col items-center">
                    <div
                        ref={canvasRef}
                        className="transition-transform duration-500 ease-out origin-top shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)]"
                        style={{ transform: `scale(${zoom / 100})` }}
                    >
                        <div className="relative">
                            {/* Grid Overlay */}
                            {showGrid && (
                                <div className="absolute inset-x-[-100px] inset-y-[-100px] pointer-events-none z-100 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px]" />
                            )}

                            {paperData && (
                                <PaperRenderer
                                    paperData={paperData}
                                    selectedSectionIds={selectedSectionIds}
                                    onSectionClick={handleSectionClick}
                                    onAIAction={handleAIAction}
                                    sectionStyles={sectionStyles}
                                    isEditing={true}
                                    setPaperData={setPaperData}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <AISectionPromptModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onGenerate={handleAIGenerated}
                section={activeSectionAI}
                context={paperData?.paperInfo?.subject || "General"}
            />

            <ScholarPanel
                isOpen={isScholarOpen}
                onClose={() => setIsScholarOpen(false)}
                onExport={handleExportPDF}
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
                
                @media print {
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    )
}

export default function PaperEditorPage() {
    return (
        <Suspense fallback={<div>Loading Editor...</div>}>
            <PaperEditorContent />
        </Suspense>
    )
}
