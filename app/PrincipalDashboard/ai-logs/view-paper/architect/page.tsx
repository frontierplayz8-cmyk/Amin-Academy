"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
    Type,
    Layout,
    Layers,
    Plus,
    Trash2,
    Move,
    Eye,
    EyeOff,
    Copy,
    Download,
    Save,
    ChevronLeft,
    Printer,
    Maximize2,
    Settings,
    Grid,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Languages,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Types for the advanced editor
interface SectionStyle {
    fontSize: number
    lineHeight: number
    letterSpacing: number
    fontWeight: string
    fontStyle: 'normal' | 'italic'
    textDecoration: 'none' | 'underline'
    textAlign: 'left' | 'right' | 'center'
    opacity: number
    fontFamily: 'urdu' | 'english'
}

interface ArchitectSection {
    id: string
    type: string
    title: string
    urduTitle?: string
    content: any
    marks: number
    isHidden: boolean
    isUrdu: boolean
    styles: SectionStyle
    position: { x: number, y: number } // Snap-to-grid offsets
}

export default function ArchitectStudio() {
    const [sections, setSections] = useState<ArchitectSection[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isRTL, setIsRTL] = useState(false)
    const [showGrid, setShowGrid] = useState(true)
    const [zoom, setZoom] = useState(100)
    const canvasRef = useRef<HTMLDivElement>(null)

    // --- Styling Handlers ---
    const updateSelectedStyle = (updates: Partial<SectionStyle>) => {
        if (selectedIds.length === 0) return
        setSections(prev => prev.map(section =>
            selectedIds.includes(section.id)
                ? { ...section, styles: { ...section.styles, ...updates } }
                : section
        ))
    }

    const currentSection = sections.find(s => s.id === selectedIds[0])

    // --- Section Management ---
    const deleteSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id))
        setSelectedIds(prev => prev.filter(p => p !== id))
        toast.promise(Promise.resolve(), {
            loading: 'Deleting layer...',
            success: 'Layer removed from canvas',
            error: 'Failed to delete'
        })
    }

    const cloneSection = (id: string) => {
        const section = sections.find(s => s.id === id)
        if (!section) return
        const newSection = {
            ...section,
            id: `${section.id}-clone-${Date.now()}`,
            title: `${section.title} (Copy)`
        }
        const index = sections.findIndex(s => s.id === id)
        const newSections = [...sections]
        newSections.splice(index + 1, 0, newSection)
        setSections(newSections)
        toast.success("Layer cloned")
    }

    const toggleHide = (id: string) => {
        setSections(prev => prev.map(s =>
            s.id === id ? { ...s, isHidden: !s.isHidden } : s
        ))
    }

    const handleReorder = (id: string, direction: 'up' | 'down') => {
        const index = sections.findIndex(s => s.id === id)
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === sections.length - 1) return

        const newSections = [...sections]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
            ;[newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
        setSections(newSections)
    }

    // --- Intelligence: Auto Numbering ---
    useEffect(() => {
        // We could refresh MCQ numbers here if we wanted to be truly "smart" 
        // across the entire document structure.
    }, [sections])

    // Load data from localStorage
    useEffect(() => {
        const data = localStorage.getItem('architect_payload')
        if (data) {
            try {
                const parsed = JSON.parse(data)
                // Convert standard paper data to ArchitectLayers
                const initialLayers = convertToLayers(parsed)
                setSections(initialLayers)
                setIsRTL(parsed.paperInfo.subject === 'Urdu')
            } catch (e) {
                toast.error("Failed to load project data")
            }
        }
    }, [])

    const convertToLayers = (data: any): ArchitectSection[] => {
        const layers: ArchitectSection[] = []
        const defaultStyle: SectionStyle = {
            fontSize: 14,
            lineHeight: 1.5,
            letterSpacing: 0,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            opacity: 100,
            fontFamily: 'english'
        }

        const urduStyle: SectionStyle = {
            ...defaultStyle,
            fontSize: 18,
            lineHeight: 2,
            fontFamily: 'urdu'
        }

        const basePosition = { x: 0, y: 0 }

        // 1. Header
        layers.push({
            id: 'header-main',
            type: 'header',
            title: 'Official Header',
            content: data.headerDetails || {},
            marks: 0,
            isHidden: false,
            isUrdu: false,
            styles: { ...defaultStyle, fontWeight: 'bold', fontSize: 13 },
            position: basePosition
        })

        // 2. MCQs
        if (data.mcqs && data.mcqs.length > 0) {
            layers.push({
                id: 'mcq-section',
                type: 'mcq_group',
                title: 'Section-A: Objective',
                urduTitle: 'حصہ اول: معروضی',
                content: data.mcqs,
                marks: parseInt(data.headerDetails?.marksObjective) || 12,
                isHidden: false,
                isUrdu: data.paperInfo.subject === 'Urdu',
                styles: data.paperInfo.subject === 'Urdu' ? urduStyle : defaultStyle,
                position: basePosition
            })
        }

        // 3. Short Questions
        if (data.shortQuestions && data.shortQuestions.length > 0) {
            layers.push({
                id: 'sq-section',
                type: 'short_questions',
                title: 'Section-B: Short Questions',
                urduTitle: 'حصہ دوم: مختصر سوالات',
                content: data.shortQuestions,
                marks: 20, // Default estimate
                isHidden: false,
                isUrdu: data.paperInfo.subject === 'Urdu',
                styles: data.paperInfo.subject === 'Urdu' ? urduStyle : defaultStyle,
                position: basePosition
            })
        }

        // 4. Urdu Specifics (Mazmoon, Khulasa, etc)
        if (data.urduData) {
            Object.entries(data.urduData).forEach(([key, value]) => {
                if (!value) return
                layers.push({
                    id: `urdu-${key}`,
                    type: 'subjective_q',
                    title: key.charAt(0).toUpperCase() + key.slice(1),
                    content: value,
                    marks: data.objectiveMarks || 20,
                    isHidden: false,
                    isUrdu: true,
                    styles: urduStyle,
                    position: basePosition
                })
            })
        }

        // 5. English Specifics (Translation, Voice, etc)
        if (data.englishData) {
            Object.entries(data.englishData).forEach(([key, value]) => {
                if (!value) return
                layers.push({
                    id: `english-${key}`,
                    type: 'subjective_q',
                    title: key.charAt(0).toUpperCase() + key.slice(1),
                    content: value,
                    marks: data.objectiveMarks || 20,
                    isHidden: false,
                    isUrdu: false,
                    styles: defaultStyle,
                    position: basePosition
                })
            })
        }

        // 6. Long Questions
        if (data.longQuestions && data.longQuestions.length > 0) {
            data.longQuestions.forEach((lq: any, idx: number) => {
                layers.push({
                    id: `lq-${idx}`,
                    type: 'long_question',
                    title: `Long Question ${idx + 1}`,
                    content: lq,
                    marks: 2,
                    isHidden: false,
                    isUrdu: data.paperInfo.subject === 'Urdu',
                    styles: data.paperInfo.subject === 'Urdu' ? urduStyle : defaultStyle,
                    position: basePosition
                })
            })
        }

        return layers
    }

    const toggleRTL = () => {
        const newRTL = !isRTL
        setIsRTL(newRTL)
        setSections(prev => prev.map(s => ({
            ...s,
            isUrdu: newRTL,
            styles: {
                ...s.styles,
                fontFamily: newRTL ? 'urdu' : 'english',
                textAlign: newRTL ? 'right' : 'left'
            }
        })))
        toast.info(newRTL ? "Switched to Urdu (RTL)" : "Switched to English (LTR)")
    }

    const selectAll = () => {
        setSelectedIds(sections.map(s => s.id))
        toast(`Selected ${sections.length} layers`)
    }

    const addSection = () => {
        const newSection: ArchitectSection = {
            id: `layer-${Date.now()}`,
            type: 'subjective_q',
            title: 'New Custom Layer',
            content: 'Double click to edit content...',
            marks: 5,
            isHidden: false,
            isUrdu: isRTL,
            styles: {
                fontSize: 14,
                lineHeight: 1.5,
                letterSpacing: 0,
                fontWeight: 'normal',
                fontStyle: 'normal',
                textDecoration: 'none',
                textAlign: isRTL ? 'right' : 'left',
                opacity: 100,
                fontFamily: isRTL ? 'urdu' : 'english'
            },
            position: { x: 0, y: 0 }
        }
        setSections([...sections, newSection])
        setSelectedIds([newSection.id])
        toast.success("New layer added")
    }

    const handleExportPDF = async () => {
        if (!canvasRef.current) return
        const toastId = toast.loading("Synthesizing Neural PDF...")

        try {
            await document.fonts.ready

            const canvas = await html2canvas(canvasRef.current, {
                scale: 3, // High scale for vector-like quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })

            const pdf = new jsPDF('p', 'mm', 'a4')
            const imgData = canvas.toDataURL('image/png', 1.0)

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
            pdf.save(`Architect_Export_${Date.now()}.pdf`)

            toast.success("Design Exported Successfully", { id: toastId })
        } catch (error) {
            toast.error("Export Failed", { id: toastId })
            console.error(error)
        }
    }

    const handleSaveJSON = () => {
        const payload = {
            sections,
            isRTL,
            exportDate: new Date().toISOString(),
            version: '2.0.0'
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
        toast.success("Project File Downloaded")
    }

    const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target?.result as string)
                if (parsed.sections) {
                    setSections(parsed.sections)
                    setIsRTL(!!parsed.isRTL)
                    toast.success("Project Loaded Successfully")
                }
            } catch (err) {
                toast.error("Invalid Project File")
            }
        }
        reader.readAsText(file)
    }

    const totalMarks = sections.filter(s => !s.isHidden).reduce((acc, s) => acc + s.marks, 0)

    return (
        <><div className="h-screen w-full bg-[#0a0a0a] text-zinc-300 flex overflow-hidden font-sans select-none">

            {/* LEFT CONTROL PANEL (EDITOR) */}
            <div className="w-[450px] border-r border-white/5 flex flex-col bg-[#0d0d0d] shadow-2xl relative z-20">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black">
                            <Maximize2 size={18} />
                        </div>
                        <h1 className="font-black uppercase tracking-tighter text-lg">Architect <span className="text-emerald-500">PRO</span></h1>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => window.close()} className="hover:bg-red-500/10 hover:text-red-500">
                        <ChevronLeft size={20} />
                    </Button>
                </div>

                <Tabs defaultValue="layers" className="flex-1 flex flex-col">
                    <TabsList className="mx-6 mt-4 bg-white/5 p-1 rounded-xl">
                        <TabsTrigger value="layers" className="flex-1 gap-2"><Layers size={14} /> Layers</TabsTrigger>
                        <TabsTrigger value="design" className="flex-1 gap-2"><Type size={14} /> Design</TabsTrigger>
                        <TabsTrigger value="settings" className="flex-1 gap-2"><Settings size={14} /> Config</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <TabsContent value="layers" className="p-6 m-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Canvas Layers</h3>
                                <div className="flex gap-2">
                                    <Button onClick={selectAll} variant="ghost" className="h-7 text-[9px] uppercase font-black hover:bg-white/5">Select All</Button>
                                    <Button onClick={addSection} size="sm" variant="outline" className="h-7 text-[10px] gap-1 bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400">
                                        <Plus size={10} /> Add Layer
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {sections.map(section => (
                                    <div
                                        key={section.id}
                                        onClick={() => setSelectedIds([section.id])}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                                            selectedIds.includes(section.id)
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                : "bg-white/5 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Move size={14} className="text-zinc-600" />
                                            <div>
                                                <p className="text-xs font-bold leading-none">{section.title}</p>
                                                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">{section.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReorder(section.id, 'up') } }
                                                className="p-1 hover:bg-white/10 rounded text-zinc-600"
                                            >
                                                <ChevronLeft size={12} className="rotate-90" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleHide(section.id) } }
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500"
                                            >
                                                {section.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); cloneSection(section.id) } }
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500"
                                            >
                                                <Copy size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteSection(section.id) } }
                                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="design" className="p-6 m-0 space-y-8">
                            {/* Typography Pro */}
                            <section>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block">Typography Engine</label>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold">Font Size (pt)</span>
                                            <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                {currentSection?.styles.fontSize || 14}pt
                                            </span>
                                        </div>
                                        <Slider
                                            value={[currentSection?.styles.fontSize || 14]}
                                            max={72} min={6} step={1}
                                            onValueChange={(val) => updateSelectedStyle({ fontSize: Array.isArray(val) ? val[0] : val })} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold">Line Spacing</span>
                                            <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                {currentSection?.styles.lineHeight || 1.5}
                                            </span>
                                        </div>
                                        <Slider
                                            value={[currentSection?.styles.lineHeight || 1.5]}
                                            max={4} min={0.5} step={0.1}
                                            onValueChange={(val) => updateSelectedStyle({ lineHeight: Array.isArray(val) ? val[0] : val })} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold">Letter Spacing</span>
                                            <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                {currentSection?.styles.letterSpacing || 0}px
                                            </span>
                                        </div>
                                        <Slider
                                            value={[currentSection?.styles.letterSpacing || 0]}
                                            min={-5} max={20} step={0.5}
                                            onValueChange={(val) => updateSelectedStyle({ letterSpacing: Array.isArray(val) ? val[0] : val })} />
                                    </div>
                                </div>
                            </section>

                            {/* Styling Tools */}
                            <section className="pt-6 border-t border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block">Layer Styling</label>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold">Opacity</span>
                                            <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-emerald-500 font-mono">
                                                {currentSection?.styles.opacity || 100}%
                                            </span>
                                        </div>
                                        <Slider
                                            value={[currentSection?.styles.opacity || 100]}
                                            max={100} min={0} step={1}
                                            onValueChange={(val) => updateSelectedStyle({ opacity: Array.isArray(val) ? val[0] : val })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button variant="outline" onClick={() => updateSelectedStyle({ textAlign: 'left' })} className={cn("h-10 bg-white/5 border-white/5", currentSection?.styles.textAlign === 'left' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}><AlignLeft size={14} /></Button>
                                        <Button variant="outline" onClick={() => updateSelectedStyle({ textAlign: 'center' })} className={cn("h-10 bg-white/5 border-white/5", currentSection?.styles.textAlign === 'center' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}><AlignCenter size={14} /></Button>
                                        <Button variant="outline" onClick={() => updateSelectedStyle({ textAlign: 'right' })} className={cn("h-10 bg-white/5 border-white/5", currentSection?.styles.textAlign === 'right' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}><AlignRight size={14} /></Button>
                                    </div>
                                </div>
                            </section>
                        </TabsContent>
                    </div>
                </Tabs>

                <div className="p-6 border-t border-white/5 bg-[#080808]">
                    <div className="flex gap-3 mb-4">
                        <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
                            onClick={handleSaveJSON}
                        >
                            <Save size={16} className="mr-2" /> Save Project
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleLoadJSON}
                                className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Button variant="outline" className="bg-white/5 border-white/5 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl">
                                <Download size={16} />
                            </Button>
                        </div>
                    </div>
                    <Button onClick={handleExportPDF} className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl">
                        <Printer size={16} className="mr-2" /> Export Vector PDF
                    </Button>
                </div>
            </div>

            {/* RIGHT CANVAS ENGINE */}
            <div className="flex-1 bg-[#121212] overflow-auto p-20 flex flex-col items-center relative custom-scrollbar">

                {/* TOOLBAR OVERLAY */}
                <div className="fixed top-8 right-8 z-50 flex items-center gap-4 p-2 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                        <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(50, zoom - 10))} className="h-8 w-8 p-0">-</Button>
                        <span className="text-[10px] font-black w-10 text-center">{zoom}%</span>
                        <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(200, zoom + 10))} className="h-8 w-8 p-0">+</Button>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleRTL}
                            className={cn("h-10 w-10 rounded-xl transition-all", isRTL ? "bg-emerald-500 text-black" : "text-zinc-500 hover:bg-white/5")}
                        >
                            <Languages size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowGrid(!showGrid)}
                            className={cn("h-10 w-10 rounded-xl transition-all", showGrid ? "bg-white/10 text-white" : "text-zinc-500")}
                        >
                            <Grid size={18} />
                        </Button>
                    </div>
                </div>

                {/* MARKS TRACKER OVERLAY */}
                <div className="fixed bottom-8 right-8 z-50 p-6 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col items-center min-w-[150px]">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Total Points</span>
                    <div className={cn("text-4xl font-black italic tracking-tighter transition-colors", totalMarks > 100 ? "text-red-500" : "text-emerald-500")}>
                        {totalMarks} <span className="text-sm font-medium text-zinc-600 block text-center mt-1">/ 100</span>
                    </div>
                    {totalMarks > 100 && <p className="text-[8px] text-red-500 font-bold mt-2 uppercase">Limit Exceeded</p>}
                </div>

                {/* THE A4 CANVAS */}
                <div
                    ref={canvasRef}
                    className="bg-white shadow-[0_60px_100px_-20px_rgba(0,0,0,0.5)] relative origin-top transition-all duration-300 overflow-hidden"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '15mm 15mm',
                        transform: `scale(${zoom / 100})`,
                        fontFamily: "'Times New Roman', Times, serif"
                    }}
                >
                    {/* Snap Grid lines */}
                    {showGrid && (
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                            style={{ background: 'linear-gradient(90deg, #000 1px, transparent 0), linear-gradient(#000 1px, transparent 0)', backgroundSize: '5mm 5mm' }} />
                    )}

                    {sections.filter(s => !s.isHidden).map((section, idx) => {
                        // Question numbering intelligence
                        // Even if middle sections are deleted, the rendered indices (mIdx+1) handled in the map 
                        // within mcq_group/short_questions ensure sequential numbering.
                        const sectionStyle = {
                            fontSize: `${section.styles.fontSize}pt`,
                            lineHeight: section.styles.lineHeight,
                            letterSpacing: `${section.styles.letterSpacing}px`,
                            fontWeight: section.styles.fontWeight,
                            fontStyle: section.styles.fontStyle,
                            textDecoration: section.styles.textDecoration,
                            textAlign: section.styles.textAlign,
                            opacity: section.styles.opacity / 100,
                            fontFamily: section.styles.fontFamily === 'urdu' ? "'Jameel Noori Nastaleeq', serif" : "'Times New Roman', serif"
                        }

                        return (
                            <div
                                key={section.id}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedIds([section.id])
                                } }
                                className={cn(
                                    "relative transition-all group/layer px-2 py-1 cursor-move",
                                    selectedIds.includes(section.id) && "ring-2 ring-emerald-500 ring-offset-4 rounded-sm bg-emerald-50/5"
                                )}
                                style={{
                                    ...sectionStyle,
                                    transform: `translate(${section.position.x}px, ${section.position.y}px)`
                                }}
                            >
                                {section.type === 'header' && (
                                    <div className="border-b-2 border-black pb-4 text-center">
                                        <div className="flex justify-between items-start mb-2 font-bold text-[10pt]">
                                            <span>{section.content.session || "Session 2025-26"}</span>
                                            <div className="flex flex-col items-center flex-1">
                                                <h1 className="text-[1.4em] font-black uppercase underline underline-offset-4">
                                                    {section.content.schoolName || "Academic Institution"}
                                                </h1>
                                                <p className="mt-1 opacity-70 tracking-widest">{section.content.systemBadge || "Examination System"}</p>
                                            </div>
                                            <div className="border-2 border-black p-1 min-w-[120px]">Roll No: ________</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-[11pt] font-bold border-t border-black pt-2">
                                            <div className="text-left font-sans">SUBJECT: {section.content.subject || "ECONOMICS"}</div>
                                            <div className="text-center italic uppercase font-sans">Board Simulation</div>
                                            <div className="text-right font-sans">TIME: {section.content.timeObjective || "2 Hours"}</div>
                                        </div>
                                    </div>
                                )}

                                {section.type === 'mcq_group' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-zinc-100/50 p-1 border-y border-black mb-6">
                                            <h3 className="font-bold uppercase tracking-tight">
                                                {section.isUrdu ? section.urduTitle : section.title}
                                            </h3>
                                            <span className="font-bold">({section.marks} Marks)</span>
                                        </div>
                                        <div className="space-y-6">
                                            {section.content.map((mcq: any, mIdx: number) => (
                                                <div key={mIdx} className="page-break-inside-avoid">
                                                    <div className="flex gap-2">
                                                        <span className="font-black">{mIdx + 1}.</span>
                                                        <p className="flex-1 text-justify">{section.isUrdu ? mcq.ur : mcq.en}</p>
                                                    </div>
                                                    <div className="grid grid-cols-4 mt-2 gap-4">
                                                        {mcq.options.map((opt: any, oIdx: number) => (
                                                            <div key={oIdx} className="flex gap-1 items-start text-[0.9em]">
                                                                <span className="font-bold">({String.fromCharCode(65 + oIdx)})</span>
                                                                <span>{section.isUrdu ? opt.ur : opt.en}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {section.type === 'short_questions' && (
                                    <div className="mt-8 space-y-4">
                                        <div className="flex justify-between items-center bg-zinc-100/50 p-1 border-y border-black mb-6">
                                            <h3 className="font-bold uppercase tracking-tight">
                                                {section.isUrdu ? section.urduTitle : section.title}
                                            </h3>
                                            <span className="font-bold">({section.marks} Marks)</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {section.content.map((sq: any, qIdx: number) => (
                                                <div key={qIdx} className="flex gap-2">
                                                    <span className="font-bold">{qIdx + 1}-</span>
                                                    <p className="flex-1 text-justify">{section.isUrdu ? sq.ur : sq.en}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {section.type === 'long_question' && (
                                    <div className="mt-6 border-b border-dotted border-black/20 pb-4">
                                        <div className="flex justify-between font-bold mb-2">
                                            <span className="bg-zinc-100 px-2 uppercase text-xs">{section.title}</span>
                                            <span className="font-black">({section.marks} Marks)</span>
                                        </div>
                                        <p className="mb-2 italic font-medium leading-relaxed">{section.content.en || section.content.ur}</p>
                                        <div className="space-y-3 pl-8 mt-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-black/10">
                                            {section.content.parts?.map((part: any, pIdx: number) => (
                                                <div key={pIdx} className="flex gap-3 items-start">
                                                    <span className="font-black text-[0.9em] bg-black text-white px-1.5 h-5 flex items-center justify-center rounded-sm">
                                                        {String.fromCharCode(97 + pIdx)}
                                                    </span>
                                                    <p className="flex-1 leading-normal">{section.isUrdu ? part.ur : part.en}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {section.type === 'subjective_q' && (
                                    <div className="mt-6">
                                        <div className="flex justify-between font-bold border-b border-black mb-2 pb-1">
                                            <span className="uppercase tracking-widest text-[0.8em]">{section.title}</span>
                                            <span>({section.marks} Marks)</span>
                                        </div>
                                        {typeof section.content === 'string' ? (
                                            <p className="text-justify leading-relaxed">{section.content}</p>
                                        ) : section.content.paragraph ? (
                                            <div className="space-y-4">
                                                <p className="text-justify leading-relaxed p-4 bg-zinc-50 border-x border-black/5 italic">{section.content.paragraph}</p>
                                                <div className="grid grid-cols-1 gap-2 pt-2">
                                                    {section.content.questions?.map((q: any, i: number) => (
                                                        <div key={i} className="flex gap-4 items-center border-b border-dotted border-black/10 pb-1">
                                                            <span className="font-black text-emerald-600 italic">Q{i + 1}:</span>
                                                            <p className="flex-1">{q.question}</p>
                                                            <span className="text-[0.8em] font-bold">[{q.marks}]</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-zinc-100/30 rounded border border-black/5">
                                                <pre className="whitespace-pre-wrap font-inherit text-[0.9em] opacity-80">{JSON.stringify(section.content, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div><style jsx global>{`
                @font-face {
                    font-family: 'Jameel Noori Nastaleeq';
                    src: url('/fonts/Jameel-Noori-Nastaleeq.ttf') format('truetype');
                }
                .font-urdu {
                    font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
                }
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
            </>
    )
}