"use client"

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Printer, Save, ChevronLeft, ZoomIn, ZoomOut, Grid3x3, Languages,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
    Type, Palette, Box, Maximize2, GripVertical, BookOpen, Code, Wand2,
    ArrowUp,
    ArrowDown,
    QrCode,
    Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { storage } from '@/lib/firebase'
import { uploadFiles } from '@/lib/uploadthing'
import { ScholarPanel } from '@/components/scholar/ScholarPanel'
import { PaperRenderer } from '@/components/PaperRenderer'
import { AISectionPromptModal } from '@/components/AISectionPromptModal'

function ArchitectStudioContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const paperId = searchParams.get('id')
    const { user } = useAuth()

    const [paperData, setPaperData] = useState<any>(null)
    const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
    const [sectionStyles, setSectionStyles] = useState<Record<string, any>>({})
    const [zoom, setZoom] = useState(100)
    const [showGrid, setShowGrid] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(450)
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

            // Priority 1: Load from ID (DB)
            if (paperId && user) {
                try {
                    const token = await user.getIdToken()
                    const res = await fetch(`/api/admin/exams/${paperId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    const data = await res.json()

                    if (data.success) {
                        const content = data.exam.content
                        setPaperData({
                            ...content,
                            floatingElements: content.floatingElements || [],
                            currentTheme: content.currentTheme || 'modern'
                        })
                        setSectionStyles({})
                        toast.success("Loaded from Secure Vault")
                        setIsLoading(false)
                        return
                    } else {
                        toast.error(data.message || "Failed to load from vault")
                    }
                } catch (e) {
                    console.error("Fetch error:", e)
                    toast.error("Secure connection failed")
                }
            }

            // Priority 2: Fallback to localStorage (Legacy/Backup)
            const localData = localStorage.getItem('architect_payload')
            if (localData && !paperId) {
                try {
                    const parsed = JSON.parse(localData)
                    setPaperData({
                        ...parsed,
                        floatingElements: parsed.floatingElements || [],
                        currentTheme: parsed.currentTheme || 'modern'
                    })
                    setSectionStyles({})
                    toast.info("Loaded from Local Session")
                } catch (e) {
                    toast.error("Failed to load local data")
                }
            } else if (!paperId) {
                toast.error("No paper identifier found")
            }

            setIsLoading(false)
        }

        loadData()
    }, [paperId, user])

    // Resizable sidebar logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            const newWidth = e.clientX
            if (newWidth >= 350 && newWidth <= 700) {
                setSidebarWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    const currentStyle = sectionStyles[selectedSectionIds[0]] || {}

    const updateStyle = (updates: any) => {
        if (selectedSectionIds.length === 0) return
        setSectionStyles(prev => {
            const next = { ...prev }
            selectedSectionIds.forEach(id => {
                next[id] = { ...prev[id], ...updates }
            })
            return next
        })
    }

    const onSectionClick = (id: string, e: React.MouseEvent) => {
        if (e.shiftKey) {
            setSelectedSectionIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            )
        } else {
            setSelectedSectionIds([id])
        }
    }

    const handleMoveSection = (direction: 'up' | 'down', sectionId: string) => {
        const currentOrder = paperData.sectionOrder || ['header', 'mcqs', 'subjective-header', 'short-questions', 'english-special-sections', 'urdu-special-sections', 'long-questions']
        const index = currentOrder.indexOf(sectionId)
        if (index === -1) return

        const newOrder = [...currentOrder]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex >= 0 && targetIndex < currentOrder.length) {
            [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
            setPaperData({ ...paperData, sectionOrder: newOrder })
            toast.success(`Moved ${sectionId.replace('-', ' ')} ${direction}`)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark') => {
        const file = e.target.files?.[0]
        if (!file) return

        const toastId = toast.loading(`Uploading ${type}...`)
        try {
            // Upload using Uploadthing
            const res = await uploadFiles("vaultUploader", {
                files: [file],
            });

            if (res && res[0]) {
                const downloadURL = res[0].url
                if (type === 'logo') {
                    setPaperData({ ...paperData, logo: { ...paperData.logo, url: downloadURL } })
                    toast.success("Logo Uploaded to Cloud", { id: toastId })
                } else {
                    setPaperData({ ...paperData, watermark: { ...paperData.watermark, image: downloadURL, text: '' } })
                    toast.success("Watermark Uploaded to Cloud", { id: toastId })
                }
            }
        } catch (error) {
            console.error("Upload failed", error)
            toast.error("Upload failed. Using local fallback...", { id: toastId })

            // Final fallback
            const reader = new FileReader()
            reader.onload = (event) => {
                const base64 = event.target?.result as string
                if (type === 'logo') {
                    setPaperData({ ...paperData, logo: { ...paperData.logo, url: base64 } })
                } else {
                    setPaperData({ ...paperData, watermark: { ...paperData.watermark, image: base64, text: '' } })
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAIGenerated = (data: any, action: 'ADD_CONTENT' | 'REPLACE_CONTENT' | 'IMPROVE_CONTENT') => {
        if (!activeSectionAI || !paperData) return

        const newPaperData = { ...paperData }
        const { type } = activeSectionAI

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
            // Header or Title or specific text block
            const targetId = activeSectionAI.id
            if (targetId.includes('header_')) {
                const key = targetId.replace('header_', '')
                newPaperData.headerDetails = { ...newPaperData.headerDetails, [key]: data.improvedText || data }
            } else if (targetId === 'subj_title') {
                newPaperData.headerDetails = { ...newPaperData.headerDetails, part2Title: data.improvedText || data }
            }
        }

        setPaperData(newPaperData)
        setIsAIModalOpen(false)
        setActiveSectionAI(null)
        toast.success("Magic Action Complete!")
    }

    const handleAIAction = (id: string, type: string, title: string, content: any) => {
        setActiveSectionAI({ id, type, title, content: content || paperData })
        setIsAIModalOpen(true)
    }

    const handleAIImprove = async () => {
        if (selectedSectionIds.length === 0) {
            toast.error("Select a section first")
            return
        }

        // Use the first selected section for AI context
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
        }

        handleAIAction(sectionId, sectionType, sectionTitle, sectionContent)
    }

    const handleExportPDF = async () => {
        if (!canvasRef.current) return
        const toastId = toast.loading("Preparing High-Quality PDF...");

        try {
            await document.fonts.ready;

            const el = canvasRef.current;
            el.classList.add('pdf-capture-safe');

            const theme = sectionStyles.page?.theme || 'clean';
            const pageSize = sectionStyles.page?.size || 'a4';

            // Higher scale for razor sharp text (4x)
            const canvas = await html2canvas(el, {
                scale: 4,
                useCORS: true,
                logging: false,
                backgroundColor: theme === 'vintage' ? '#fdf6e3' : '#ffffff',
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
                            if (hasBadColor(style.backgroundColor)) el.style.setProperty('background-color', theme === 'vintage' ? '#fdf6e3' : '#ffffff', 'important')
                            if (hasBadColor(style.borderColor)) el.style.setProperty('border-color', '#000000', 'important')
                            if (hasBadColor(style.fill)) el.style.setProperty('fill', '#000000', 'important')
                            if (hasBadColor(style.stroke)) el.style.setProperty('stroke', '#000000', 'important')
                            if (hasBadColor(style.boxShadow)) el.style.setProperty('box-shadow', 'none', 'important')
                            if (hasBadColor(style.textShadow)) el.style.setProperty('text-shadow', 'none', 'important')
                        } catch (e) { }
                    })
                }
            });

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: pageSize === 'letter' ? 'letter' : 'a4',
                compress: true
            });

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

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            const canvasWidth = canvas.width
            const canvasHeight = canvas.height
            const scale = 4 // Matches html2canvas scale
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

            pdf.save(`Paper_${paperData.paperInfo.subject}_${Date.now()}.pdf`);
            el.classList.remove('pdf-capture-safe');
            toast.success("PDF Exported Successfully", { id: toastId });
        } catch (error) {
            canvasRef.current?.classList.remove('pdf-capture-safe');
            toast.error("Export Failed", { id: toastId });
            console.error(error);
        }
    }

    const handleSaveJSON = () => {
        const payload = {
            paperData,
            sectionStyles,
            zoom,
            exportDate: new Date().toISOString(),
            version: '3.0.0'
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Exam_Project_${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Project Saved")
    }

    if (isLoading || !paperData) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <div className="text-zinc-500 text-xs font-black uppercase tracking-widest">Accessing Secure Vault...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-full bg-[#0a0a0a] text-zinc-300 flex overflow-hidden font-sans select-none">
            {/* LEFT CONTROL PANEL - RESIZABLE */}
            <div
                ref={sidebarRef}
                className="border-r border-white/5 flex flex-col bg-[#0d0d0d] shadow-2xl relative z-20 min-w-[320px] max-w-[50vw]"
                style={{ width: `${sidebarWidth}px` }}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black">
                            <Maximize2 size={18} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-widest">BISE Paper Architect</h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Professional Editor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsScholarOpen(!isScholarOpen)}
                            className={cn("text-zinc-500 hover:text-white", isScholarOpen && "bg-emerald-500/10 text-emerald-400")}
                            title="Scholar Tools"
                        >
                            <BookOpen size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="text-zinc-500 hover:text-white"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="typography" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-6 bg-[#121212] border-b border-white/5 rounded-none h-12 text-[9px] uppercase font-bold">
                        <TabsTrigger value="typography" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            Text
                        </TabsTrigger>
                        <TabsTrigger value="colors" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            Styles
                        </TabsTrigger>
                        <TabsTrigger value="assets" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            Media
                        </TabsTrigger>
                        <TabsTrigger value="spacing" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            Layout
                        </TabsTrigger>
                        <TabsTrigger value="creative" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            Creative
                        </TabsTrigger>
                        <TabsTrigger value="layout" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            Setup
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {selectedSectionIds.length === 0 && (
                            <div className="p-6 text-center text-zinc-500">
                                <Type size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm">Click on any section in the paper to start editing</p>
                                <p className="text-[10px] mt-2 text-zinc-600 uppercase">Pro Tip: Use Shift+Click to select multiple elements</p>
                            </div>
                        )}

                        {selectedSectionIds.length > 0 && (
                            <>
                                <TabsContent value="typography" className="p-6 m-0 space-y-6">
                                    <div className="space-y-4">
                                        {/* Font Size */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Font Size</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.fontSize || 14}px
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseInt(currentStyle.fontSize) || 14]}
                                                max={72} min={6} step={1}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ fontSize: `${Array.isArray(val) ? val[0] : val}px` })}
                                            />
                                        </div>

                                        {/* Font Weight */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Text Thickness</Label>
                                            <Select value={currentStyle.fontWeight || 'normal'} onValueChange={(val) => updateStyle({ fontWeight: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="100">Thin (100)</SelectItem>
                                                    <SelectItem value="200">Extra Light (200)</SelectItem>
                                                    <SelectItem value="300">Light (300)</SelectItem>
                                                    <SelectItem value="normal">Normal (400)</SelectItem>
                                                    <SelectItem value="500">Medium (500)</SelectItem>
                                                    <SelectItem value="600">Semi Bold (600)</SelectItem>
                                                    <SelectItem value="bold">Bold (700)</SelectItem>
                                                    <SelectItem value="800">Extra Bold (800)</SelectItem>
                                                    <SelectItem value="900">Black (900)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Font Family Selection */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Main Font (English)</Label>
                                            <Select value={currentStyle.fontFamily || "'Times New Roman', Times, serif"} onValueChange={(val) => updateStyle({ fontFamily: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                                                    <SelectItem value="'Inter', sans-serif">Inter (Modern)</SelectItem>
                                                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                                                    <SelectItem value="'Calibri', sans-serif">Calibri</SelectItem>
                                                    <SelectItem value="system-ui, sans-serif">System Sans</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Urdu Font Style</Label>
                                            <Select value={(paperData as any).layout?.urduFont || "'Jameel Noori Nastaleeq', 'Nastaleeq', serif"} onValueChange={(val) => setPaperData({ ...paperData, layout: { ...(paperData as any).layout, urduFont: val } })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="'Jameel Noori Nastaleeq', 'Nastaleeq', serif">Jameel Noori</SelectItem>
                                                    <SelectItem value="'Urdu Typesetting', serif">Urdu Typesetting</SelectItem>
                                                    <SelectItem value="'Noto Nastaliq Urdu', serif">Noto Nastaliq</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <hr className="border-white/5" />

                                        {/* Font Style */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Font Style</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => updateStyle({ fontStyle: currentStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                                    className={cn("h-10 bg-white/5 border-white/5", currentStyle.fontStyle === 'italic' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}
                                                >
                                                    <Italic size={14} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => updateStyle({ textDecoration: currentStyle.textDecoration === 'underline' ? 'none' : 'underline' })}
                                                    className={cn("h-10 bg-white/5 border-white/5", currentStyle.textDecoration === 'underline' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}
                                                >
                                                    <Underline size={14} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => updateStyle({ textDecoration: currentStyle.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                                                    className={cn("h-10 bg-white/5 border-white/5", currentStyle.textDecoration === 'line-through' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}
                                                >
                                                    <span className="line-through">S</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Line Height */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Row Spacing</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.lineHeight || 1.5}
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseFloat(currentStyle.lineHeight) || 1.5]}
                                                max={4} min={0.5} step={0.1}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ lineHeight: Array.isArray(val) ? val[0] : val })}
                                            />
                                        </div>

                                        {/* Letter Spacing */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Character Gap</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.letterSpacing || 0}px
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseFloat(currentStyle.letterSpacing) || 0]}
                                                min={-5} max={20} step={0.5}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ letterSpacing: `${Array.isArray(val) ? val[0] : val}px` })}
                                            />
                                        </div>

                                        {/* Text Transform */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Text Transform</Label>
                                            <Select value={currentStyle.textTransform || 'none'} onValueChange={(val) => updateStyle({ textTransform: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="uppercase">UPPERCASE</SelectItem>
                                                    <SelectItem value="lowercase">lowercase</SelectItem>
                                                    <SelectItem value="capitalize">Capitalize</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Text Alignment */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Text Alignment</Label>
                                            <div className="grid grid-cols-4 gap-2">
                                                <Button variant="outline" onClick={() => updateStyle({ textAlign: 'left' })} className={cn("h-10 bg-white/5 border-white/5", currentStyle.textAlign === 'left' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}><AlignLeft size={14} /></Button>
                                                <Button variant="outline" onClick={() => updateStyle({ textAlign: 'center' })} className={cn("h-10 bg-white/5 border-white/5", currentStyle.textAlign === 'center' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}><AlignCenter size={14} /></Button>
                                                <Button variant="outline" onClick={() => updateStyle({ textAlign: 'right' })} className={cn("h-10 bg-white/5 border-white/5", currentStyle.textAlign === 'right' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}><AlignRight size={14} /></Button>
                                                <Button variant="outline" onClick={() => updateStyle({ textAlign: 'justify' })} className={cn("h-10 bg-white/5 border-white/5", currentStyle.textAlign === 'justify' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}><AlignJustify size={14} /></Button>
                                            </div>
                                        </div>

                                        <hr className="border-white/5" />

                                        {/* AI Magic Improve */}
                                        <Button
                                            className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-12 rounded-xl border border-white/10 shadow-lg shadow-purple-500/20"
                                            onClick={async () => {
                                                const toastId = toast.loading("AI is thinking...");
                                                // Simulated AI Rephrase
                                                setTimeout(() => {
                                                    toast.success("Magic Improved!", { id: toastId });
                                                    // In a real app, we'd call an API here
                                                    // For now, let's just uppercase it as a "change"
                                                    // updateStyle({ textTransform: 'uppercase' }); 
                                                }, 1500);
                                            }}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Maximize2 size={16} /> Magic Improve (AI)
                                            </span>
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="colors" className="p-6 m-0 space-y-6">
                                    <div className="space-y-4">
                                        {/* Text Color */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Text Color</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="color"
                                                    value={currentStyle.color || '#000000'}
                                                    onChange={(e) => updateStyle({ color: e.target.value })}
                                                    className="w-16 h-10 p-1 bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="text"
                                                    value={currentStyle.color || '#000000'}
                                                    onChange={(e) => updateStyle({ color: e.target.value })}
                                                    className="flex-1 bg-white/5 border-white/10"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>

                                        {/* Background Color */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Background Color</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="color"
                                                    value={currentStyle.backgroundColor || '#ffffff'}
                                                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                                                    className="w-16 h-10 p-1 bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="text"
                                                    value={currentStyle.backgroundColor || '#ffffff'}
                                                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                                                    className="flex-1 bg-white/5 border-white/10"
                                                    placeholder="#ffffff"
                                                />
                                            </div>
                                        </div>

                                        {/* Border Color */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Border Color</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="color"
                                                    value={currentStyle.borderColor || '#000000'}
                                                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                                                    className="w-16 h-10 p-1 bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="text"
                                                    value={currentStyle.borderColor || '#000000'}
                                                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                                                    className="flex-1 bg-white/5 border-white/10"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>

                                        {/* Opacity */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Opacity</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {Math.round((parseFloat(currentStyle.opacity) || 1) * 100)}%
                                                </span>
                                            </div>
                                            <Slider
                                                value={[(parseFloat(currentStyle.opacity) || 1) * 100]}
                                                max={100} min={0} step={1}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ opacity: (Array.isArray(val) ? val[0] : val) / 100 })}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="assets" className="p-6 m-0 space-y-8">
                                    <div className="space-y-6">
                                        {/* School Logo */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                                <Box size={16} className="text-emerald-500" />
                                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">School Branding</span>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Logo Image URL</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="https://example.com/logo.png"
                                                        value={paperData.logo?.url || ""}
                                                        onChange={(e) => setPaperData({ ...paperData, logo: { ...paperData.logo, url: e.target.value } })}
                                                        className="bg-zinc-900 border-white/10 flex-1"
                                                    />
                                                    <div className="relative">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileUpload(e, 'logo')}
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-[40px]"
                                                        />
                                                        <Button variant="outline" size="icon" className="w-[40px] h-10 bg-zinc-900 border-white/10">
                                                            <Save size={14} className="rotate-90" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Logo Size (px)</Label>
                                                <Slider
                                                    value={[paperData.logo?.size || 100]}
                                                    max={300} min={20} step={2}
                                                    onValueChange={(val: number | readonly number[]) => setPaperData({ ...paperData, logo: { ...paperData.logo, size: Array.isArray(val) ? val[0] : val } })}
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Image Fit</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['contain', 'cover'].map((fit) => (
                                                        <Button
                                                            key={fit}
                                                            variant="outline"
                                                            onClick={() => setPaperData({ ...paperData, logo: { ...paperData.logo, fit: fit } })}
                                                            className={cn("h-10 bg-white/5 border-white/5 text-[10px] uppercase font-bold", (paperData.logo?.fit || 'contain') === fit && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}
                                                        >{fit}</Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-white/5" />

                                        {/* Watermark */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                                <Type size={16} className="text-emerald-500" />
                                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Watermark Settings</span>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Watermark Text</Label>
                                                <Input
                                                    placeholder="CONFIDENTIAL"
                                                    value={paperData.watermark?.text || ""}
                                                    onChange={(e) => setPaperData({ ...paperData, watermark: { ...paperData.watermark, text: e.target.value } })}
                                                    className="bg-zinc-900 border-white/10"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Or Watermark Image</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'watermark')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer h-10"
                                                    />
                                                    <Button variant="outline" className="w-full bg-zinc-900 border-white/10 text-[10px] uppercase font-bold h-10">
                                                        Upload Watermark Image
                                                    </Button>
                                                </div>
                                                {paperData.watermark?.image && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPaperData({ ...paperData, watermark: { ...paperData.watermark, image: '' } })}
                                                        className="w-full text-[9px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                        Remove Image Watermark
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Opacity</Label>
                                                    <span className="text-[10px] text-emerald-500 font-mono">{Math.round((paperData.watermark?.opacity ?? 0.1) * 100)}%</span>
                                                </div>
                                                <Slider
                                                    value={[(paperData.watermark?.opacity ?? 0.1) * 100]}
                                                    max={100} min={0} step={1}
                                                    onValueChange={(val: number | readonly number[]) => setPaperData({ ...paperData, watermark: { ...paperData.watermark, opacity: (Array.isArray(val) ? val[0] : val) / 100 } })}
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rotation</Label>
                                                    <span className="text-[10px] text-emerald-500 font-mono">{paperData.watermark?.rotation ?? -45}°</span>
                                                </div>
                                                <Slider
                                                    value={[paperData.watermark?.rotation ?? -45]}
                                                    max={360} min={-360} step={1}
                                                    onValueChange={(val: number | readonly number[]) => setPaperData({ ...paperData, watermark: { ...paperData.watermark, rotation: Array.isArray(val) ? val[0] : val } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="spacing" className="p-6 m-0 space-y-6">
                                    <div className="space-y-4">
                                        {/* Padding */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Inner Space (px)</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Top"
                                                    value={currentStyle.paddingTop?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ paddingTop: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Right"
                                                    value={currentStyle.paddingRight?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ paddingRight: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Bottom"
                                                    value={currentStyle.paddingBottom?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ paddingBottom: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Left"
                                                    value={currentStyle.paddingLeft?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ paddingLeft: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>

                                        {/* Margin */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Outer Space (px)</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Top"
                                                    value={currentStyle.marginTop?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ marginTop: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Right"
                                                    value={currentStyle.marginRight?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ marginRight: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Bottom"
                                                    value={currentStyle.marginBottom?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ marginBottom: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Left"
                                                    value={currentStyle.marginLeft?.replace('px', '') || ''}
                                                    onChange={(e) => updateStyle({ marginLeft: `${e.target.value}px` })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>

                                        {/* Border Width */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Border Width</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.borderWidth || 0}px
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseInt(currentStyle.borderWidth) || 0]}
                                                max={20} min={0} step={1}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ borderWidth: `${Array.isArray(val) ? val[0] : val}px` })}
                                            />
                                        </div>

                                        {/* Border Radius */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Border Radius</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.borderRadius || 0}px
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseInt(currentStyle.borderRadius) || 0]}
                                                max={50} min={0} step={1}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ borderRadius: `${Array.isArray(val) ? val[0] : val}px` })}
                                            />
                                        </div>

                                        <hr className="border-white/5" />

                                        {/* MCQ Columns */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">MCQ Column Layout</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setPaperData({ ...paperData, layout: { ...paperData.layout, mcqColumns: 1 } })}
                                                    className={cn("h-12 bg-white/5 border-white/5 text-[10px] uppercase font-bold", (paperData.layout?.mcqColumns || 1) === 1 && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}
                                                >1 Column</Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setPaperData({ ...paperData, layout: { ...paperData.layout, mcqColumns: 2 } })}
                                                    className={cn("h-12 bg-white/5 border-white/5 text-[10px] uppercase font-bold", paperData.layout?.mcqColumns === 2 && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}
                                                >2 Columns</Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="creative" className="p-6 m-0 space-y-8">
                                    <div className="space-y-6">
                                        {/* Toolbox */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                                <Palette size={16} className="text-emerald-500" />
                                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Creative Toolbox</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="h-20 bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10 flex flex-col gap-2 rounded-xl"
                                                    onClick={() => {
                                                        const newEl = {
                                                            id: `text-${Date.now()}`,
                                                            type: 'text',
                                                            content: 'Double click to edit',
                                                            x: 50,
                                                            y: 50,
                                                            size: 24
                                                        }
                                                        setPaperData({
                                                            ...paperData,
                                                            floatingElements: [...(paperData.floatingElements || []), newEl]
                                                        })
                                                        toast.success("Floating Text Added")
                                                    }}
                                                >
                                                    <Type size={20} className="text-emerald-500" />
                                                    <span className="text-[10px] font-black uppercase">Add Text</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="h-20 bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10 flex flex-col gap-2 rounded-xl"
                                                    onClick={() => {
                                                        const newEl = {
                                                            id: `qr-${Date.now()}`,
                                                            type: 'qr',
                                                            content: 'https://aminacademy.pk',
                                                            x: 100,
                                                            y: 100,
                                                            size: 80
                                                        }
                                                        setPaperData({
                                                            ...paperData,
                                                            floatingElements: [...(paperData.floatingElements || []), newEl]
                                                        })
                                                        toast.success("QR Code Added")
                                                    }}
                                                >
                                                    <Code size={20} className="text-blue-500" />
                                                    <span className="text-[10px] font-black uppercase">Add QR</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="h-20 bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 flex flex-col gap-2 rounded-xl"
                                                    onClick={() => {
                                                        const newEl = {
                                                            id: `icon-${Date.now()}`,
                                                            type: 'icon',
                                                            iconName: 'Star',
                                                            x: 200,
                                                            y: 200,
                                                            size: 40
                                                        }
                                                        setPaperData({
                                                            ...paperData,
                                                            floatingElements: [...(paperData.floatingElements || []), newEl]
                                                        })
                                                        toast.success("Sticker Added")
                                                    }}
                                                >
                                                    <Box size={20} className="text-amber-500" />
                                                    <span className="text-[10px] font-black uppercase">Sticker</span>
                                                </Button>

                                            </div>
                                        </div>

                                        <hr className="border-white/5" />

                                        {/* QR Code Manager */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                                <QrCode size={16} className="text-blue-500" />
                                                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">QR Link Manager</span>
                                            </div>

                                            <div className="space-y-3">
                                                {paperData.floatingElements?.filter((el: any) => el.type === 'qr').length > 0 ? (
                                                    paperData.floatingElements
                                                        .map((el: any, idx: number) => ({ el, idx }))
                                                        .filter((item: any) => item.el.type === 'qr')
                                                        .map(({ el, idx }: any) => (
                                                            <div key={el.id} className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">QR: {el.id.slice(-6)}</span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-zinc-600 hover:text-white"
                                                                        onClick={() => {
                                                                            const newEls = paperData.floatingElements.filter((_: any, i: number) => i !== idx);
                                                                            setPaperData({ ...paperData, floatingElements: newEls });
                                                                        }}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </Button>
                                                                </div>
                                                                <Input
                                                                    value={el.content || ''}
                                                                    onChange={(e) => {
                                                                        const newEls = [...paperData.floatingElements];
                                                                        newEls[idx] = { ...el, content: e.target.value };
                                                                        setPaperData({ ...paperData, floatingElements: newEls });
                                                                    }}
                                                                    placeholder="Enter URL (e.g. https://...)"
                                                                    className="bg-black/40 border-white/5 text-xs h-8"
                                                                />
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl">
                                                        <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">No QR Codes Added</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <hr className="border-white/5" />

                                        {/* Themes */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                                                <Palette size={16} className="text-purple-500" />
                                                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Global Theme Presets</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { id: 'modern', name: 'Modern Clean', desc: 'Sleek Inter typography & minimal borders', color: 'bg-zinc-100' },
                                                    { id: 'royal', name: 'Royal Board', desc: 'Classic double borders & serif fonts', color: 'bg-amber-50' },
                                                    { id: 'minimal', name: 'Ultra Minimal', desc: 'Maximum whitespace, zero distractions', color: 'bg-white' },
                                                    { id: 'classic', name: 'Classic Paper', desc: 'Standard BISE traditional style', color: 'bg-stone-50' }
                                                ].map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => {
                                                            setPaperData({ ...paperData, currentTheme: theme.id })
                                                            toast.success(`Applied ${theme.name} Theme`)
                                                        }}
                                                        className={cn(
                                                            "w-full p-4 rounded-xl border transition-all text-left flex items-start gap-4",
                                                            paperData.currentTheme === theme.id
                                                                ? "bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10"
                                                                : "bg-white/5 border-white/5 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div className={cn("w-12 h-12 rounded-lg border border-black/10 shrink-0", theme.color)} />
                                                        <div className="space-y-1">
                                                            <div className="text-[11px] font-black uppercase tracking-widest text-white">{theme.name}</div>
                                                            <div className="text-[10px] text-zinc-500 leading-tight uppercase tracking-wider">{theme.desc}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="effects" className="p-6 m-0 space-y-6">
                                    <div className="space-y-4">
                                        {/* Box Shadow */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Box Shadow</Label>
                                            <Select value={currentStyle.boxShadow || 'none'} onValueChange={(val) => updateStyle({ boxShadow: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="0 1px 2px rgba(0,0,0,0.05)">Small</SelectItem>
                                                    <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Medium</SelectItem>
                                                    <SelectItem value="0 10px 15px rgba(0,0,0,0.1)">Large</SelectItem>
                                                    <SelectItem value="0 20px 25px rgba(0,0,0,0.15)">Extra Large</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Transform Scale */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Scale</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.transform?.match(/scale\(([\d.]+)\)/)?.[1] || 1}x
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseFloat(currentStyle.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1') * 100]}
                                                max={200} min={50} step={5}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ transform: `scale(${(Array.isArray(val) ? val[0] : val) / 100})` })}
                                            />
                                        </div>

                                        {/* Filter Blur */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Blur</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.filter?.match(/blur\(([\d.]+)px\)/)?.[1] || 0}px
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseFloat(currentStyle.filter?.match(/blur\(([\d.]+)px\)/)?.[1] || '0')]}
                                                max={20} min={0} step={0.5}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ filter: `blur(${Array.isArray(val) ? val[0] : val}px)` })}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="layout" className="p-6 m-0 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                            <Maximize2 size={16} className="text-emerald-500" />
                                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Page Setup & Cropping</span>
                                        </div>

                                        {/* Page Size */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Document Size</Label>
                                            <Select value={sectionStyles.page?.size || 'a4'} onValueChange={(val) => setSectionStyles(prev => ({ ...prev, page: { ...prev.page, size: val } }))}>
                                                <SelectTrigger className="bg-white/5 border-white/10 h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="a4">A4 Standard (210 x 297 mm)</SelectItem>
                                                    <SelectItem value="legal">Legal (216 x 356 mm)</SelectItem>
                                                    <SelectItem value="letter">Letter (216 x 279 mm)</SelectItem>
                                                    <SelectItem value="custom">Custom Size</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Page Margins (Cropping) */}
                                        <div className="space-y-3 pt-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Page Margins (Crop Area)</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <span className="text-[9px] uppercase text-zinc-600 font-black">Top / Bottom</span>
                                                    <Input
                                                        type="number"
                                                        value={parseInt(sectionStyles.page?.paddingY) || 64}
                                                        onChange={(e) => setSectionStyles(prev => ({ ...prev, page: { ...prev.page, paddingY: `${e.target.value}px` } }))}
                                                        className="bg-white/5 border-white/10 h-9 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <span className="text-[9px] uppercase text-zinc-600 font-black">Left / Right</span>
                                                    <Input
                                                        type="number"
                                                        value={parseInt(sectionStyles.page?.paddingX) || 64}
                                                        onChange={(e) => setSectionStyles(prev => ({ ...prev, page: { ...prev.page, paddingX: `${e.target.value}px` } }))}
                                                        className="bg-white/5 border-white/10 h-9 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Scale */}
                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Content Fit (Scale)</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono font-bold">
                                                    {sectionStyles.page?.contentScale || 100}%
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseInt(sectionStyles.page?.contentScale?.toString()) || 100]}
                                                max={150} min={50} step={1}
                                                onValueChange={(val) => {
                                                    const scaleValue = Array.isArray(val) ? val[0] : val;
                                                    setSectionStyles(prev => ({ ...prev, page: { ...prev.page, contentScale: scaleValue } }));
                                                }}
                                            />
                                        </div>

                                        {/* Section Master (Reordering) */}
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center gap-2 mb-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                                                <Grid3x3 size={16} className="text-indigo-500" />
                                                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Section Master (Order)</span>
                                            </div>
                                            <div className="space-y-2">
                                                {(paperData.sectionOrder || ['header', 'mcqs', 'subjective-header', 'short-questions', 'english-special-sections', 'urdu-special-sections', 'long-questions']).map((secId: string, idx: number) => (
                                                    <div key={secId} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg group">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] text-zinc-500 font-mono">0{idx + 1}</span>
                                                            <span className="text-xs font-bold uppercase tracking-tight">{secId.replace('-', ' ')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={idx === 0}
                                                                onClick={() => handleMoveSection('up', secId)}
                                                                className="h-7 w-7 text-zinc-400 hover:text-white"
                                                            >
                                                                <ArrowUp size={12} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={idx === (paperData.sectionOrder?.length || 7) - 1}
                                                                onClick={() => handleMoveSection('down', secId)}
                                                                className="h-7 w-7 text-zinc-400 hover:text-white"
                                                            >
                                                                <ArrowDown size={12} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="advanced" className="p-6 m-0 space-y-6">
                                    <div className="space-y-4">
                                        {/* Cursor */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Cursor</Label>
                                            <Select value={currentStyle.cursor || 'default'} onValueChange={(val) => updateStyle({ cursor: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="default">Default</SelectItem>
                                                    <SelectItem value="pointer">Pointer</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="move">Move</SelectItem>
                                                    <SelectItem value="not-allowed">Not Allowed</SelectItem>
                                                    <SelectItem value="grab">Grab</SelectItem>
                                                    <SelectItem value="grabbing">Grabbing</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Transition Duration */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Transition (ms)</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.transitionDuration?.replace('ms', '') || 0}ms
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseInt(currentStyle.transitionDuration) || 0]}
                                                max={2000} min={0} step={50}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ transitionDuration: `${Array.isArray(val) ? val[0] : val}ms` })}
                                            />
                                        </div>

                                        {/* Flex Direction */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Flex Direction</Label>
                                            <Select value={currentStyle.flexDirection || 'row'} onValueChange={(val) => updateStyle({ flexDirection: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="row">Row</SelectItem>
                                                    <SelectItem value="row-reverse">Row Reverse</SelectItem>
                                                    <SelectItem value="column">Column</SelectItem>
                                                    <SelectItem value="column-reverse">Column Reverse</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Justify Content */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Justify Content</Label>
                                            <Select value={currentStyle.justifyContent || 'flex-start'} onValueChange={(val) => updateStyle({ justifyContent: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="flex-start">Flex Start</SelectItem>
                                                    <SelectItem value="center">Center</SelectItem>
                                                    <SelectItem value="flex-end">Flex End</SelectItem>
                                                    <SelectItem value="space-between">Space Between</SelectItem>
                                                    <SelectItem value="space-around">Space Around</SelectItem>
                                                    <SelectItem value="space-evenly">Space Evenly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Align Items */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Align Items</Label>
                                            <Select value={currentStyle.alignItems || 'stretch'} onValueChange={(val) => updateStyle({ alignItems: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="stretch">Stretch</SelectItem>
                                                    <SelectItem value="flex-start">Flex Start</SelectItem>
                                                    <SelectItem value="center">Center</SelectItem>
                                                    <SelectItem value="flex-end">Flex End</SelectItem>
                                                    <SelectItem value="baseline">Baseline</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Gap */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-bold">Gap</Label>
                                                <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                    {currentStyle.gap || 0}px
                                                </span>
                                            </div>
                                            <Slider
                                                value={[parseInt(currentStyle.gap) || 0]}
                                                max={100} min={0} step={2}
                                                onValueChange={(val: number | readonly number[]) => updateStyle({ gap: `${Array.isArray(val) ? val[0] : val}px` })}
                                            />
                                        </div>

                                        {/* Grid Template Columns */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Grid Columns</Label>
                                            <Input
                                                type="text"
                                                placeholder="e.g., repeat(3, 1fr)"
                                                value={currentStyle.gridTemplateColumns || ''}
                                                onChange={(e) => updateStyle({ gridTemplateColumns: e.target.value })}
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>

                                        {/* User Select */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">User Select</Label>
                                            <Select value={currentStyle.userSelect || 'auto'} onValueChange={(val) => updateStyle({ userSelect: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="auto">Auto</SelectItem>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="all">All</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Object Fit */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Object Fit</Label>
                                            <Select value={currentStyle.objectFit || 'fill'} onValueChange={(val) => updateStyle({ objectFit: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fill">Fill</SelectItem>
                                                    <SelectItem value="contain">Contain</SelectItem>
                                                    <SelectItem value="cover">Cover</SelectItem>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="scale-down">Scale Down</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Pointer Events */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Pointer Events</Label>
                                            <Select value={currentStyle.pointerEvents || 'auto'} onValueChange={(val) => updateStyle({ pointerEvents: val })}>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="auto">Auto</SelectItem>
                                                    <SelectItem value="none">None</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* AI Magic Improve */}
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Languages size={16} className="text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">AI Enhancement</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-relaxed">
                                                Use AI to rephrase this section into professional board-standard terminology.
                                            </p>
                                            <Button
                                                onClick={handleAIImprove}
                                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-widest h-10 rounded-lg shadow-lg shadow-emerald-500/20"
                                            >
                                                Magic Improve ✨
                                            </Button>
                                        </div>

                                        <hr className="border-white/5" />

                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Code size={16} />
                                                <span className="text-[11px] font-bold uppercase tracking-wider">Expert Debug Info</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500">Advanced controls for CSS IDs and raw styling overrides.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selected Element IDs</Label>
                                            <div className="p-3 bg-zinc-900 border border-white/5 rounded-lg flex flex-wrap gap-1 items-center group">
                                                {selectedSectionIds.length > 0 ? (
                                                    selectedSectionIds.map(id => (
                                                        <span key={id} className="text-emerald-500 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{id}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-zinc-600 font-mono text-[11px]">None Selected</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custom CSS Selector</Label>
                                            <div className="p-2 bg-black/40 border border-white/5 rounded-lg font-mono text-[10px] text-zinc-400">
                                                {selectedSectionIds.length > 0 ? `${selectedSectionIds.map(id => `#${id}`).join(', ')} { ... }` : 'Select elements to see CSS selector'}
                                            </div>
                                        </div>

                                        <hr className="border-white/5" />

                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-red-500/5 border-red-500/20 text-red-500 text-[10px] font-bold uppercase hover:bg-red-500/10"
                                            onClick={() => {
                                                if (selectedSectionIds.length > 0) {
                                                    const newStyles = { ...sectionStyles };
                                                    selectedSectionIds.forEach(id => {
                                                        delete newStyles[id];
                                                    });
                                                    setSectionStyles(newStyles);
                                                    setSelectedSectionIds([]);
                                                    toast.success("Reset element styling");
                                                }
                                            }}
                                        >
                                            Reset Element Styling
                                        </Button>

                                        {selectedSectionIds.length === 1 && paperData.floatingElements?.some((el: any) => el.id === selectedSectionIds[0]) && (
                                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-4 mt-4">
                                                <div className="flex items-center gap-2 text-blue-400">
                                                    <Box size={16} />
                                                    <span className="text-[11px] font-bold uppercase tracking-wider">Floating Element Editor</span>
                                                </div>

                                                {paperData.floatingElements.map((el: any, idx: number) => {
                                                    if (el.id !== selectedSectionIds[0]) return null;
                                                    return (
                                                        <div key={el.id} className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] uppercase font-black text-zinc-500">Content / URL</Label>
                                                                <Input
                                                                    value={el.content || ''}
                                                                    onChange={(e) => {
                                                                        const newEls = [...paperData.floatingElements];
                                                                        newEls[idx] = { ...el, content: e.target.value };
                                                                        setPaperData({ ...paperData, floatingElements: newEls });
                                                                    }}
                                                                    className="bg-black/40 border-white/5 text-xs h-8"
                                                                    placeholder={el.type === 'qr' ? 'https://...' : 'Type text here...'}
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] uppercase font-black text-zinc-500">Z-Index</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={el.zIndex || 50}
                                                                        onChange={(e) => {
                                                                            const newEls = [...paperData.floatingElements];
                                                                            newEls[idx] = { ...el, zIndex: parseInt(e.target.value) };
                                                                            setPaperData({ ...paperData, floatingElements: newEls });
                                                                        }}
                                                                        className="bg-black/40 border-white/5 text-xs h-8"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] uppercase font-black text-zinc-500">Size</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={el.size || (el.type === 'qr' ? 80 : 24)}
                                                                        onChange={(e) => {
                                                                            const newEls = [...paperData.floatingElements];
                                                                            newEls[idx] = { ...el, size: parseInt(e.target.value) };
                                                                            setPaperData({ ...paperData, floatingElements: newEls });
                                                                        }}
                                                                        className="bg-black/40 border-white/5 text-xs h-8"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 bg-[#080808]">
                    <div className="flex gap-3 mb-4">
                        <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
                            onClick={handleSaveJSON}
                        >
                            <Save size={16} className="mr-2" /> Save Project
                        </Button>
                    </div>
                    <Button onClick={handleExportPDF} className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl">
                        <Printer size={16} className="mr-2" /> Export PDF
                    </Button>
                </div>
            </div>

            {/* RESIZE HANDLE */}
            <div
                className="w-1 bg-white/5 hover:bg-emerald-500/50 cursor-col-resize transition-colors relative group"
                onMouseDown={() => setIsResizing(true)}
            >
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={16} className="text-zinc-600" />
                </div>
            </div>

            {/* RIGHT CANVAS AREA */}
            <div className="flex-1 overflow-auto bg-[#0a0a0a] flex items-start justify-center pt-12 pb-24 relative custom-scrollbar">
                {/* Zoom Controls */}
                <div className="fixed top-8 right-8 z-50 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                        className="bg-zinc-900 border-white/10 hover:bg-zinc-800"
                    >
                        <ZoomOut size={14} />
                    </Button>
                    <div className="bg-zinc-900 border border-white/10 px-3 py-1 rounded text-xs font-mono">
                        {zoom}%
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                        className="bg-zinc-900 border-white/10 hover:bg-zinc-800"
                    >
                        <ZoomIn size={14} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className={cn("bg-zinc-900 border-white/10 hover:bg-zinc-800", showGrid && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}
                    >
                        <Grid3x3 size={14} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const containerWidth = canvasRef.current?.parentElement?.clientWidth || 1000
                            const targetZoom = Math.min(100, (containerWidth - 96) / (210 * 3.78) * 100) // approx px conversion
                            setZoom(Math.floor(targetZoom))
                        }}
                        className="bg-zinc-900 border-white/10 hover:bg-zinc-800 text-[10px] font-mono px-2"
                    >
                        FIT
                    </Button>
                </div>

                {/* THE A4 CANVAS */}
                <div
                    ref={canvasRef}
                    style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        backgroundImage: showGrid ? 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)' : 'none',
                        backgroundSize: showGrid ? '5mm 5mm' : 'auto'
                    }}
                >
                    <PaperRenderer
                        paperData={paperData}
                        selectedSectionIds={selectedSectionIds}
                        onSectionClick={onSectionClick}
                        sectionStyles={sectionStyles}
                        setPaperData={setPaperData}
                        onAIAction={handleAIAction}
                        isEditing={true}
                    />
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    `}</style>

            <AISectionPromptModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onGenerate={handleAIGenerated}
                section={activeSectionAI}
                context={paperData?.paperInfo?.subject || "General"}
            />

            <ScholarPanel isOpen={isScholarOpen} onClose={() => setIsScholarOpen(false)} />
        </div>
    )
}

export default function ArchitectStudio() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                </div>
            </div>
        }>
            <ArchitectStudioContent />
        </Suspense>
    )
}
