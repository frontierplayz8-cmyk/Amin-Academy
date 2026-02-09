import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'
import { EditableText } from './EditableText'

interface PaperRendererProps {
    paperData: any
    selectedSectionIds?: string[]
    onSectionClick?: (id: string, e: React.MouseEvent) => void
    sectionStyles?: Record<string, any>
    isEditing?: boolean
    setPaperData?: (data: any) => void
}

const safeRender = (val: any) => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    return String(val);
};

export function PaperRenderer({ paperData, selectedSectionIds = [], onSectionClick, sectionStyles = {}, isEditing = false, setPaperData }: PaperRendererProps) {
    if (!paperData) return null

    const isUrdu = paperData.paperInfo?.subject === 'Urdu'
    const isEnglish = paperData.paperInfo?.subject === 'English'

    const getSectionStyle = (id: string) => {
        return sectionStyles[id] || {}
    }

    const wrapSection = (id: string, children: React.ReactNode, additionalClasses = "") => (
        <div
            id={id}
            onClick={(e) => {
                e.stopPropagation()
                onSectionClick?.(id, e)
            }}
            className={cn(
                "cursor-pointer transition-all relative group/section",
                selectedSectionIds.includes(id) ? 'ring-2 ring-emerald-500 ring-offset-2 rounded-sm bg-emerald-500/5' : 'hover:ring-1 hover:ring-zinc-200',
                additionalClasses
            )}
            style={getSectionStyle(id)}
        >
            {/* Hover indicator & Drag Handle for sections */}
            {isEditing && (
                <div className="absolute -left-10 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all cursor-grab active:cursor-grabbing">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-1 h-12 bg-emerald-500/20 rounded-full" />
                        <LucideIcons.GripVertical size={16} className="text-emerald-500/40" />
                        <div className="w-1 h-12 bg-emerald-500/20 rounded-full" />
                    </div>
                </div>
            )}
            {children}
        </div>
    )

    const renderWords = (parentId: string, text: string, style: any = {}) => {
        if (!text) return null;
        return text.split(' ').map((word, i) => {
            const wordId = `${parentId}-w-${i}`;
            return (
                <span
                    key={i}
                    id={wordId}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSectionClick?.(wordId, e);
                    }}
                    className={cn(
                        "inline-block hover:bg-emerald-500/10 rounded-sm transition-all cursor-pointer",
                        selectedSectionIds.includes(wordId) && "ring-1 ring-emerald-500 bg-emerald-500/5 px-0.5"
                    )}
                    style={getSectionStyle(wordId)}
                >
                    {word}{' '}
                </span>
            );
        });
    }

    const renderEditable = (id: string, value: any, onSave: (val: string) => void, props: any = {}) => {
        const isSelected = selectedSectionIds.includes(id)
        const textValue = safeRender(value);

        return (
            <EditableText
                id={id}
                value={textValue}
                onSave={onSave}
                isEditing={isEditing}
                style={getSectionStyle(id)}
                onClick={(e) => {
                    e.stopPropagation()
                    onSectionClick?.(id, e)
                }}
                className={cn(
                    props.className,
                    isSelected && "ring-2 ring-emerald-500 ring-offset-1 rounded-sm bg-emerald-500/5",
                    "transition-all"
                )}
                {...props}
            />
        )
    }

    const renderCreativeElement = (el: any, index: number) => {
        const isSelected = selectedSectionIds.includes(el.id)
        const isMultiSelecting = selectedSectionIds.length > 1;

        return (
            <motion.div
                key={el.id}
                drag
                dragMomentum={false}
                dragControls={undefined} // Potential for custom controls if needed
                onDragStart={() => {
                    // Optional: visual feedback when starting drag
                }}
                onDragEnd={(_, info) => {
                    const newElements = [...(paperData.floatingElements || [])]
                    const deltaX = info.offset.x;
                    const deltaY = info.offset.y;

                    if (isSelected && isMultiSelecting) {
                        // Move ALL selected floating elements
                        selectedSectionIds.forEach(id => {
                            const foundIdx = newElements.findIndex(fe => fe.id === id);
                            if (foundIdx !== -1) {
                                const targetEl = newElements[foundIdx];
                                newElements[foundIdx] = {
                                    ...targetEl,
                                    x: (targetEl.x || 0) + deltaX,
                                    y: (targetEl.y || 0) + deltaY
                                }
                            }
                        });
                    } else {
                        // Move just THIS element
                        newElements[index] = {
                            ...el,
                            x: (el.x || 0) + deltaX,
                            y: (el.y || 0) + deltaY
                        }
                    }
                    setPaperData?.({ ...paperData, floatingElements: newElements })
                }}
                initial={{ x: el.x || 0, y: el.y || 0 }}
                style={{
                    position: 'absolute',
                    zIndex: el.zIndex || 50,
                    ...getSectionStyle(el.id)
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    onSectionClick?.(el.id, e)
                }}
                className={cn(
                    "group relative pointer-events-auto",
                    isSelected && "ring-2 ring-emerald-500 rounded-sm"
                )}
            >
                {/* Drag Handle - Essential for Text elements to prevent contentEditable interference */}
                <div
                    className={cn(
                        "absolute -left-6 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-900 border border-white/10 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-[60] shadow-xl",
                        isSelected && "opacity-100 border-emerald-500/50 text-emerald-500"
                    )}
                >
                    <LucideIcons.GripVertical size={14} />
                </div>

                {el.type === 'text' && (
                    <div className="min-w-[50px]">
                        {renderEditable(el.id, el.content, (val) => {
                            const newElements = [...(paperData.floatingElements || [])]
                            newElements[index] = { ...el, content: val }
                            setPaperData?.({ ...paperData, floatingElements: newElements })
                        })}
                    </div>
                )}
                {el.type === 'icon' && (
                    <div className="p-1 cursor-grab" style={{ color: getSectionStyle(el.id).color }}>
                        {React.createElement((LucideIcons as any)[el.iconName || 'Star'], {
                            size: el.size || 24,
                            className: "text-inherit"
                        })}
                    </div>
                )}
                {el.type === 'qr' && (
                    <div className="bg-white p-1 rounded shadow-sm cursor-grab">
                        <QRCodeSVG value={el.content || 'https://aminacademy.pk'} size={el.size || 60} />
                    </div>
                )}

                {isSelected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            const newElements = paperData.floatingElements.filter((_: any, i: number) => i !== index)
                            setPaperData?.({ ...paperData, floatingElements: newElements })
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-[60]"
                    >
                        <LucideIcons.X size={10} />
                    </button>
                )}
            </motion.div>
        )
    }

    const themeClass = paperData.currentTheme === 'royal' ? "font-serif bg-amber-50/20 border-8 border-double border-amber-200 shadow-inner" :
        paperData.currentTheme === 'minimal' ? "font-light bg-zinc-50 border-none" :
            paperData.currentTheme === 'classic' ? "font-serif bg-white ring-1 ring-black" : "bg-white"

    // Helper to update specific fields
    const updateHeaderDetail = (key: string, val: string) => {
        if (!setPaperData) return
        setPaperData({
            ...paperData,
            headerDetails: { ...paperData.headerDetails, [key]: val }
        })
    }

    const updatePaperInfo = (key: string, val: string) => {
        if (!setPaperData) return
        setPaperData({
            ...paperData,
            paperInfo: { ...paperData.paperInfo, [key]: val }
        })
    }

    const updateMcq = (idx: number, field: 'en' | 'ur', val: string) => {
        if (!setPaperData) return
        const newMcqs = [...paperData.mcqs]
        newMcqs[idx] = { ...newMcqs[idx], [field]: val }
        setPaperData({ ...paperData, mcqs: newMcqs })
    }

    const updateMcqOption = (qIdx: number, oIdx: number, field: 'en' | 'ur', val: string) => {
        if (!setPaperData) return
        const newMcqs = [...paperData.mcqs]
        const newOptions = [...newMcqs[qIdx].options]
        newOptions[oIdx] = { ...newOptions[oIdx], [field]: val }
        newMcqs[qIdx] = { ...newMcqs[qIdx], options: newOptions }
        setPaperData({ ...paperData, mcqs: newMcqs })
    }

    const updateShortQuestion = (idx: number, field: 'en' | 'ur', val: string) => {
        if (!setPaperData) return
        const newSqs = [...paperData.shortQuestions]
        newSqs[idx] = { ...newSqs[idx], [field]: val }
        setPaperData({ ...paperData, shortQuestions: newSqs })
    }

    const convertNumberToWord = (num: number) => {
        const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
        return words[num] || num.toString()
    }

    // Helper for updating generic labels
    const updateLabel = (key: string, val: string) => {
        if (!setPaperData) return
        setPaperData({
            ...paperData,
            labels: { ...paperData.labels, [key]: val }
        })
    }

    // Get label with fallback
    const getLabel = (key: string, defaultVal: string) => {
        return paperData.labels?.[key] || defaultVal
    }


    const pageStyle = sectionStyles.page || {}
    const pageSize = pageStyle.size || 'a4'
    const paddingX = pageStyle.paddingX || '64px'
    const paddingY = pageStyle.paddingY || '64px'
    const contentScale = (pageStyle.contentScale || 100) / 100
    const theme = pageStyle.theme || 'clean'

    const sizeClasses = {
        'a4': 'w-[210mm] min-h-[297mm]',
        'legal': 'w-[216mm] min-h-[356mm]',
        'letter': 'w-[216mm] min-h-[279mm]',
        'custom': 'w-full min-h-screen'
    }

    const themeStyles = {
        'clean': 'bg-white shadow-2xl',
        'vintage': 'bg-[#fdf6e3] shadow-2xl sepia-[0.1]',
        'grid': 'bg-white shadow-2xl bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]'
    }

    return (
        <div
            id="paper-canvas"
            className={cn(
                "relative mx-auto border border-zinc-200 transition-all duration-700 pdf-capture-safe rounded-sm text-black pt-16",
                sizeClasses[pageSize as keyof typeof sizeClasses] || sizeClasses['a4'],
                themeClass // Applying Royal, Modern, Minimal themes
            )}
            style={{
                paddingLeft: paddingX,
                paddingRight: paddingX,
                paddingTop: paddingY,
                paddingBottom: paddingY,
                fontFamily: themeClass.includes('font-serif') ? "'Times New Roman', serif" : "'Inter', sans-serif"
            }}
        >
            {/* Watermark Overlay */}
            {(paperData.watermark?.text || paperData.watermark?.image) && (
                <div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0"
                    style={{ opacity: paperData.watermark?.opacity || 0.1 }}
                >
                    {paperData.watermark?.image ? (
                        <img
                            src={paperData.watermark.image}
                            alt="Watermark"
                            className="w-1/2 h-auto"
                            style={{ transform: `rotate(${paperData.watermark?.rotation || -45}deg)` }}
                        />
                    ) : (
                        <div
                            className="text-[120px] font-black uppercase tracking-[20px] select-none text-zinc-300"
                            style={{ transform: `rotate(${paperData.watermark?.rotation || -45}deg)` }}
                        >
                            {paperData.watermark?.text}
                        </div>
                    )}
                </div>
            )}

            <div
                className="relative z-10"
                style={{ transform: `scale(${contentScale})`, transformOrigin: 'top center' }}
            >
                <Reorder.Group
                    axis="y"
                    values={paperData.sectionOrder || ['header', 'mcqs', 'subjective-header', 'short-questions', 'english-special-sections', 'urdu-special-sections', 'long-questions']}
                    onReorder={(newOrder) => {
                        if (setPaperData) {
                            setPaperData({ ...paperData, sectionOrder: newOrder });
                        }
                    }}
                    className="relative"
                >
                    {/* Dynamic Section Rendering */}
                    {(paperData.sectionOrder || ['header', 'mcqs', 'subjective-header', 'short-questions', 'english-special-sections', 'urdu-special-sections', 'long-questions']).map((sectionKey: string) => {
                        const renderSectionContent = () => {
                            if (sectionKey === 'header') {
                                return (
                                    <div key="header" className="section-container">
                                        {wrapSection('header-section', (
                                            <div className="border-b-2 border-black pb-4 mb-6">
                                                <div className="flex justify-between items-center mb-4 gap-6">
                                                    {/* Logo Left */}
                                                    {paperData.logo?.url && paperData.logo?.position === 'left' && (
                                                        <div className="w-24 h-24 flex-shrink-0">
                                                            <img src={paperData.logo.url} alt="Logo" className="w-full h-full object-contain" />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 flex flex-col items-center">
                                                        <div className="flex justify-between w-full items-start mb-2">
                                                            <div className="text-[12px] font-bold italic">
                                                                {renderEditable('header_session', paperData.headerDetails?.session || "Inter Part-I (Session 2025-26)", (val) => updateHeaderDetail('session', val))}
                                                            </div>

                                                            {/* Logo Center */}
                                                            {paperData.logo?.url && paperData.logo?.position === 'center' && (
                                                                <div className="w-20 h-20 mb-2">
                                                                    <img src={paperData.logo.url} alt="Logo" className="w-full h-full object-contain" />
                                                                </div>
                                                            )}

                                                            <div className="border-2 border-black p-2 text-sm font-bold min-w-[200px]">
                                                                {renderEditable('header_rollno', paperData.headerDetails?.rollNoLabel || "Roll No: ______________", (val) => updateHeaderDetail('rollNoLabel', val))}
                                                            </div>
                                                        </div>

                                                        <div className="text-center overflow-hidden w-full">
                                                            <h1 className="text-2xl font-black uppercase underline decoration-double underline-offset-4 leading-tight mb-2">
                                                                {isEditing && !selectedSectionIds.includes('header_school') ?
                                                                    <div id="header_school" onClick={(e) => { e.stopPropagation(); onSectionClick?.('header_school', e); }}>
                                                                        {renderWords('header_school', paperData.headerDetails?.schoolName || "")}
                                                                    </div>
                                                                    : renderEditable('header_school', paperData.headerDetails?.schoolName || "Amin Model High School and Science Academy", (val) => updateHeaderDetail('schoolName', val))
                                                                }
                                                            </h1>
                                                            <p className="text-md font-bold text-zinc-800">
                                                                {renderEditable('header_system', paperData.headerDetails?.systemBadge || "BISE REPLICA EXAMINATION SYSTEM", (val) => updateHeaderDetail('systemBadge', val))}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Logo Right */}
                                                    {paperData.logo?.url && paperData.logo?.position === 'right' && (
                                                        <div className="w-24 h-24 flex-shrink-0">
                                                            <img src={paperData.logo.url} alt="Logo" className="w-full h-full object-contain" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-3 text-[13px] font-bold mt-4 border-t border-black pt-2">
                                                    <div>
                                                        <span className="mr-1">
                                                            {renderEditable('lbl_subject', getLabel('lbl_subject', 'SUBJECT:'), (val) => updateLabel('lbl_subject', val))}
                                                        </span>
                                                        <span className="uppercase">
                                                            {renderEditable('info_subject', paperData.paperInfo.subject, (val) => updatePaperInfo('subject', val))}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="mr-1">
                                                            {renderEditable('lbl_class', getLabel('lbl_class', 'CLASS:'), (val) => updateLabel('lbl_class', val))}
                                                        </span>
                                                        <span className="uppercase">
                                                            {renderEditable('info_class', paperData.paperInfo.class, (val) => updatePaperInfo('class', val))}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        {renderEditable('header_paper_label', paperData.headerDetails?.paperLabel || "PAPER: II (Objective)", (val) => updateHeaderDetail('paperLabel', val))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                            if (sectionKey === 'mcqs' && paperData.mcqs?.length > 0) {
                                return (
                                    <div key="mcqs" className="section-container">
                                        {wrapSection('mcqs', (
                                            <div className="mb-8">
                                                <div className="text-[12px] font-bold mb-2 border border-black p-1 text-center">
                                                    {renderEditable('mcq_instruction', paperData.headerDetails?.mcqInstruction || "Note: You have four choices for each objective type question as A, B, C and D. The choice which you think is correct, fill that circle in front of that question number.", (val) => updateHeaderDetail('mcqInstruction', val), { tagName: "p" })}
                                                </div>

                                                <div className={cn(
                                                    "space-y-6",
                                                    paperData.layout?.mcqColumns === 2 && "grid grid-cols-2 gap-x-8 gap-y-0 space-y-0 items-start"
                                                )}>
                                                    {(() => {
                                                        const usedMcqIndices = new Set<number>();

                                                        if (paperData.paperInfo.subject === "English") {
                                                            const mcqGroups = [
                                                                { type: "verb_form", title: "(A)- Choose the correct form of verb.", key: "grp_verb" },
                                                                { type: "spelling", title: "(B)- Choose the word with correct spellings.", key: "grp_spell" },
                                                                { type: "meaning", title: "(C)- Choose the correct meanings of the underlined word.", key: "grp_mean" },
                                                                { type: "grammar", title: "(D)- Choose the correct grammar.", key: "grp_gram" }
                                                            ];

                                                            const renderedGroups = mcqGroups.map((group, gIdx) => {
                                                                const groupMcqs = paperData.mcqs.filter((m: any, idx: number) => {
                                                                    if (m.type === group.type) {
                                                                        usedMcqIndices.add(idx)
                                                                        return true;
                                                                    }
                                                                    return false;
                                                                });
                                                                if (groupMcqs.length === 0) return null;

                                                                return (
                                                                    <div key={gIdx} className="mb-6" id={group.key}>
                                                                        <p className="font-bold text-[14px] mb-2">
                                                                            {renderEditable(group.key, getLabel(group.key, group.title), (val) => updateLabel(group.key, val))}
                                                                        </p>
                                                                        {groupMcqs.map((mcq: any) => {
                                                                            const originalIdx = paperData.mcqs.indexOf(mcq);
                                                                            const mcqItemId = `mcq-item-${originalIdx}`;
                                                                            return (
                                                                                <div key={originalIdx} id={mcqItemId}
                                                                                    onClick={(e) => { e.stopPropagation(); onSectionClick?.(mcqItemId, e); }}
                                                                                    className={cn(
                                                                                        "page-break-inside-avoid border-b border-dotted border-zinc-300 pb-4 mb-2 cursor-pointer hover:bg-zinc-50/50 transition-colors rounded",
                                                                                        selectedSectionIds.includes(mcqItemId) && "ring-2 ring-emerald-500 ring-inset"
                                                                                    )}
                                                                                    style={getSectionStyle(mcqItemId)}
                                                                                >
                                                                                    <div className="flex justify-between items-start mb-1">
                                                                                        <div className="text-[14px] flex-1 pr-4">
                                                                                            <span className="font-bold mr-2">{originalIdx + 1}.</span>
                                                                                            {selectedSectionIds.some(id => id.startsWith(`mcq-${originalIdx}-question`)) && !selectedSectionIds[0]?.includes('-w-') ?
                                                                                                renderEditable(`mcq-${originalIdx}-question`, mcq.en, (val) => updateMcq(originalIdx, 'en', val)) :
                                                                                                <span id={`mcq-${originalIdx}-question`} className="inline-block" onClick={(e) => { e.stopPropagation(); onSectionClick?.(`mcq-${originalIdx}-question`, e); }}>
                                                                                                    {renderWords(`mcq-${originalIdx}-question`, mcq.en)}
                                                                                                </span>
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-4 gap-x-2 mt-2 border-t border-dotted border-zinc-200 pt-1" id={`mcq-opts-cont-${originalIdx}`}>
                                                                                        {mcq.options.map((opt: any, oIdx: number) => {
                                                                                            const optId = `mcq-${originalIdx}-opt-item-${oIdx}`;
                                                                                            return (
                                                                                                <div key={oIdx} id={optId}
                                                                                                    onClick={(e) => { e.stopPropagation(); onSectionClick?.(optId, e); }}
                                                                                                    className={cn(
                                                                                                        "flex items-start text-[12px] leading-tight group/opt cursor-pointer hover:bg-emerald-50/30 rounded px-1 transition-all",
                                                                                                        selectedSectionIds.includes(optId) && "ring-1 ring-emerald-400 bg-emerald-500/5"
                                                                                                    )}
                                                                                                    style={getSectionStyle(optId)}
                                                                                                >
                                                                                                    <span className="font-bold mr-2 mt-0.5">({String.fromCharCode(65 + oIdx)})</span>
                                                                                                    <div className="flex justify-between flex-1 min-w-0">
                                                                                                        <span className="block wrap-break-word">
                                                                                                            {renderEditable(`mcq-${originalIdx}-opt-${oIdx}`, opt.en, (val) => updateMcqOption(originalIdx, oIdx, 'en', val), { className: "px-0.5 rounded" })}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            });

                                                            const remainingMcqs = paperData.mcqs.filter((_: any, idx: number) => !usedMcqIndices.has(idx));
                                                            if (renderedGroups.some(g => g !== null)) {
                                                                return (
                                                                    <>
                                                                        {renderedGroups}
                                                                        {remainingMcqs.length > 0 && (
                                                                            <div className="mb-6">
                                                                                <p className="font-bold text-[14px] mb-2 text-red-500">
                                                                                    {renderEditable('grp_misc', getLabel('grp_misc', 'Miscellaneous Questions'), (val) => updateLabel('grp_misc', val))}
                                                                                </p>
                                                                                {remainingMcqs.map((mcq: any, i: number) => {
                                                                                    const originalIdx = paperData.mcqs.indexOf(mcq);
                                                                                    return (
                                                                                        <div key={originalIdx} className="page-break-inside-avoid border-b border-dotted border-zinc-300 pb-4 mb-2">
                                                                                            <div className="flex justify-between items-start mb-1">
                                                                                                <div className="text-[14px] flex-1 pr-4">
                                                                                                    <span className="font-bold mr-2">{originalIdx + 1}.</span>
                                                                                                    {renderEditable(`mcq-${originalIdx}-question`, mcq.en, (val) => updateMcq(originalIdx, 'en', val))}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-4 gap-x-2 mt-2 border-t border-dotted border-zinc-200 pt-1">
                                                                                                {mcq.options.map((opt: any, oIdx: number) => (
                                                                                                    <div key={oIdx} className="flex items-start text-[12px] leading-tight group">
                                                                                                        <span className="font-bold mr-2 mt-0.5">({String.fromCharCode(65 + oIdx)})</span>
                                                                                                        <div className="flex justify-between flex-1 min-w-0">
                                                                                                            <span className="block wrap-break-word">
                                                                                                                {renderEditable(`mcq-${originalIdx}-opt-${oIdx}`, opt.en, (val) => updateMcqOption(originalIdx, oIdx, 'en', val), { className: "hover:bg-zinc-100 px-0.5 rounded" })}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            }
                                                        }

                                                        if (paperData.paperInfo.subject === "Urdu") {
                                                            const urduMcqGroups = [
                                                                { type: "hissa_nasr", title: "(1)- حصہ نثر کے مطابق درست جواب کی نشاندہی کریں۔ (5 نمبر)", key: "grp_nasr" },
                                                                { type: "hissa_shairi", title: "(2)- حصہ شاعری کے مطابق درست جواب کی نشاندہی کریں۔ (5 نمبر)", key: "grp_shair" },
                                                                { type: "mcq_grammar", title: "(3)- مطابقت اور حروف کے درست استعمال کی نشاندہی کریں۔ (5 نمبر)", key: "grp_gram" },
                                                                { type: "mcq_usage", title: "(4)- رموزِ اوقاف اور جملوں کی درستگی کی نشاندہی کریں۔ (5 نمبر)", key: "grp_usage" }
                                                            ];

                                                            return urduMcqGroups.map((group, gIdx) => {
                                                                const groupMcqs = paperData.mcqs.filter((m: any, idx: number) => {
                                                                    if (m.type === group.type) {
                                                                        usedMcqIndices.add(idx)
                                                                        return true;
                                                                    }
                                                                    return false;
                                                                });
                                                                if (groupMcqs.length === 0) return null;

                                                                return (
                                                                    <div key={gIdx} className="mb-6 text-right" dir="rtl">
                                                                        <p className="font-urdu font-bold text-[18px] mb-4 border-b border-zinc-200 pb-2">
                                                                            {renderEditable(group.key, getLabel(group.key, group.title), (val) => updateLabel(group.key, val), { className: "font-urdu", dir: "rtl" })}
                                                                        </p>
                                                                        {groupMcqs.map((mcq: any) => {
                                                                            const originalIdx = paperData.mcqs.indexOf(mcq);
                                                                            return (
                                                                                <div key={originalIdx} id={`mcq-ur-${originalIdx}`}
                                                                                    onClick={(e) => { e.stopPropagation(); onSectionClick?.(`mcq-ur-${originalIdx}`, e); }}
                                                                                    className={cn(
                                                                                        "page-break-inside-avoid border-b border-dotted border-zinc-200 pb-8 mb-8 cursor-pointer hover:bg-zinc-50/50 transition-colors rounded",
                                                                                        selectedSectionIds.includes(`mcq-ur-${originalIdx}`) && "ring-2 ring-emerald-500 ring-inset"
                                                                                    )}
                                                                                    style={getSectionStyle(`mcq-ur-${originalIdx}`)}
                                                                                >
                                                                                    <div className="flex flex-row-reverse justify-between items-start mb-4">
                                                                                        <div className="font-urdu text-[18px] flex-1">
                                                                                            <span className="font-bold ml-4">{originalIdx + 1}-</span>
                                                                                            {renderEditable(`mcq-ur-${originalIdx}-question`, mcq.ur, (val) => updateMcq(originalIdx, 'ur', val), { className: "font-urdu", dir: "rtl" })}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2" id={`mcq-ur-opts-${originalIdx}`}>
                                                                                        {mcq.options.map((opt: any, oIdx: number) => {
                                                                                            const optId = `mcq-ur-${originalIdx}-opt-${oIdx}`;
                                                                                            return (
                                                                                                <div key={oIdx} id={optId}
                                                                                                    onClick={(e) => { e.stopPropagation(); onSectionClick?.(optId, e); }}
                                                                                                    className={cn(
                                                                                                        "flex flex-row-reverse items-start text-[16px] leading-relaxed group cursor-pointer hover:bg-emerald-50/30 rounded px-1 min-h-[40px]",
                                                                                                        selectedSectionIds.includes(optId) && "ring-1 ring-emerald-400 bg-emerald-500/5"
                                                                                                    )}
                                                                                                    style={getSectionStyle(optId)}
                                                                                                >
                                                                                                    <span className="font-urdu font-bold ml-2 text-emerald-600">({['الف', 'ب', 'ج', 'د'][oIdx]})</span>
                                                                                                    <div className="font-urdu flex-1 min-w-0 text-right">
                                                                                                        {renderEditable(optId, opt.ur, (val) => updateMcqOption(originalIdx, oIdx, 'ur', val), { className: "font-urdu", dir: "rtl" })}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            });
                                                        }

                                                        // Generic MCQ fallback Logic
                                                        const remainingMcqs = paperData.mcqs.filter((_: any, idx: number) => !usedMcqIndices.has(idx));
                                                        return remainingMcqs.map((mcq: any) => {
                                                            const originalIdx = paperData.mcqs.indexOf(mcq);
                                                            const mcqItemId = `mcq-item-${originalIdx}`;
                                                            return (
                                                                <div key={originalIdx} id={mcqItemId}
                                                                    onClick={(e) => { e.stopPropagation(); onSectionClick?.(mcqItemId, e); }}
                                                                    className={cn(
                                                                        "page-break-inside-avoid border-b border-dotted border-zinc-300 pb-8 mb-8 cursor-pointer hover:bg-zinc-50/50 transition-colors rounded",
                                                                        selectedSectionIds.includes(mcqItemId) && "ring-2 ring-emerald-500 ring-inset"
                                                                    )}
                                                                    style={getSectionStyle(mcqItemId)}
                                                                >
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <div className="text-[14px] flex-1 pr-4">
                                                                            <span className="font-bold mr-2">{originalIdx + 1}.</span>
                                                                            {renderEditable(`mcq-${originalIdx}-question`, mcq.en, (val) => updateMcq(originalIdx, 'en', val))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-4 gap-x-2 mt-2 border-t border-dotted border-zinc-200 pt-1">
                                                                        {mcq.options.map((opt: any, oIdx: number) => {
                                                                            const optId = `mcq-${originalIdx}-opt-${oIdx}`;
                                                                            return (
                                                                                <div key={oIdx} id={optId}
                                                                                    onClick={(e) => { e.stopPropagation(); onSectionClick?.(optId, e); }}
                                                                                    className={cn(
                                                                                        "flex items-start text-[12px] leading-tight group cursor-pointer hover:bg-emerald-50/30 rounded px-1 transition-all min-h-[32px] py-1",
                                                                                        selectedSectionIds.includes(optId) && "ring-1 ring-emerald-400 bg-emerald-500/5"
                                                                                    )}
                                                                                    style={getSectionStyle(optId)}
                                                                                >
                                                                                    <span className="font-bold mr-2 mt-0.5">({String.fromCharCode(65 + oIdx)})</span>
                                                                                    <div className="flex justify-between flex-1 min-w-0">
                                                                                        <span className="block wrap-break-word">
                                                                                            {renderEditable(optId, opt.en, (val) => updateMcqOption(originalIdx, oIdx, 'en', val))}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                            if (sectionKey === 'short-questions' && paperData.shortQuestions?.length > 0) {
                                return (
                                    <div key="short-questions" className="section-container">
                                        {wrapSection('short-questions', (
                                            <div className="mb-6">
                                                {(() => {
                                                    if (paperData.paperInfo.subject === "Urdu") {
                                                        return (
                                                            <div className="space-y-12" dir="rtl">
                                                                {paperData.urduData && paperData.urduData.shyrNazm && paperData.urduData.shyrNazm.length > 0 && (
                                                                    <div className="mb-8">
                                                                        <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                                            <span>
                                                                                {renderEditable('lbl_urdu_q2', getLabel('lbl_urdu_q2', 'سوال نمبر 2: مندرجہ ذیل اشعار کی تشریح کریں، نظم کا عنوان اور شاعر کا نام بھی لکھیں۔'), (val) => updateLabel('lbl_urdu_q2', val), { className: "font-urdu", dir: "rtl" })}
                                                                            </span>
                                                                            <span className="mr-2">(10)</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 gap-6 px-4">
                                                                            {paperData.urduData.shyrNazm.map((shyr: any, idx: number) => (
                                                                                <div key={idx} className="page-break-inside-avoid italic text-center text-[20px] font-urdu border-b border-dotted border-zinc-200 pb-4 leading-loose">
                                                                                    {renderEditable(`urdu_couplet_${idx}`, shyr.couplet, (val) => {
                                                                                        const newData = [...paperData.urduData.shyrNazm];
                                                                                        newData[idx] = { ...shyr, couplet: val };
                                                                                        if (setPaperData && paperData.urduData) setPaperData({ ...paperData, urduData: { ...paperData.urduData, shyrNazm: newData } });
                                                                                    }, { className: "font-urdu italic", dir: "rtl" })}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    }

                                                    // Standard English/Bilingual Short Questions
                                                    const chunks: Array<Array<{ data: any; globalIdx: number }>> = []
                                                    const rawQuestions = paperData.shortQuestions.map((q: any, i: number) => ({ data: q, globalIdx: i }))

                                                    for (let i = 0; i < rawQuestions.length; i += 6) {
                                                        chunks.push(rawQuestions.slice(i, i + 6))
                                                    }

                                                    if (chunks.length > 1) {
                                                        const lastChunk = chunks[chunks.length - 1]
                                                        if (lastChunk.length < 5) {
                                                            const prevChunk = chunks[chunks.length - 2]
                                                            prevChunk.push(...lastChunk)
                                                            chunks.pop()
                                                        }
                                                    }

                                                    return chunks.map((chunk, cIdx) => {
                                                        const questionNumber = 2 + cIdx
                                                        const attemptCount = Math.floor(chunk.length * 2 / 3)

                                                        const chunkId = `q-chunk-${questionNumber}`;
                                                        return (
                                                            <div key={cIdx} className={cn(
                                                                "mb-8 cursor-pointer hover:bg-zinc-50/20 rounded p-1 transition-colors",
                                                                selectedSectionIds.includes(chunkId) && "ring-2 ring-emerald-500"
                                                            )} id={chunkId} onClick={(e) => { e.stopPropagation(); onSectionClick?.(chunkId, e); }}
                                                                style={getSectionStyle(chunkId)}>
                                                                <div className="flex justify-between font-bold border-b-2 border-black mb-2 text-[14px]">
                                                                    <span>
                                                                        <span className="mr-1">{questionNumber}.</span>
                                                                        {renderEditable(`lbl_sq_title_${cIdx}`, getLabel(`lbl_sq_title_${cIdx}`, `Write short answers to any ${convertNumberToWord(attemptCount)} (${attemptCount}) questions.`), (val) => updateLabel(`lbl_sq_title_${cIdx}`, val))}
                                                                    </span>
                                                                    <span>(2 x {attemptCount} = {attemptCount * 2})</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-y-2">
                                                                    {chunk.map(({ data: sq, globalIdx }, idx) => {
                                                                        const sqId = `sq-item-${globalIdx}`;
                                                                        return (
                                                                            <div key={globalIdx} id={sqId}
                                                                                onClick={(e) => { e.stopPropagation(); onSectionClick?.(sqId, e); }}
                                                                                className={cn(
                                                                                    "flex justify-between items-center text-[14px] py-1 border-b border-zinc-100 page-break-inside-avoid cursor-pointer hover:bg-emerald-50/30 rounded px-1 transition-all",
                                                                                    selectedSectionIds.includes(sqId) && "ring-1 ring-emerald-400 bg-emerald-500/5"
                                                                                )}
                                                                                style={getSectionStyle(sqId)}>
                                                                                <p className="flex-1 pr-4">
                                                                                    <span className="font-bold mr-2">{idx + 1}-</span>
                                                                                    {renderEditable(`sq_en_${globalIdx}`, sq.en, (val) => updateShortQuestion(globalIdx, 'en', val))}
                                                                                </p>
                                                                                <p className="flex-1 text-right font-nastaleeq font-semibold text-[11px]" dir="rtl">
                                                                                    <span className="font-bold mr-2 text-[10px]">{idx + 1}- </span>
                                                                                    {renderEditable(`sq_ur_${globalIdx}`, sq.ur, (val) => updateShortQuestion(globalIdx, 'ur', val), { className: "font-nastaleeq", dir: "rtl" })}
                                                                                </p>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                            if (sectionKey === 'subjective-header') {
                                return (
                                    <div key="subjective-header" className="section-container">
                                        {wrapSection('subjective-header', (
                                            <div className="page-break-before-always border-t-4 border-double border-black pt-4 mb-6">
                                                <div className="flex justify-between items-center text-[18px] font-black uppercase tracking-widest">
                                                    <span>
                                                        {renderEditable('header_part', paperData.headerDetails?.paperPart || "Part - I (Subjective)", (val) => updateHeaderDetail('paperPart', val))}
                                                    </span>
                                                    <div className="flex gap-12">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] text-zinc-500 mb-1">Total Marks</span>
                                                            <span className="border-2 border-black px-4 py-1">
                                                                {renderEditable('header_totalmarks', paperData.headerDetails?.totalMarks || "60", (val) => updateHeaderDetail('totalMarks', val))}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] text-zinc-500 mb-1">Time Allowed</span>
                                                            <span className="border-2 border-black px-4 py-1">
                                                                {renderEditable('header_time', paperData.headerDetails?.timeAllowed || "2:10 Hours", (val) => updateHeaderDetail('timeAllowed', val))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }

                            if (sectionKey === 'urdu-special-sections') {
                                return (
                                    <div key="urdu-special-sections" className="section-container">
                                        {paperData.paperInfo.subject === "Urdu" && paperData.urduData && (
                                            <div className="mb-8 space-y-12" dir="rtl">
                                                {/* Q6: Khat/Darkhwast */}
                                                {paperData.urduData.khatDarkhwast && (
                                                    <div className={cn(
                                                        "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                        selectedSectionIds.includes('urdu_khat_section') && "ring-2 ring-emerald-500"
                                                    )} id="urdu_khat_section" onClick={(e) => { e.stopPropagation(); onSectionClick?.('urdu_khat_section', e); }}
                                                        style={getSectionStyle('urdu_khat_section')}>
                                                        <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                            <span>سوال نمبر 6: {paperData.urduData.khatDarkhwast.type} تحریر کریں۔</span>
                                                            <span>(10)</span>
                                                        </div>
                                                        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-[18px] font-urdu leading-relaxed">
                                                            {renderEditable('urdu_khat_prompt', paperData.urduData.khatDarkhwast.prompt, (val) => {
                                                                if (!paperData.urduData?.khatDarkhwast || !setPaperData) return;
                                                                setPaperData({ ...paperData, urduData: { ...paperData.urduData, khatDarkhwast: { ...paperData.urduData.khatDarkhwast, prompt: val } } });
                                                            }, { className: "font-urdu", dir: "rtl" })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q7: Dialogue/Story */}
                                                {paperData.urduData.dialogueStory && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                            <span>سوال نمبر 7: {paperData.urduData.dialogueStory.type} تحریر کریں۔</span>
                                                            <span>(05)</span>
                                                        </div>
                                                        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-[18px] font-urdu leading-relaxed italic text-emerald-800">
                                                            {renderEditable('urdu_dialogue_prompt', paperData.urduData.dialogueStory.prompt, (val) => {
                                                                if (!paperData.urduData?.dialogueStory || !setPaperData) return;
                                                                setPaperData({ ...paperData, urduData: { ...paperData.urduData, dialogueStory: { ...paperData.urduData.dialogueStory, prompt: val } } });
                                                            }, { className: "font-urdu italic", dir: "rtl" })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q8: Sentence Correction */}
                                                {paperData.urduData.sentenceCorrection && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                            <span>سوال نمبر 8: جملوں کی درستگی کریں۔ (کوئی سے پانچ)</span>
                                                            <span>(05)</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 px-4">
                                                            {paperData.urduData.sentenceCorrection.map((sentence: any, idx: number) => (
                                                                <div key={idx} className="flex items-center text-[18px] font-urdu border-b border-dotted border-zinc-200 pb-2">
                                                                    <span className="font-bold ml-4">({idx + 1})</span>
                                                                    {renderEditable(`urdu_corr_${idx}`, sentence, (val) => {
                                                                        if (!paperData.urduData?.sentenceCorrection || !setPaperData) return;
                                                                        const newData = [...paperData.urduData.sentenceCorrection];
                                                                        newData[idx] = val;
                                                                        setPaperData({ ...paperData, urduData: { ...paperData.urduData, sentenceCorrection: newData } });
                                                                    }, { className: "font-urdu", dir: "rtl" })}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q9: Essay (Mazmoon) */}
                                                {paperData.urduData.mazmoon && (
                                                    <div className={cn(
                                                        "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors",
                                                        selectedSectionIds.includes('urdu_mazmoon_section') && "ring-2 ring-emerald-500"
                                                    )} id="urdu_mazmoon_section" onClick={(e) => { e.stopPropagation(); onSectionClick?.('urdu_mazmoon_section', e); }}
                                                        style={getSectionStyle('urdu_mazmoon_section')}>
                                                        <div className="flex justify-between font-bold border-b-2 border-black mb-4 text-[18px] font-urdu">
                                                            <span>سوال نمبر 9: مندرجہ ذیل میں سے کسی ایک عنوان پر جامع مضمون لکھیں۔</span>
                                                            <span>(20)</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            {paperData.urduData.mazmoon.map((topic: any, idx: number) => {
                                                                const mId = `urdu_mazmoon_${idx}`;
                                                                return (
                                                                    <div key={idx} id={mId}
                                                                        onClick={(e) => { e.stopPropagation(); onSectionClick?.(mId, e); }}
                                                                        className={cn(
                                                                            "p-6 border-2 border-emerald-500/20 rounded-2xl bg-emerald-50/30 text-center font-bold text-[18px] font-urdu hover:bg-emerald-50 transition-colors cursor-pointer",
                                                                            selectedSectionIds.includes(mId) && "ring-2 ring-emerald-500 bg-emerald-100"
                                                                        )}
                                                                        style={getSectionStyle(mId)}>
                                                                        {renderEditable(mId, topic, (val) => {
                                                                            if (!paperData.urduData?.mazmoon || !setPaperData) return;
                                                                            const newMazmoons = [...paperData.urduData.mazmoon];
                                                                            newMazmoons[idx] = val;
                                                                            setPaperData({ ...paperData, urduData: { ...paperData.urduData, mazmoon: newMazmoons } });
                                                                        }, { className: "font-urdu", dir: "rtl" })}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            if (sectionKey === 'english-special-sections') {
                                return (
                                    <div key="english-special-sections" className="section-container">
                                        {paperData.paperInfo.subject === "English" && (
                                            <div className="mb-8 space-y-8">
                                                {/* Q2: Paraphrasing */}
                                                {paperData.englishData && paperData.englishData.paraphrasing && paperData.englishData.paraphrasing.length > 0 && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                            <span><span className="mr-1">2.</span>Paraphrase one of the following stanzas.</span>
                                                            <span>(5)</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                                                            {paperData.englishData.paraphrasing.map((stanza: any, idx: number) => (
                                                                <div key={idx} className="italic text-center">
                                                                    <span className="font-bold not-italic block mb-2 text-left">
                                                                        {idx === 0 ? '(i)' : '(ii)'}
                                                                    </span>
                                                                    <div className="whitespace-pre-line leading-relaxed font-serif text-[15px]">
                                                                        {renderEditable(`para_stanza_${idx}`, stanza.stanza, (val) => {
                                                                            if (!paperData.englishData?.paraphrasing || !setPaperData) return;
                                                                            const newData = [...paperData.englishData.paraphrasing];
                                                                            newData[idx] = { ...stanza, stanza: val };
                                                                            setPaperData({
                                                                                ...paperData,
                                                                                englishData: { ...paperData.englishData, paraphrasing: newData }
                                                                            });
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q3: Reference to Context (Alternate to Q2) */}
                                                {paperData.englishData && paperData.englishData.referenceToContext && paperData.englishData.referenceToContext.stanza && (
                                                    <div className="page-break-inside-avoid border-t border-zinc-100 pt-8">
                                                        <div className="flex justify-between font-bold mb-4 text-[14px]">
                                                            <span>OR Explain the following stanza with reference to the context.</span>
                                                            <span>(5)</span>
                                                        </div>
                                                        <div className="italic text-center px-12">
                                                            <div className="whitespace-pre-line leading-relaxed font-serif text-[15px] border-l-4 border-zinc-200 pl-6">
                                                                {renderEditable('ref_context_stanza', paperData.englishData.referenceToContext.stanza, (val) => {
                                                                    if (!paperData.englishData?.referenceToContext || !setPaperData) return;
                                                                    setPaperData({
                                                                        ...paperData,
                                                                        englishData: {
                                                                            ...paperData.englishData,
                                                                            referenceToContext: { ...paperData.englishData.referenceToContext, stanza: val }
                                                                        }
                                                                    });
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q4: Passage Comprehension */}
                                                {paperData.englishData && paperData.englishData.passageComprehension && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                            <span><span className="mr-1">4.</span>Read the following passage and answer the questions at the end.</span>
                                                            <span>(10)</span>
                                                        </div>
                                                        <div className="px-6 py-4 border border-zinc-200 rounded-lg bg-zinc-50/50 text-[13px] leading-relaxed font-serif whitespace-pre-line text-justify mb-4">
                                                            {renderEditable('passage_text', paperData.englishData.passageComprehension.passage, (val) => {
                                                                if (!paperData.englishData?.passageComprehension || !setPaperData) return;
                                                                setPaperData({ ...paperData, englishData: { ...paperData.englishData, passageComprehension: { ...paperData.englishData.passageComprehension, passage: val } } });
                                                            }, { className: "font-serif text-justify" })}
                                                        </div>
                                                        <div className="space-y-3 pl-4 mb-4">
                                                            {paperData.englishData.passageComprehension.questions.map((q: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between text-[14px]">
                                                                    <span className="flex-1">
                                                                        <span className="font-bold mr-2">({idx + 1})</span>
                                                                        {renderEditable(`passage_q_${idx}`, q.question, (val) => {
                                                                            if (!paperData.englishData?.passageComprehension || !setPaperData) return;
                                                                            const newQs = [...paperData.englishData.passageComprehension.questions];
                                                                            newQs[idx] = { ...q, question: val };
                                                                            setPaperData({ ...paperData, englishData: { ...paperData.englishData, passageComprehension: { ...paperData.englishData.passageComprehension, questions: newQs } } });
                                                                        })}
                                                                    </span>
                                                                    <span className="font-bold">({q.marks})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q5: Summary */}
                                                {paperData.englishData && paperData.englishData.summary && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                            <span><span className="mr-1">5.</span>{paperData.englishData.summary.userSummary ? 'Read the summary and answer the questions.' : 'Write down the summary of the poem.'}</span>
                                                            <span>(5)</span>
                                                        </div>

                                                        {paperData.englishData.summary.userSummary ? (
                                                            <div className="px-6 py-4 border border-zinc-200 rounded-lg bg-zinc-50/50 text-[13px] leading-relaxed font-serif whitespace-pre-line text-justify">
                                                                {renderEditable('summary_text', paperData.englishData.summary.userSummary, (val) => {
                                                                    if (!paperData.englishData?.summary || !setPaperData) return;
                                                                    setPaperData({
                                                                        ...paperData,
                                                                        englishData: {
                                                                            ...paperData.englishData,
                                                                            summary: { ...paperData.englishData.summary, userSummary: val }
                                                                        }
                                                                    });
                                                                }, { className: "font-serif" })}
                                                            </div>
                                                        ) : (
                                                            <div className="px-8 py-6 border-2 border-dashed border-zinc-200 rounded-xl text-center bg-zinc-50/30">
                                                                <span className="text-[14px] font-black uppercase tracking-[0.2em] italic text-zinc-400">Poem Title: </span>
                                                                <span className="text-[18px] font-black text-emerald-600 ml-2">
                                                                    {renderEditable('summary_title', paperData.englishData.summary.poem, (val) => setPaperData && setPaperData({
                                                                        ...paperData,
                                                                        englishData: {
                                                                            ...paperData.englishData!,
                                                                            summary: { ...paperData.englishData!.summary!, poem: val }
                                                                        }
                                                                    }))}
                                                                </span>
                                                                <div className="mt-4 text-[9px] text-zinc-400 uppercase font-black tracking-widest leading-tight">
                                                                    Student is required to write the summary of the poem <br /> on the provided answer sheet.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes('eng_idioms_section') && "ring-2 ring-emerald-500"
                                                )} id="eng_idioms_section" onClick={(e) => { e.stopPropagation(); onSectionClick?.('eng_idioms_section', e); }}
                                                    style={getSectionStyle('eng_idioms_section')}>
                                                    <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                        <span><span className="mr-1">6.</span>Use the following words / phrases / idioms in your sentences.</span>
                                                        <span>({paperData.englishData.idioms.length} x 1 = {paperData.englishData.idioms.length})</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-8 gap-y-2 px-4 italic font-bold text-[14px]">
                                                        {paperData.englishData.idioms.map((item: any, idx: number) => {
                                                            const id = `idiom_${idx}`;
                                                            return (
                                                                <div key={idx} className={cn(
                                                                    "flex gap-2 cursor-pointer hover:bg-emerald-50/30 rounded px-1",
                                                                    selectedSectionIds.includes(id) && "ring-1 ring-emerald-400 bg-emerald-500/5"
                                                                )} id={id} onClick={(e) => { e.stopPropagation(); onSectionClick?.(id, e); }}
                                                                    style={getSectionStyle(id)}>
                                                                    <span>{['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)'][idx]}</span>
                                                                    {renderEditable(id, item.word, (val) => {
                                                                        if (!paperData.englishData?.idioms || !setPaperData) return;
                                                                        const newData = [...paperData.englishData.idioms];
                                                                        newData[idx] = { ...item, word: val };
                                                                        setPaperData({ ...paperData, englishData: { ...paperData.englishData, idioms: newData } });
                                                                    }, { className: "italic" })}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Q7: Letter/Story/Dialogue */}
                                                {paperData.englishData && paperData.englishData.letterStoryDialogue && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                            <span><span className="mr-1">7.</span>Write a {paperData.englishData.letterStoryDialogue.type} on the following.</span>
                                                            <span>(8)</span>
                                                        </div>
                                                        <div className="px-4 font-bold text-[14px] italic text-emerald-700">
                                                            {renderEditable('letter_topic', paperData.englishData.letterStoryDialogue.topic, (val) => {
                                                                if (!paperData.englishData?.letterStoryDialogue || !setPaperData) return;
                                                                setPaperData({ ...paperData, englishData: { ...paperData.englishData, letterStoryDialogue: { ...paperData.englishData.letterStoryDialogue, topic: val } } });
                                                            }, { className: "italic" })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q8: Translation */}
                                                {paperData.englishData && paperData.englishData.translation && paperData.englishData.translation.length > 0 && (
                                                    <div className={cn(
                                                        "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                        selectedSectionIds.includes('eng_trans_section') && "ring-2 ring-emerald-500"
                                                    )} id="eng_trans_section" onClick={(e) => { e.stopPropagation(); onSectionClick?.('eng_trans_section', e); }}
                                                        style={getSectionStyle('eng_trans_section')}>
                                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                            <span><span className="mr-1">8.</span>Translate the following sentences into English.</span>
                                                            <span>(4)</span>
                                                        </div>
                                                        <div className="space-y-4 px-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {paperData.englishData.translation.map((item: any, idx: number) => {
                                                                    const id = `trans_ur_${idx}`;
                                                                    return (
                                                                        <div key={idx} id={id}
                                                                            onClick={(e) => { e.stopPropagation(); onSectionClick?.(id, e); }}
                                                                            className={cn(
                                                                                "flex justify-between items-center text-[14px] font-nastaleeq border-b border-zinc-50 pb-2 cursor-pointer hover:bg-emerald-50/30 px-1 rounded transition-all",
                                                                                selectedSectionIds.includes(id) && "ring-1 ring-emerald-400 bg-emerald-500/5"
                                                                            )}
                                                                            dir="rtl" style={getSectionStyle(id)}>
                                                                            <span className="font-bold ml-2">({['i', 'ii', 'iii', 'iv', 'v'][idx]})</span>
                                                                            {renderEditable(id, item.ur, (val) => {
                                                                                if (!paperData.englishData?.translation || !setPaperData) return;
                                                                                const newData = [...paperData.englishData.translation];
                                                                                newData[idx] = { ...item, ur: val };
                                                                                setPaperData({ ...paperData, englishData: { ...paperData.englishData, translation: newData } });
                                                                            }, { className: "font-nastaleeq", dir: "rtl" })}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Q9: Change of Voice */}
                                                {paperData.englishData && paperData.englishData.voice && paperData.englishData.voice.length > 0 && (
                                                    <div className="page-break-inside-avoid">
                                                        <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                            <span><span className="mr-1">9.</span>Change the voice of the following.</span>
                                                            <span>({paperData.englishData.voice.length})</span>
                                                        </div>
                                                        <div className="space-y-2 px-4 italic">
                                                            {paperData.englishData.voice.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex gap-2 text-[14px]">
                                                                    <span className="font-bold">({['i', 'ii', 'iii', 'iv', 'v'][idx]})</span>
                                                                    {renderEditable(`voice_act_${idx}`, item.active, (val) => {
                                                                        if (!paperData.englishData?.voice || !setPaperData) return;
                                                                        const newData = [...paperData.englishData.voice];
                                                                        newData[idx] = { ...item, active: val };
                                                                        setPaperData({ ...paperData, englishData: { ...paperData.englishData, voice: newData } });
                                                                    }, { className: "italic" })}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                            if (sectionKey === 'long-questions') {
                                return (
                                    <div key="long-questions" className="section-container">
                                        {paperData.paperInfo.subject === "English" && paperData.longQuestions && paperData.longQuestions.length > 0 && (
                                            <div className={cn(
                                                "mt-12 page-break-inside-avoid border-t-2 border-zinc-100 pt-8 cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors",
                                                selectedSectionIds.includes('eng_long_section') && "ring-2 ring-emerald-500"
                                            )} id="eng_long_section" onClick={(e) => { e.stopPropagation(); onSectionClick?.('eng_long_section', e); }}
                                                style={getSectionStyle('eng_long_section')}>
                                                <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                    <span><span className="mr-1">10.</span>
                                                        {renderEditable('lbl_lq_title', getLabel('lbl_lq_title', 'Write an Essay / Paragraph on ANY ONE of the following topics.'), (val) => updateLabel('lbl_lq_title', val))}
                                                    </span>
                                                    <span>(15)</span>
                                                </div>
                                                <div className="px-4 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4 font-bold text-[14px]">
                                                        {paperData.longQuestions.map((lq: any, idx: number) => {
                                                            const lqId = `lq_topic_${idx}`;
                                                            return (
                                                                <div key={idx} className={cn(
                                                                    "flex gap-2 cursor-pointer hover:bg-emerald-50/30 rounded px-1",
                                                                    selectedSectionIds.includes(lqId) && "ring-1 ring-emerald-400 bg-emerald-500/5"
                                                                )} id={lqId} onClick={(e) => { e.stopPropagation(); onSectionClick?.(lqId, e); }}
                                                                    style={getSectionStyle(lqId)}>
                                                                    <span>({['i', 'ii', 'iii', 'iv', 'v'][idx]})</span>
                                                                    {renderEditable(lqId, lq.en, (val) => {
                                                                        if (!setPaperData) return
                                                                        const newLqs = [...paperData.longQuestions]
                                                                        newLqs[idx] = { ...lq, en: val }
                                                                        setPaperData({ ...paperData, longQuestions: newLqs })
                                                                    })}
                                                                </div>
                                                            )
                                                        })}
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
                                )
                            }
                            return null;
                        };

                        return (
                            <Reorder.Item
                                key={sectionKey}
                                value={sectionKey}
                                className="relative"
                                initial={false}
                            >
                                {renderSectionContent()}
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>





                {/* Floating Creative Elements Layer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden print:overflow-visible">
                    <div className="relative w-full h-full">
                        <AnimatePresence>
                            {paperData.floatingElements?.map((el: any, idx: number) => renderCreativeElement(el, idx))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
