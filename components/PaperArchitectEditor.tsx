"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import {
    GripVertical,
    Trash2,
    Plus,
    Type,
    Settings,
    Layout,
    ChevronRight,
    Command,
    Search,
    Check,
    Languages,
    Printer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableText } from './EditableText'

// --- HELPER ---
const safeRender = (val: any): string => {
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    if (typeof val === 'object' && val !== null) {
        return val.en || val.ur || JSON.stringify(val)
    }
    return ''
}

// --- TYPES ---

export interface Section {
    id: string
    type: 'header' | 'mcq_group' | 'subjective_q' | 'instruction' | 'marks_grid' | 'roll_no'
    title: string
    content: any
    marks?: number
    number?: number
    urduTitle?: string
    isUrdu?: boolean
    styles?: {
        fontSize?: number
        fontWeight?: string
        fontStyle?: 'normal' | 'italic'
        textDecoration?: 'none' | 'underline'
        textAlign?: 'left' | 'right' | 'center'
        fontFamily?: string
        color?: string
    }
}

interface PaperArchitectEditorProps {
    paperData: any
    setPaperData: (data: any) => void
    isEditing: boolean
}

// --- SORTABLE WRAPPER ---

function SortableSection({
    id,
    children,
    onDelete,
    isSelected,
    onSelect
}: {
    id: string,
    children: React.ReactNode,
    onDelete: () => void,
    isSelected: boolean,
    onSelect: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative border-2 border-transparent transition-all rounded-xl",
                isSelected ? "border-emerald-500 bg-emerald-50/20" : "hover:border-zinc-200"
            )}
            onClick={(e) => {
                if (e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect()
                }
            }}
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 bg-white border rounded shadow-lg hover:bg-zinc-50 transition-opacity z-50"
            >
                <GripVertical className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="absolute -right-10 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-50">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 bg-red-50 text-red-500 rounded-lg border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {children}
        </div>
    )
}

// --- MAIN COMPONENT ---

export function PaperArchitectEditor({ paperData, setPaperData, isEditing }: PaperArchitectEditorProps) {
    const [sections, setSections] = useState<Section[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [activeCommand, setActiveCommand] = useState<string | null>(null)
    const [commandQuery, setCommandQuery] = useState('')

    // Transform paperData into manageable sections
    useEffect(() => {
        if (!paperData) return

        const initialSections: Section[] = []

        // 1. Roll No Header
        initialSections.push({
            id: 'roll-no',
            type: 'roll_no',
            title: 'Roll Number Slip',
            content: { label: paperData.headerDetails?.rollNoLabel || 'Roll No.' },
            isUrdu: paperData.paperInfo.subject === 'Urdu'
        })

        // 2. Main Header
        initialSections.push({
            id: 'main-header',
            type: 'header',
            title: 'Paper Header',
            content: paperData.headerDetails || {},
            isUrdu: paperData.paperInfo.subject === 'Urdu'
        })

        // 3. Instruction Header
        initialSections.push({
            id: 'instruction-objective',
            type: 'instruction',
            title: 'Objective Instructions',
            content: { text: paperData.paperInfo.subject === 'Urdu' ? 'حصہ اول (معروضی)' : 'Part-I (Objective)' },
            isUrdu: paperData.paperInfo.subject === 'Urdu'
        })

        // 4. MCQs
        if (paperData.mcqs && paperData.mcqs.length > 0) {
            if (paperData.paperInfo.subject === "Urdu") {
                const urduMcqGroups = [
                    { type: "hissa_nasr", title: "(1)- حصہ نثر کے مطابق درست جواب کی نشاندہی کریں۔ (5 نمبر)" },
                    { type: "hissa_shairi", title: "(2)- حصہ شاعری کے مطابق درست جواب کی نشاندہی کریں۔ (5 نمبر)" },
                    { type: "mcq_grammar", title: "(3)- مطابقت اور حروف کے درست استعمال کی نشاندہی کریں۔ (5 نمبر)" },
                    { type: "mcq_usage", title: "(4)- رموزِ اوقاف اور جملوں کی درستگی کی نشاندہی کریں۔ (5 نمبر)" }
                ]
                urduMcqGroups.forEach((group, idx) => {
                    const groupMcqs = paperData.mcqs.filter((m: any) => m.type === group.type)
                    if (groupMcqs.length > 0) {
                        initialSections.push({
                            id: `mcq-group-${group.type}`,
                            type: 'mcq_group',
                            title: group.title,
                            urduTitle: group.title,
                            content: groupMcqs,
                            isUrdu: true
                        })
                    }
                })
            } else {
                initialSections.push({
                    id: 'mcqs-all',
                    type: 'mcq_group',
                    title: 'All MCQs',
                    content: paperData.mcqs,
                    isUrdu: false
                })
            }
        }

        // 5. Subjective Sections
        if (paperData.paperInfo.subject === 'Urdu' && paperData.urduData) {
            const ud = paperData.urduData
            if (ud.shyrNazm) initialSections.push({ id: 'urdu-shyr-nazm', type: 'subjective_q', title: 'Q2: Poetry (Nazm)', urduTitle: 'سوال نمبر 2: اشعار کی تشریح (حصہ نظم)', content: ud.shyrNazm, isUrdu: true, marks: 10 })
            if (ud.shyrGhazal) initialSections.push({ id: 'urdu-shyr-ghazal', type: 'subjective_q', title: 'Q2: Poetry (Ghazal)', urduTitle: 'سوال نمبر 2: اشعار کی تشریح (حصہ غزل)', content: ud.shyrGhazal, isUrdu: true, marks: 10 })
            if (ud.siaqoSabaq) initialSections.push({ id: 'urdu-siaqo-sabaq', type: 'subjective_q', title: 'Q3: Siaq-o-Sabaq', urduTitle: 'سوال نمبر 3: سیاق و سباق', content: ud.siaqoSabaq, isUrdu: true, marks: 15 })
            if (ud.khulasaSabaq) initialSections.push({ id: 'urdu-khulasa-sabaq', type: 'subjective_q', title: 'Q4: Lesson Summary', urduTitle: 'سوال نمبر 4: خلاصہ سبق', content: ud.khulasaSabaq, isUrdu: true, marks: 5 })
            if (ud.khulasaNazm) initialSections.push({ id: 'urdu-khulasa-nazm', type: 'subjective_q', title: 'Q5: Poem Summary', urduTitle: 'سوال نمبر 5: خلاصہ نظم', content: ud.khulasaNazm, isUrdu: true, marks: 5 })
            if (ud.khatDarkhwast) initialSections.push({ id: 'urdu-khat', type: 'subjective_q', title: 'Q6: Letter/Application', urduTitle: 'سوال نمبر 6: خط / درخواست', content: ud.khatDarkhwast, isUrdu: true, marks: 10 })
            if (ud.dialogueStory) initialSections.push({ id: 'urdu-dialogue', type: 'subjective_q', title: 'Q7: Dialogue/Story', urduTitle: 'سوال نمبر 7: مکالمہ / کہانی', content: ud.dialogueStory, isUrdu: true, marks: 5 })
            if (ud.sentenceCorrection) initialSections.push({ id: 'urdu-correction', type: 'subjective_q', title: 'Q8: Sentence Correction', urduTitle: 'سوال نمبر 8: جملوں کی درستگی', content: ud.sentenceCorrection, isUrdu: true, marks: 5 })
            if (ud.mazmoon) initialSections.push({ id: 'urdu-mazmoon', type: 'subjective_q', title: 'Q9: Essay', urduTitle: 'سوال نمبر 9: مضمون', content: ud.mazmoon, isUrdu: true, marks: 20 })
        } else {
            if (paperData.shortQuestions && paperData.shortQuestions.length > 0) {
                initialSections.push({
                    id: 'english-short-qs',
                    type: 'subjective_q',
                    title: 'SECTION-B (SHORT QUESTIONS)',
                    content: paperData.shortQuestions.map((q: any) => q.en),
                    isUrdu: false,
                    marks: paperData.shortQuestions.length * 2
                })
            }
            if (paperData.longQuestions && paperData.longQuestions.length > 0) {
                paperData.longQuestions.forEach((q: any, idx: number) => {
                    initialSections.push({
                        id: `english-long-q-${idx}`,
                        type: 'subjective_q',
                        title: `QUESTION NO. ${idx + 5}`,
                        content: q.en,
                        isUrdu: false,
                        marks: 10
                    })
                })
            }
        }

        setSections(initialSections)
    }, [paperData])

    // --- DND LOGIC ---

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over?.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    // --- ACTIONS ---

    const deleteSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id))
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const applyBulkStyle = (style: Partial<Section['styles']>) => {
        setSections(prev => prev.map(s =>
            selectedIds.includes(s.id) ? { ...s, styles: { ...s.styles, ...style } } : s
        ))
    }

    const addSection = () => {
        const newSection: Section = {
            id: `new-${Date.now()}`,
            type: 'subjective_q',
            title: 'New Subjective Question',
            content: 'Click here to edit the new question content...',
            marks: 5,
            isUrdu: paperData.paperInfo.subject === 'Urdu'
        }
        setSections(prev => [...prev, newSection])
    }

    // --- SLASH COMMANDS ---

    const commands = useMemo(() => [
        {
            id: 'font', name: 'Change Font', desc: '/Font [size] [target]', icon: Type, keywords: ['size', 'text'], action: (cmd: string) => {
                const match = cmd.match(/\/font\s+(\d+)/i)
                if (match) applyBulkStyle({ fontSize: parseInt(match[1]) })
            }
        },
        {
            id: 'bold', name: 'Toggle Bold', desc: '/Bold', icon: Type, keywords: ['bold', 'weight'], action: () => {
                applyBulkStyle({ fontWeight: 'bold' })
            }
        },
        {
            id: 'delete', name: 'Delete Selection', desc: '/DeleteSection', icon: Trash2, keywords: ['remove', 'delete'], action: () => {
                setSections(prev => prev.filter(s => !selectedIds.includes(s.id)))
                setSelectedIds([])
            }
        },
        {
            id: 'italic', name: 'Toggle Italic', desc: '/Italic', icon: Type, keywords: ['italic', 'slope'], action: () => {
                applyBulkStyle({ fontStyle: 'italic' })
            }
        },
        {
            id: 'underline', name: 'Toggle Underline', desc: '/Underline', icon: Type, keywords: ['underline', 'link'], action: () => {
                applyBulkStyle({ textDecoration: 'underline' })
            }
        },
        {
            id: 'official', name: 'Reset Styling', desc: '/ResetStyle', icon: Layout, keywords: ['reset', 'normal'], action: () => {
                applyBulkStyle({ fontStyle: 'normal', textDecoration: 'none', fontWeight: 'normal' })
            }
        },
        {
            id: 'lang', name: 'Switch Language', desc: '/SwitchLanguage', icon: Languages, keywords: ['urdu', 'english'], action: () => {
                setSections(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, isUrdu: !s.isUrdu } : s))
            }
        }
    ], [selectedIds])

    const filteredCommands = useMemo(() => {
        if (!commandQuery) return commands
        return commands.filter(c =>
            c.name.toLowerCase().includes(commandQuery.toLowerCase()) ||
            c.keywords.some(k => k.includes(commandQuery.toLowerCase()))
        )
    }, [commandQuery, commands])

    // --- RENDERERS ---

    const renderSection = (section: Section) => {
        const style = {
            fontSize: section.styles?.fontSize ? `${section.styles.fontSize}px` : undefined,
            fontWeight: section.styles?.fontWeight,
            fontStyle: section.styles?.fontStyle,
            textDecoration: section.styles?.textDecoration,
            textAlign: section.styles?.textAlign,
            color: section.styles?.color,
            fontFamily: section.isUrdu
                ? "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif"
                : "'Times New Roman', Times, serif"
        }

        switch (section.type) {
            case 'header':
                return (
                    <div className="border-b-2 border-black pb-4 mb-6" style={style}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-[12px] font-bold italic">
                                <EditableText
                                    value={safeRender(section.content.session || "Inter Part-I (Session 2025-26)")}
                                    onSave={() => { }}
                                    isEditing={isEditing}
                                />
                            </div>
                            <div className="text-center flex-1">
                                <h1 className="text-xl font-bold uppercase underline decoration-double underline-offset-4">
                                    <EditableText
                                        value={safeRender(section.content.schoolName || "Academic Institution")}
                                        onSave={() => { }}
                                        isEditing={isEditing}
                                    />
                                </h1>
                                <p className="text-md font-bold mt-1">
                                    <EditableText
                                        value={safeRender(section.content.systemBadge || "EXAMINATION SYSTEM")}
                                        onSave={() => { }}
                                        isEditing={isEditing}
                                    />
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 text-[13px] font-bold mt-4 border-t border-black pt-2">
                            <div>
                                SUBJECT: <span className="uppercase">
                                    <EditableText
                                        value={safeRender(paperData.paperInfo.subject)}
                                        onSave={() => { }}
                                        isEditing={isEditing}
                                    />
                                </span>
                            </div>
                            <div className="text-center">
                                CLASS: <span className="uppercase">
                                    <EditableText
                                        value={safeRender(paperData.paperInfo.class)}
                                        onSave={() => { }}
                                        isEditing={isEditing}
                                    />
                                </span>
                            </div>
                            <div className="text-right">
                                <EditableText
                                    value={safeRender(section.content.paperLabel || "PAPER: II (Objective)")}
                                    onSave={() => { }}
                                    isEditing={isEditing}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 text-[13px] font-bold">
                            <div>
                                <EditableText
                                    value={safeRender(section.content.timeObjective || "TIME: 1.45 Hours")}
                                    onSave={() => { }}
                                    isEditing={isEditing}
                                />
                            </div>
                            <div className="text-center uppercase">Objective Type</div>
                            <div className="text-right">
                                <EditableText
                                    value={safeRender(section.content.marksObjective || "MARKS: 12")}
                                    onSave={() => { }}
                                    isEditing={isEditing}
                                />
                            </div>
                        </div>
                    </div>
                )
            case 'roll_no':
                return (
                    <div className="flex justify-end mb-4">
                        <div className="border-2 border-black p-2 text-sm font-bold min-w-[200px]" style={style}>
                            <EditableText
                                value={safeRender(section.content.label || "Roll No: ______________")}
                                onSave={() => { }}
                                isEditing={isEditing}
                            />
                        </div>
                    </div>
                )
            case 'instruction':
                return (
                    <div className="text-[12px] font-bold mb-4 border border-black p-1 text-center" style={style}>
                        <EditableText
                            value={safeRender(section.content.text)}
                            onSave={() => { }}
                            isEditing={isEditing}
                            tagName="p"
                        />
                    </div>
                )
            case 'mcq_group':
                return (
                    <div className="mb-8" style={style} dir={section.isUrdu ? "rtl" : "ltr"}>
                        <p className={cn("font-bold text-[14px] mb-4", section.isUrdu && "font-urdu")}>{section.urduTitle || section.title}</p>
                        <div className="space-y-6">
                            {section.content.map((mcq: any, idx: number) => {
                                const originalIdx = paperData.mcqs.indexOf(mcq);
                                return (
                                    <div key={idx} className="page-break-inside-avoid border-b border-dotted border-zinc-300 pb-4 mb-2">
                                        <div className="flex gap-4 items-start">
                                            <span className="font-bold min-w-[20px] text-[14px]">{originalIdx + 1}.</span>
                                            <div className="flex-1">
                                                <EditableText
                                                    value={safeRender(section.isUrdu ? mcq.ur : mcq.en)}
                                                    onSave={(val) => {
                                                        const newMcqs = [...paperData.mcqs]
                                                        newMcqs[originalIdx] = { ...mcq, [section.isUrdu ? 'ur' : 'en']: val }
                                                        setPaperData({ ...paperData, mcqs: newMcqs })
                                                    }}
                                                    isEditing={isEditing}
                                                    className={cn("text-[14px]", section.isUrdu && "font-urdu")}
                                                    dir={section.isUrdu ? "rtl" : "ltr"}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-x-4 mt-2 border-t border-dotted border-zinc-200 pt-2">
                                            {mcq.options.map((opt: any, oIdx: number) => (
                                                <div key={oIdx} className="flex items-start text-[12px] gap-2">
                                                    <span className="font-bold">
                                                        ({section.isUrdu ? ['الف', 'ب', 'ج', 'د'][oIdx] : String.fromCharCode(65 + oIdx)})
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <EditableText
                                                            value={safeRender(section.isUrdu ? opt.ur : opt.en)}
                                                            onSave={(val) => {
                                                                const newMcqs = [...paperData.mcqs]
                                                                const newOptions = [...mcq.options]
                                                                newOptions[oIdx] = { ...opt, [section.isUrdu ? 'ur' : 'en']: val }
                                                                newMcqs[originalIdx] = { ...mcq, options: newOptions }
                                                                setPaperData({ ...paperData, mcqs: newMcqs })
                                                            }}
                                                            isEditing={isEditing}
                                                            className={cn("text-[12px]", section.isUrdu && "font-urdu")}
                                                            dir={section.isUrdu ? "rtl" : "ltr"}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            case 'subjective_q':
                return (
                    <div className="mb-8" style={style} dir={section.isUrdu ? "rtl" : "ltr"}>
                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                            <span className={cn(section.isUrdu && "font-urdu")}>{section.urduTitle || section.title}</span>
                            <span>({section.marks})</span>
                        </div>

                        {Array.isArray(section.content) ? (
                            <div className="space-y-4 px-4">
                                {section.content.map((item: any, idx: number) => (
                                    <div key={idx} className="page-break-inside-avoid">
                                        {typeof item === 'string' ? (
                                            <EditableText value={safeRender(item)} onSave={() => { }} isEditing={isEditing} dir={section.isUrdu ? "rtl" : "ltr"} className={cn("text-[14px]", section.isUrdu && "font-urdu")} />
                                        ) : item.couplet ? (
                                            <div className="text-center font-bold">
                                                <EditableText value={safeRender(item.couplet)} onSave={() => { }} isEditing={isEditing} dir={section.isUrdu ? "rtl" : "ltr"} className={cn("text-[16px]", section.isUrdu && "font-urdu")} />
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 text-justify">
                                <EditableText
                                    value={safeRender(section.content.paragraph || section.content.prompt || section.content.lessonTitle || section.content.poemTitle || section.content)}
                                    onSave={() => { }}
                                    isEditing={isEditing}
                                    dir={section.isUrdu ? "rtl" : "ltr"}
                                    className={cn("text-[14px]", section.isUrdu && "font-urdu leading-relaxed")}
                                />
                            </div>
                        )}
                    </div>
                )
            default:
                return <div className="p-4">Unknown Section Type</div>
        }
    }

    return (
        <div className="relative group/editor scroll-smooth">
            {/* Command Palette Overlay */}
            <AnimatePresence>
                {activeCommand === '/' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 no-print"
                        onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveCommand(null) }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-[500px] bg-white rounded-[32px] shadow-[0_64px_128px_-24px_rgba(0,0,0,0.4)] border border-white overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 pb-4">
                                <div className="flex items-center gap-4 bg-zinc-100 p-6 rounded-[24px] ring-1 ring-zinc-200 focus-within:ring-emerald-500/50 transition-all shadow-inner">
                                    <Command className="w-6 h-6 text-emerald-600" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Enter command (e.g. /font 18)..."
                                        className="flex-1 bg-transparent text-xl font-bold outline-none text-zinc-800 placeholder:text-zinc-400"
                                        value={commandQuery}
                                        onChange={(e) => setCommandQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setActiveCommand(null)
                                            if (e.key === 'Enter' && filteredCommands.length > 0) {
                                                filteredCommands[0].action(commandQuery)
                                                setActiveCommand(null)
                                                setCommandQuery('')
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="p-4 pt-0 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {filteredCommands.map((cmd) => (
                                    <button
                                        key={cmd.id}
                                        onClick={() => {
                                            if (cmd.id === 'font') return; // Let them type size
                                            cmd.action('')
                                            setActiveCommand(null)
                                        }}
                                        className="w-full flex items-center gap-5 p-5 hover:bg-zinc-50 rounded-[20px] transition-all group/item"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center group-hover/item:scale-110 group-hover/item:rotate-3 group-hover/item:bg-white group-hover/item:shadow-lg transition-all">
                                            <cmd.icon className="w-6 h-6 text-zinc-400 group-hover/item:text-emerald-600" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-black text-sm text-zinc-800 tracking-wide">{cmd.name}</p>
                                            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">{cmd.desc}</p>
                                        </div>
                                        <div className="text-[10px] font-black text-emerald-500 opacity-0 group-hover/item:opacity-100">RUN CMD</div>
                                    </button>
                                ))}
                            </div>

                            <div className="bg-zinc-50 p-6 flex justify-between items-center text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">
                                <span>Esc to Close</span>
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border border-zinc-200 flex items-center justify-center">↵</div>
                                    Select
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Editor Container */}
            <div className="max-w-[880px] mx-auto bg-white shadow-[0_100px_100px_-50px_rgba(0,0,0,0.15)] min-h-[1200px] relative font-sans text-black overflow-hidden ring-1 ring-zinc-200 rounded-[2px] mb-24">

                {/* Floating Controls */}
                <div className="absolute top-10 left-10 z-[200] flex flex-col gap-4 no-print">
                    <button
                        onClick={addSection}
                        className="flex items-center gap-4 px-6 py-3 bg-zinc-900 text-white rounded-[20px] transition-all text-[11px] font-black uppercase tracking-widest border border-white/10 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.4)] hover:scale-110 active:scale-95 group"
                    >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span>Add Section</span>
                    </button>

                    <button
                        onClick={() => setActiveCommand('/')}
                        className="flex items-center gap-4 px-6 py-3 bg-zinc-900 text-white rounded-[20px] transition-all text-[11px] font-black uppercase tracking-widest border border-white/10 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.4)] hover:scale-110 active:scale-95 group"
                    >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Command className="w-4 h-4" />
                        </div>
                        <span>Architect Tool</span>
                    </button>

                    <button className="flex items-center gap-4 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-[20px] transition-all text-[11px] font-black uppercase tracking-widest border border-zinc-200 hover:bg-zinc-200">
                        <Printer className="w-4 h-4" />
                        <span>Print Ready</span>
                    </button>
                </div>

                {/* Paper Content */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="p-20 pt-40 space-y-4">
                            {sections.map(section => (
                                <SortableSection
                                    key={section.id}
                                    id={section.id}
                                    onDelete={() => deleteSection(section.id)}
                                    isSelected={selectedIds.includes(section.id)}
                                    onSelect={() => toggleSelect(section.id)}
                                >
                                    {renderSection(section)}
                                </SortableSection>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* No Overlays to match Standard View */}
            </div>

            {/* Bulk Bottom Toolbar */}
            <AnimatePresence>
                {isEditing && selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] p-1 bg-zinc-950/20 backdrop-blur-3xl rounded-[40px] shadow-[0_48px_64px_-16px_rgba(0,0,0,0.4)] ring-1 ring-white/20 no-print"
                    >
                        <div className="bg-zinc-900 text-white rounded-[38px] px-10 py-6 flex items-center gap-10">
                            <div className="flex flex-col border-r border-white/10 pr-10">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Architect Selection</span>
                                <span className="text-lg font-black text-emerald-400">{selectedIds.length} <span className="text-zinc-400 font-medium">Items</span></span>
                            </div>

                            <div className="flex items-center gap-4">
                                {[
                                    { l: 'S', s: 14, d: '14px' },
                                    { l: 'M', s: 18, d: '18px' },
                                    { l: 'L', s: 24, d: '24px' },
                                    { l: 'XL', s: 36, d: '36px' }
                                ].map(x => (
                                    <button
                                        key={x.l}
                                        onClick={() => applyBulkStyle({ fontSize: x.s })}
                                        className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center hover:bg-emerald-500 transition-all group/b"
                                    >
                                        <span className="text-xs font-black">{x.l}</span>
                                        <span className="text-[8px] font-bold text-zinc-500 group-hover/b:text-emerald-100">{x.d}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-8 bg-white/10" />

                            <div className="flex items-center gap-3">
                                <button onClick={() => applyBulkStyle({ fontWeight: 'bold' })} className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-emerald-500 transition-all font-bold text-lg" title="Bold">B</button>
                                <button onClick={() => applyBulkStyle({ fontStyle: 'italic' })} className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-emerald-500 transition-all font-serif italic text-lg" title="Italic">I</button>
                                <button onClick={() => applyBulkStyle({ textDecoration: 'underline' })} className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-emerald-500 transition-all underline text-lg" title="Underline">U</button>
                                <button onClick={() => applyBulkStyle({ textAlign: 'center' })} className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center hover:bg-emerald-500 transition-all" title="Center Align"><Layout className="w-5 h-5" /></button>
                                <button onClick={() => setSelectedIds([])} className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
