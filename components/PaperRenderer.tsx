import { AnimatePresence, motion, Reorder } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { EditableText } from "./EditableText";
import katex from "katex";
import "katex/dist/katex.min.css";
import TranslateDropdown from "./TranslateDropdown";

interface PaperRendererProps {
    paperData: any;
    selectedSectionIds?: string[];
    onSectionClick?: (id: string, e: React.MouseEvent) => void;
    onAIAction?: (id: string, type: string, title: string, content: any) => void;
    sectionStyles?: Record<string, any>;
    isEditing?: boolean;
    setPaperData?: (data: any) => void;
}

const safeRender = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return String(val);
};

const renderTextWithMath = (text: string) => {
    if (!text) return null;

    try {
        // Split text by $$ (display mode) or $ (inline mode) delimiters
        const displayParts = text.split(/(\$\$.*?\$\$)/g);

        return displayParts.map((dPart, di) => {
            if (dPart.startsWith("$$") && dPart.endsWith("$$")) {
                const math = dPart.slice(2, -2);
                try {
                    return (
                        <div
                            key={`display-${di}`}
                            className="my-4 text-center overflow-x-auto"
                            dangerouslySetInnerHTML={{
                                __html: katex.renderToString(math, {
                                    throwOnError: false,
                                    displayMode: true,
                                }),
                            }}
                        />
                    );
                } catch (e) {
                    console.error("KaTeX Display Error:", e);
                    return (
                        <code
                            key={`display-${di}`}
                            className="block p-4 bg-red-50 text-red-600 rounded my-2"
                        >
                            {dPart}
                        </code>
                    );
                }
            }

            // For non-display parts, split by $ for inline math
            const inlineParts = dPart.split(/(\$.*?\$)/g);
            return inlineParts.map((part, i) => {
                if (part.startsWith("$") && part.endsWith("$")) {
                    const math = part.slice(1, -1);
                    try {
                        return (
                            <span
                                key={`inline-${di}-${i}`}
                                dangerouslySetInnerHTML={{
                                    __html: katex.renderToString(math, {
                                        throwOnError: false,
                                        displayMode: false,
                                    }),
                                }}
                            />
                        );
                    } catch (e) {
                        console.error("KaTeX Inline Error:", e);
                        return (
                            <code
                                key={`inline-${di}-${i}`}
                                className="px-1 bg-red-50 text-red-600 rounded"
                            >
                                {part}
                            </code>
                        );
                    }
                }
                return <span key={`inline-${di}-${i}`}>{part}</span>;
            });
        });
    } catch (globalError) {
        console.error("Math Rendering Panic:", globalError);
        return <span className="text-red-500 font-mono text-xs">[Math Error]</span>;
    }
};

export const ATOMIC_LAYOUTS: Record<string, string[]> = {
    header: [
        "h-logo-left",
        "h-session",
        "h-logo-center",
        "h-rollno-box",
        "h-school-name",
        "h-system-badge",
        "h-logo-right",
        "h-info-row",
    ],
    mcqs: ["mcq-instruction"], // Will be dynamically expanded with mcq-0, mcq-1, etc.
    "subjective-header": ["sh-header-block"],
};

export const SUBJECT_LAYOUTS: Record<string, string[]> = {
    science: [
        "h-logo-left",
        "h-session-rollno",
        "h-logo-center",
        "h-school-name",
        "h-system-badge",
        "h-logo-right",
        "h-info-row",
        "mcq-instruction",
        "mcqs",
        "mcqs-grammar",
        "sh-header-block",
        "short-questions",
        "long-questions",
        "long-questions-numerical",
        "diagram-practical",
    ],
    math: [
        "h-logo-left",
        "h-session-rollno",
        "h-logo-center",
        "h-school-name",
        "h-system-badge",
        "h-logo-right",
        "h-info-row",
        "mcq-instruction",
        "mcqs",
        "sh-header-block",
        "short-questions",
        "short-questions-math",
        "long-questions-numerical",
        "long-theorems",
        "long-calculations",
    ],
    urdu: [
        "h-logo-left",
        "h-session-rollno",
        "h-logo-center",
        "h-school-name",
        "h-system-badge",
        "h-logo-right",
        "h-info-row",
        "mcq-instruction",
        "mcqs",
        "mcqs-grammar",
        "sh-header-block",
        "short-questions-lessons",
        "poetry-explanation",
        "lesson-summary",
        "letter-application",
        "story-writing",
        "grammar-application",
        "urdu-special-sections",
    ],
    english: [
        "h-logo-left",
        "h-session-rollno",
        "h-logo-center",
        "h-school-name",
        "h-system-badge",
        "h-logo-right",
        "h-info-row",
        "mcq-instruction",
        "mcqs",
        "mcqs-grammar",
        "sh-header-block",
        "short-questions-lessons",
        "poetry-explanation",
        "lesson-summary",
        "letter-application",
        "story-writing",
        "translation-idiomatic",
        "grammar-application",
        "english-special-sections",
        "long-questions",
    ],
    religious: [
        "h-logo-left",
        "h-session-rollno",
        "h-logo-center",
        "h-school-name",
        "h-system-badge",
        "h-logo-right",
        "h-info-row",
        "mcq-instruction",
        "mcqs",
        "mcqs-religious",
        "sh-header-block",
        "short-questions-religious",
        "quran-vocabulary",
        "quran-translation",
        "quranic-verses",
        "ahadith-translation",
        "thematic-long-questions",
    ],
    general: [
        "h-logo-left",
        "h-session-rollno",
        "h-logo-center",
        "h-school-name",
        "h-system-badge",
        "h-logo-right",
        "h-info-row",
        "mcq-instruction",
        "mcqs",
        "sh-header-block",
        "short-questions",
        "long-questions",
    ],
};

export const getSubjectType = (subject: string): string => {
    if (!subject) return "general";
    const s = subject.toLowerCase();
    if (s.includes("urdu")) return "urdu";
    if (s.includes("english")) return "english";
    if (s === "math" || s === "mathematics") return "math";
    const religiousSubjects = [
        "islamiat",
        "tarjama-tul-quran",
        "tarjama tul quran",
        "mutalia pakistan",
        "pakistan studies",
        "islamic studies",
    ];
    if (religiousSubjects.some((rs) => s.includes(rs))) return "religious";
    if (
        [
            "physics",
            "biology",
            "chemistry",
            "computer science",
            "science",
            "general science",
        ].includes(s)
    )
        return "science";
    return "general";
};

export const isUrduPaper = (subject: string) => {
    if (!subject) return false;
    const s = subject.toLowerCase().replace(/[_\s-]/g, "");
    return (
        [
            "urdu",
            "islamiat",
            "islamiyat",
            "tarjamatulquran",
            "tarjumatulquran",
            "islamicstudieselective",
            "islamicstudies",
            "mutaliapakistan",
            "pakistanstudies",
            "ethics",
            "akhlaqiat",
            "civics",
            "islamiyatcompulsory",
        ].includes(s) ||
        s.includes("urdu") ||
        s.includes("islamiat") ||
        s.includes("islamic")
    );
};

export function PaperRenderer({
    paperData,
    selectedSectionIds = [],
    onSectionClick,
    onAIAction,
    sectionStyles = {},
    isEditing = false,
    setPaperData,
}: PaperRendererProps) {
    if (!paperData) return null;

    const isUrdu =
        paperData.paperInfo?.subject && isUrduPaper(paperData.paperInfo.subject);

    const getSectionStyle = (id: string) => {
        const style = sectionStyles[id] || {};
        return {
            ...style,
            fontFamily: style.fontFamily === "inherit" ? "inherit" : style.fontFamily,
        };
    };

    const uniqueOrder = React.useMemo(() => {
        const order =
            paperData.sectionOrder ||
            SUBJECT_LAYOUTS[getSubjectType(paperData.paperInfo?.subject)] ||
            [];
        const resolvedOrder: string[] = [];
        order.forEach((key: any) => {
            if (key === "header" || key === "header-section") {
                resolvedOrder.push(
                    "h-logo-left",
                    "h-session",
                    "h-logo-center",
                    "h-rollno-box",
                    "h-school-name",
                    "h-system-badge",
                    "h-logo-right",
                    "h-info-row",
                );
            } else if (
                key === "mcqs" ||
                key === "mcqs-grammar" ||
                key === "mcqs-religious"
            ) {
                resolvedOrder.push("mcq-instruction");
                if (paperData.mcqs) {
                    paperData.mcqs.forEach((_: any, i: number) =>
                        resolvedOrder.push(`mcq-${i}`),
                    );
                }
            } else if (key === "subjective-header") {
                resolvedOrder.push("sh-header-block");
            } else if (
                key === "short-questions" ||
                key === "short-questions-math" ||
                key === "short-questions-lessons" ||
                key === "short-questions-religious"
            ) {
                resolvedOrder.push("sq-header");
                if (paperData.shortQuestions) {
                    paperData.shortQuestions.forEach((_: any, i: number) =>
                        resolvedOrder.push(`sq-${i}`),
                    );
                }
            } else {
                resolvedOrder.push(key);
            }
        });
        return Array.from(new Set(resolvedOrder));
    }, [
        paperData.sectionOrder,
        paperData.paperInfo?.subject,
        paperData.mcqs?.length,
        paperData.shortQuestions?.length,
    ]);

    const usedMcqIndices = React.useMemo(
        () => new Set<number>(),
        [paperData.mcqs?.length],
    );
    const urduMcqGroups = [
        {
            key: "grp_spelling",
            title: "درست ہجے والے لفظ کا انتخاب کریں۔",
            type: "spelling",
        },
        {
            key: "grp_meaning",
            title: "الفاظ کے معنی کا انتخاب کریں۔",
            type: "meaning",
        },
        {
            key: "grp_gramar",
            title: "قواعد کی رو سے انتخاب کریں۔",
            type: "grammar",
        },
    ];

    const shouldShow = (
        id: string,
        lang: "en" | "ur" | "ar" | "both",
        parentId?: string,
    ) => {
        const style =
            sectionStyles[id] || (parentId ? sectionStyles[parentId] : {}) || {};
        const displayLang = style.displayLanguage || "both";

        if (lang === "both") return displayLang === "both";
        if (displayLang === "both") return true;

        if (displayLang === "en") return lang === "en";
        if (displayLang === "ur") return lang === "ur" || lang === "ar";

        return true;
    };

    const wrapSection = (
        id: string,
        children: React.ReactNode,
        additionalClasses = "",
    ) => (
        <div
            id={id}
            onClick={(e) => {
                e.stopPropagation();
                onSectionClick?.(id, e);
            }}
            className={cn(
                "cursor-pointer transition-all relative group/section",
                selectedSectionIds.includes(id)
                    ? "ring-2 ring-emerald-500 ring-offset-2 rounded-sm bg-emerald-500/5"
                    : "hover:ring-1 hover:ring-zinc-200",
                additionalClasses,
            )}
            style={getSectionStyle(id)}
        >
            {/* Actions for sections */}
            {isEditing && (
                <div className="absolute -right-8 top-0 bottom-0 w-8 flex flex-col items-center justify-center opacity-0 group-hover/section:opacity-100 transition-all gap-2 z-50">
                    {onAIAction && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Heuristic for type and title based on ID
                                let type = "section";
                                let title = id;
                                if (id.includes('mcq')) type = "mcq_group";
                                if (id.includes('sq') || id.includes('short')) type = "short_questions";
                                if (id.includes('long')) type = "long_questions";

                                onAIAction(id, type, title, null);
                            }}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            title="AI Magic"
                        >
                            <LucideIcons.Wand2 size={12} />
                        </button>
                    )}
                    <LucideIcons.GripVertical
                        size={14}
                        className="text-emerald-500/30 cursor-grab active:cursor-grabbing hover:text-emerald-500/60 transition-colors"
                    />
                </div>
            )}
            {children}
        </div>
    );

    const renderWords = (parentId: string, text: string, style: any = {}) => {
        if (!text) return null;

        // If it looks like math, don't split by words to avoid breaking equations
        if (text.includes("$")) {
            return (
                <div
                    id={parentId}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSectionClick?.(parentId, e);
                    }}
                    className={cn(
                        "inline hover:bg-emerald-500/10 rounded-sm transition-all cursor-pointer",
                        selectedSectionIds.includes(parentId) &&
                        "ring-1 ring-emerald-500 bg-emerald-500/5 px-0.5",
                    )}
                    style={{ ...getSectionStyle(parentId), ...style }}
                >
                    {renderTextWithMath(text)}
                </div>
            );
        }

        const words = text.split(" ");
        return words.map((word, i) => {
            const wordId = `${parentId}-w-${i}`;
            return (
                <React.Fragment key={i}>
                    <span
                        id={wordId}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSectionClick?.(wordId, e);
                        }}
                        className={cn(
                            "inline hover:bg-emerald-500/10 rounded-sm transition-all cursor-pointer",
                            selectedSectionIds.includes(wordId) &&
                            "ring-1 ring-emerald-500 bg-emerald-500/5 px-0.5",
                        )}
                        style={getSectionStyle(wordId)}
                    >
                        {renderTextWithMath(word)}
                    </span>
                    {i < words.length - 1 && " "}
                </React.Fragment>
            );
        });
    };



    const renderEditable = (
        id: string,
        value: any,
        onSave: (val: string) => void,
        props: any = {},
    ) => {
        const isSelected = selectedSectionIds.includes(id);
        const textValue = safeRender(value);

        return (
            <div className={cn("relative inline-block group/editable", props.className)} style={props.style}>
                {isSelected && isEditing && (
                    <div className="absolute -top-8 right-0 z-50 print:hidden">
                        <TranslateDropdown
                            text={textValue}
                            onTranslate={(translated, lang) => {
                                onSave(translated);
                            }}
                        />
                    </div>
                )}
                <EditableText
                    id={id}
                    value={textValue}
                    onSave={onSave}
                    isEditing={isEditing}
                    style={{ ...getSectionStyle(id), width: '100%' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSectionClick?.(id, e);
                    }}
                    {...props}
                    // Override className from props with our own logic, but avoid duplicate prop
                    className={cn(
                        "w-full",
                        isSelected &&
                        "ring-2 ring-emerald-500 ring-offset-1 rounded-sm bg-emerald-500/5",
                        "transition-all",
                        // we can include props.className here if we want to merge them
                    )}
                />
            </div>
        );
    };

    const renderCreativeElement = (el: any, index: number) => {
        const isSelected = selectedSectionIds.includes(el.id);
        const isMultiSelecting = selectedSectionIds.length > 1;

        return (
            <motion.div
                key={el.id}
                drag
                dragMomentum={false}
                // antigravity feel
                whileDrag={{ scale: 1.05, rotate: 2 }}
                onDragEnd={(_, info) => {
                    const newElements = [...(paperData.floatingElements || [])];
                    const deltaX = info.offset.x;
                    const deltaY = info.offset.y;

                    if (isSelected && isMultiSelecting) {
                        selectedSectionIds.forEach((id) => {
                            const foundIdx = newElements.findIndex((fe) => fe.id === id);
                            if (foundIdx !== -1) {
                                const targetEl = newElements[foundIdx];
                                newElements[foundIdx] = {
                                    ...targetEl,
                                    x: (targetEl.x || 0) + deltaX,
                                    y: (targetEl.y || 0) + deltaY,
                                };
                            }
                        });
                    } else {
                        newElements[index] = {
                            ...el,
                            x: (el.x || 0) + deltaX,
                            y: (el.y || 0) + deltaY,
                        };
                    }
                    setPaperData?.({ ...paperData, floatingElements: newElements });
                }}
                initial={{ x: el.x || 0, y: el.y || 0 }}
                style={{
                    position: "absolute",
                    zIndex: el.zIndex || 50,
                    ...getSectionStyle(el.id),
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick?.(el.id, e);
                }}
                className={cn(
                    "group relative pointer-events-auto",
                    isSelected && "ring-2 ring-emerald-500 rounded-sm",
                )}
            >
                {/* Drag Handle */}
                <div
                    className={cn(
                        "absolute -left-6 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-900 border border-white/10 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-60 shadow-xl",
                        isSelected && "opacity-100 border-emerald-500/50 text-emerald-500",
                    )}
                >
                    <LucideIcons.GripVertical size={14} />
                </div>

                {el.type === "image" && (
                    <div className="relative group">
                        <img
                            src={el.content}
                            alt="AI Asset"
                            draggable={false}
                            style={{ width: el.size || 200, height: "auto" }}
                            className="rounded-md shadow-lg pointer-events-none"
                        />
                    </div>
                )}
                {el.type === "text" && (
                    <div className="min-w-[50px]">
                        {renderEditable(el.id, el.content, (val) => {
                            const newElements = [...(paperData.floatingElements || [])];
                            newElements[index] = { ...el, content: val };
                            setPaperData?.({ ...paperData, floatingElements: newElements });
                        })}
                    </div>
                )}
                {el.type === "icon" && (
                    <div
                        className="p-1 cursor-grab"
                        style={{ color: getSectionStyle(el.id).color }}
                    >
                        {React.createElement((LucideIcons as any)[el.iconName || "Star"], {
                            size: el.size || 24,
                            className: "text-inherit",
                        })}
                    </div>
                )}
                {el.type === "qr" && (
                    <div className="bg-white p-1 rounded shadow-sm cursor-grab">
                        <QRCodeSVG
                            value={el.content || "https://aminacademy.pk"}
                            size={el.size || 60}
                        />
                    </div>
                )}

                {isSelected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const newElements = paperData.floatingElements.filter(
                                (_: any, i: number) => i !== index,
                            );
                            setPaperData?.({ ...paperData, floatingElements: newElements });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-60"
                    >
                        <LucideIcons.X size={10} />
                    </button>
                )}
            </motion.div>
        );
    };

    const themeClass =
        paperData.currentTheme === "royal"
            ? "font-serif bg-amber-50/20 border-8 border-double border-amber-200 shadow-inner"
            : paperData.currentTheme === "minimal"
                ? "font-light bg-zinc-50 border-none"
                : paperData.currentTheme === "classic"
                    ? "font-serif bg-white ring-1 ring-black"
                    : "bg-white";

    // Helper to update specific fields
    const updateHeaderDetail = (key: string, val: string) => {
        if (!setPaperData) return;
        setPaperData({
            ...paperData,
            headerDetails: { ...paperData.headerDetails, [key]: val },
        });
    };

    const updatePaperInfo = (key: string, val: string) => {
        if (!setPaperData) return;
        setPaperData({
            ...paperData,
            paperInfo: { ...paperData.paperInfo, [key]: val },
        });
    };

    const updateMcq = (idx: number, field: "en" | "ur", val: string) => {
        if (!setPaperData) return;
        const newMcqs = [...paperData.mcqs];
        newMcqs[idx] = { ...newMcqs[idx], [field]: val };
        setPaperData({ ...paperData, mcqs: newMcqs });
    };

    const updateMcqOption = (
        qIdx: number,
        oIdx: number,
        field: "en" | "ur",
        val: string,
    ) => {
        if (!setPaperData) return;
        const newMcqs = [...paperData.mcqs];
        const newOptions = [...newMcqs[qIdx].options];
        newOptions[oIdx] = { ...newOptions[oIdx], [field]: val };
        newMcqs[qIdx] = { ...newMcqs[qIdx], options: newOptions };
        setPaperData({ ...paperData, mcqs: newMcqs });
    };

    const updateShortQuestion = (
        idx: number,
        field: "en" | "ur",
        val: string,
    ) => {
        if (!setPaperData) return;
        const newSqs = [...(paperData.shortQuestions || [])];
        newSqs[idx] = { ...newSqs[idx], [field]: val };
        setPaperData({ ...paperData, shortQuestions: newSqs });
    };

    const updateLq = (idx: number, field: "en" | "ur", val: string) => {
        if (!setPaperData) return;
        const newLqs = [...(paperData.longQuestions || [])];
        newLqs[idx] = { ...newLqs[idx], [field]: val };
        setPaperData({ ...paperData, longQuestions: newLqs });
    };

    const convertNumberToWord = (num: number) => {
        const words = [
            "zero",
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten",
        ];
        return words[num] || num.toString();
    };

    // Helper for updating generic labels
    const updateLabel = (key: string, val: string) => {
        if (!setPaperData) return;
        setPaperData({
            ...paperData,
            labels: { ...paperData.labels, [key]: val },
        });
    };

    // Get label with fallback
    const getLabel = (key: string, defaultVal: string) => {
        return paperData.labels?.[key] || defaultVal;
    };

    const pageStyle = sectionStyles.page || {};
    const pageSize = pageStyle.size || "a4";
    const paddingX = pageStyle.paddingX || "64px";
    const paddingY = pageStyle.paddingY || "64px";
    const contentScale = (pageStyle.contentScale || 100) / 100;
    const theme = pageStyle.theme || "clean";

    const sizeClasses = {
        a4: "w-[210mm] min-h-[297mm]",
        legal: "w-[216mm] min-h-[356mm]",
        letter: "w-[216mm] min-h-[279mm]",
        custom: "w-full min-h-screen",
    };

    const themeStyles = {
        clean: "bg-white shadow-2xl",
        vintage: "bg-[#fdf6e3] shadow-2xl sepia-[0.1]",
        grid: "bg-white shadow-2xl bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]",
    };

    return (
        <div
            id="paper-canvas"
            className={cn(
                "relative mx-auto border border-zinc-200 transition-all duration-700 rounded-sm text-black pt-16",
                sizeClasses[pageSize as keyof typeof sizeClasses] || sizeClasses["a4"],
                themeClass, // Applying Royal, Modern, Minimal themes
            )}
            style={{
                paddingLeft: paddingX,
                paddingRight: paddingX,
                paddingTop: paddingY,
                paddingBottom: paddingY,
                fontFamily: themeClass.includes("font-serif")
                    ? "'Times New Roman', serif"
                    : "'Inter', sans-serif",
            }}
        >
            {/* Watermark Overlay */}
            {(paperData.watermark?.text || paperData.watermark?.image) && (
                <div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                    style={{
                        opacity: paperData.watermark?.opacity || 0.1,
                        zIndex: paperData.watermark?.zIndex ?? 0,
                    }}
                >
                    <div
                        style={{
                            transform: `
                            rotate(${paperData.watermark?.rotation || -45}deg) 
                            scale(${paperData.watermark?.scale || 1})
                            translate(${paperData.watermark?.hOffset || 0}px, ${paperData.watermark?.vOffset || 0}px)
                        `,
                            filter: `
                            ${paperData.watermark?.grayscale ? "grayscale(1)" : ""} 
                            ${paperData.watermark?.invert ? "invert(1)" : ""}
                        `.trim(),
                        }}
                    >
                        {paperData.watermark?.image ? (
                            <img
                                src={paperData.watermark.image}
                                alt="Watermark"
                                className="max-w-[80%] h-auto select-none"
                            />
                        ) : (
                            <div className="text-[120px] font-black uppercase tracking-[20px] select-none text-zinc-300">
                                {paperData.watermark?.text}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div
                className={cn(
                    "relative z-10",
                    isUrduPaper(paperData?.paperInfo?.subject) && "font-urdu",
                )}
                dir={isUrduPaper(paperData?.paperInfo?.subject) ? "rtl" : "ltr"}
                style={{
                    transform: `scale(${contentScale})`,
                    transformOrigin: "top center",
                }}
            >
                <Reorder.Group
                    axis="y"
                    values={uniqueOrder}
                    onReorder={(newOrder) =>
                        setPaperData?.({ ...paperData, sectionOrder: newOrder })
                    }
                    className="relative"
                >
                    {uniqueOrder.map((sectionKey: string) => {
                        const renderSectionContent = () => {
                            // 1. ATOMIC HEADER COMPONENTS
                            switch (sectionKey) {
                                case "h-logo-left":
                                    if (
                                        paperData.logo?.url &&
                                        paperData.logo?.position === "left"
                                    ) {
                                        return wrapSection(
                                            "h-logo-left",
                                            <div className="w-24 h-24 shrink-0 mb-4">
                                                <img
                                                    src={paperData.logo.url}
                                                    alt="Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>,
                                        );
                                    }
                                    return null;

                                case "h-logo-right":
                                    if (
                                        paperData.logo?.url &&
                                        paperData.logo?.position === "right"
                                    ) {
                                        return wrapSection(
                                            "h-logo-right",
                                            <div className="w-24 h-24 shrink-0 mb-4 float-right">
                                                <img
                                                    src={paperData.logo.url}
                                                    alt="Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>,
                                        );
                                    }
                                    return null;

                                case "h-logo-center":
                                    if (
                                        paperData.logo?.url &&
                                        paperData.logo?.position === "center"
                                    ) {
                                        return wrapSection(
                                            "h-logo-center",
                                            <div className="w-20 h-20 mb-4 mx-auto">
                                                <img
                                                    src={paperData.logo.url}
                                                    alt="Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>,
                                        );
                                    }
                                    return null;

                                case "h-session":
                                    return wrapSection(
                                        "h-session",
                                        <div className="text-[12px] font-bold italic mb-1">
                                            {renderEditable(
                                                "header_session",
                                                paperData.headerDetails?.session?.replace("Inter Part-I", "انٹرمیڈیٹ پارٹ-I")?.replace("Inter Part-II", "انٹرمیڈیٹ پارٹ-II") || (isUrduPaper(paperData.paperInfo.subject) ? "انٹرمیڈیٹ پارٹ-I (سیشن 2025-26)" : "Inter Part-I (Session 2025-26)"),
                                                (val) => updateHeaderDetail("session", val),
                                                isUrduPaper(paperData.paperInfo.subject) ? { className: "font-urdu text-right", dir: "rtl" } : {}
                                            )}
                                        </div>,
                                    );

                                case "h-rollno-box":
                                    return wrapSection(
                                        "h-rollno-box",
                                        <div className="text-[13px] font-bold text-right">
                                            {renderEditable(
                                                "header_rollno",
                                                paperData.headerDetails?.rollNoLabel ||
                                                (isUrduPaper(paperData.paperInfo.subject)
                                                    ? "رول نمبر: ______________"
                                                    : "Roll No: ______________"),
                                                (val) => updateHeaderDetail("rollNoLabel", val),
                                                isUrduPaper(paperData.paperInfo.subject)
                                                    ? { className: "font-urdu", dir: "rtl" }
                                                    : {},
                                            )}
                                        </div>,
                                    );

                                case "h-session-rollno":
                                    return wrapSection(
                                        "h-session-rollno",
                                        <div
                                            className="flex justify-between items-center w-full mb-4"
                                            dir={isUrduPaper(paperData.paperInfo.subject) ? "rtl" : "ltr"}
                                        >
                                            <div className="text-[12px] font-bold italic">
                                                {renderEditable(
                                                    "header_session",
                                                    paperData.headerDetails?.session?.replace("Inter Part-I", "انٹرمیڈیٹ پارٹ-I")?.replace("Inter Part-II", "انٹرمیڈیٹ پارٹ-II") || (isUrduPaper(paperData.paperInfo.subject) ? "انٹرمیڈیٹ پارٹ-I (سیشن 2025-26)" : "Inter Part-I (Session 2025-26)"),
                                                    (val) => updateHeaderDetail("session", val),
                                                    isUrduPaper(paperData.paperInfo.subject) ? { className: "font-urdu", dir: "rtl" } : {}
                                                )}
                                            </div>
                                            <div className="text-[13px] font-bold">
                                                {renderEditable(
                                                    "header_rollno",
                                                    paperData.headerDetails?.rollNoLabel ||
                                                    (isUrduPaper(paperData.paperInfo.subject)
                                                        ? "رول نمبر: ______________"
                                                        : "Roll No: ______________"),
                                                    (val) => updateHeaderDetail("rollNoLabel", val),
                                                    isUrduPaper(paperData.paperInfo.subject)
                                                        ? { className: "font-urdu", dir: "rtl" }
                                                        : {},
                                                )}
                                            </div>
                                        </div>,
                                    );

                                case "h-school-name":
                                    return wrapSection(
                                        "h-school-name",
                                        <h1 className="text-[34px] md:text-[38px] font-black uppercase tracking-tight leading-normal mb-6 text-zinc-900 text-center w-full">
                                            {renderEditable(
                                                "header_school",
                                                paperData.headerDetails?.schoolName ||
                                                "AMIN MODEL HIGH SCHOOL AND SCIENCE ACADEMY",
                                                (val) => updateHeaderDetail("schoolName", val),
                                                isUrduPaper(paperData.paperInfo.subject) ? { className: "font-urdu" } : {}
                                            )}
                                        </h1>,
                                    );

                                case "h-system-badge":
                                    return wrapSection(
                                        "h-system-badge",
                                        <div className="flex items-center justify-center gap-3 mb-6">
                                            <div className="h-px w-8 bg-zinc-300" />
                                            <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                                                {renderEditable(
                                                    "header_system",
                                                    paperData.headerDetails?.systemBadge ||
                                                    (isUrduPaper(paperData.paperInfo.subject)
                                                        ? "بورڈ آف انٹرمیڈیٹ اینڈ سیکنڈری ایجوکیشن ریپلیکا امتحانی نظام"
                                                        : "BISE REPLICA EXAMINATION SYSTEM"),
                                                    (val) => updateHeaderDetail("systemBadge", val),
                                                    isUrduPaper(paperData.paperInfo.subject) ? { className: "font-urdu", dir: "rtl" } : {}
                                                )}
                                            </span>
                                            <div className="h-px w-8 bg-zinc-300" />
                                        </div>,
                                    );

                                case "h-info-row":
                                    return wrapSection(
                                        "h-info-row",
                                        <div
                                            className={cn(
                                                "grid grid-cols-3 text-[13px] font-bold mt-4 pt-2 w-full mb-8",
                                                !isUrduPaper(paperData?.paperInfo?.subject) &&
                                                "border-t border-black",
                                            )}
                                            dir={isUrduPaper(paperData?.paperInfo?.subject) ? "rtl" : "ltr"}
                                        >
                                            <div>
                                                <span className="mr-1">
                                                    {renderEditable(
                                                        "lbl_subject",
                                                        getLabel(
                                                            "lbl_subject",
                                                            isUrduPaper(paperData?.paperInfo?.subject)
                                                                ? "مضمون:"
                                                                : "SUBJECT:",
                                                        ),
                                                        (val) => updateLabel("lbl_subject", val),
                                                        isUrduPaper(paperData?.paperInfo?.subject)
                                                            ? { className: "font-urdu", dir: "rtl" }
                                                            : {},
                                                    )}
                                                </span>
                                                <span className="uppercase font-extrabold">
                                                    {renderEditable(
                                                        "info_subject",
                                                        paperData?.paperInfo?.subject === "URDU" ? "اردو" : (paperData?.paperInfo?.subject || "Urdu"),
                                                        (val) => updatePaperInfo("subject", val),
                                                        isUrduPaper(paperData?.paperInfo?.subject) ? { className: "font-urdu", dir: "rtl" } : {}
                                                    )}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className="mr-1">
                                                    {renderEditable(
                                                        "lbl_class",
                                                        getLabel(
                                                            "lbl_class",
                                                            isUrduPaper(paperData?.paperInfo?.subject)
                                                                ? "کلاس:"
                                                                : "CLASS:",
                                                        ),
                                                        (val) => updateLabel("lbl_class", val),
                                                        isUrduPaper(paperData?.paperInfo?.subject)
                                                            ? { className: "font-urdu", dir: "rtl" }
                                                            : {},
                                                    )}
                                                </span>
                                                <span className="uppercase font-extrabold">
                                                    {renderEditable(
                                                        "info_class",
                                                        paperData?.paperInfo?.class === "10TH GRADE" ? "دہم کلاس" : (paperData?.paperInfo?.class || "10th Class"),
                                                        (val) => updatePaperInfo("class", val),
                                                        isUrduPaper(paperData?.paperInfo?.subject) ? { className: "font-urdu", dir: "rtl" } : {}
                                                    )}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                {renderEditable(
                                                    "header_paper_label",
                                                    paperData.headerDetails?.paperLabel ||
                                                    (isUrduPaper(paperData?.paperInfo?.subject)
                                                        ? "پرچہ: حصہ اول (معروضی)"
                                                        : "PAPER: II (Objective)"),
                                                    (val) => updateHeaderDetail("paperLabel", val),
                                                    isUrduPaper(paperData?.paperInfo?.subject)
                                                        ? { className: "font-urdu" }
                                                        : {},
                                                )}
                                            </div>
                                        </div>,
                                    );

                                case "mcq-instruction":
                                    return wrapSection(
                                        "mcq-instruction",
                                        <div className="text-[12px] font-bold mb-6 border border-black p-2 text-center w-full bg-zinc-50/50">
                                            {renderEditable(
                                                "mcq_instruction",
                                                paperData.headerDetails?.mcqInstruction ||
                                                (isUrduPaper(paperData?.paperInfo?.subject)
                                                    ? "نوٹ: ہر سوال کے چار ممکنہ جوابات (الف، ب، ج، د) دیئے گئے ہیں۔ جو جواب آپ کو درست لگے، سوال نمبر کے سامنے اس دائرے کو پر کریں۔"
                                                    : "Note: You have four choices for each objective type question as A, B, C and D. The choice which you think is correct, fill that circle in front of that question number."),
                                                (val) => updateHeaderDetail("mcqInstruction", val),
                                                {
                                                    tagName: "p",
                                                    className: isUrduPaper(paperData?.paperInfo?.subject)
                                                        ? "font-urdu"
                                                        : "",
                                                },
                                            )}
                                        </div>,
                                    );

                                case "sh-header-block":
                                case "subjective-header":
                                    return (
                                        <div key="subjective-header" className="section-container">
                                            <div
                                                className="text-center my-8 py-2"
                                                style={getSectionStyle("subjective_header_block")}
                                            >
                                                <h2 className="text-[24px] font-black uppercase tracking-[0.2em] mb-1">
                                                    {renderEditable(
                                                        "sub_header_title",
                                                        paperData.headerDetails?.subjectiveTitle ||
                                                        (isUrduPaper(paperData?.paperInfo?.subject)
                                                            ? "حصہ دوم (انشائیہ)"
                                                            : "PART-II (Subjective)"),
                                                        (val) => updateHeaderDetail("subjectiveTitle", val),
                                                        isUrduPaper(paperData?.paperInfo?.subject)
                                                            ? { className: "font-urdu" }
                                                            : {},
                                                    )}
                                                </h2>
                                                <div className="flex justify-center items-center gap-4 text-[14px] font-bold">
                                                    {isUrduPaper(paperData?.paperInfo?.subject) ? (
                                                        <>
                                                            <span className="font-urdu" dir="rtl">
                                                                وقت: {paperData.headerDetails?.timeAllowed || "2:10 Hours"}
                                                            </span>
                                                            <span className="text-zinc-400">—</span>
                                                            <span className="font-urdu" dir="rtl">
                                                                کل نمبر: {paperData.headerDetails?.totalMarks || "60"}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>
                                                                Time: {paperData.headerDetails?.timeAllowed || "2:10 Hours"}
                                                            </span>
                                                            <span className="text-zinc-400">—</span>
                                                            <span>
                                                                Marks: {paperData.headerDetails?.totalMarks || "60"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );

                                case "sq-header":
                                    return wrapSection(
                                        "sq-header",
                                        <div className="flex justify-between font-bold mb-6 text-[16px] w-full pt-8">
                                            <div
                                                className={cn(
                                                    "flex gap-2",
                                                    isUrduPaper(paperData.paperInfo.subject) &&
                                                    "flex-row-reverse",
                                                )}
                                            >
                                                <span className="font-black">Q.2</span>
                                                {renderEditable(
                                                    "sq_main_instruction",
                                                    getLabel(
                                                        "sq_main_instruction",
                                                        isUrduPaper(paperData.paperInfo.subject)
                                                            ? "مختصر سوالات کے جوابات تحریر کریں۔"
                                                            : "Write short answers to any FIVE (5) of the following questions.",
                                                    ),
                                                    (val) => updateLabel("sq_main_instruction", val),
                                                    isUrduPaper(paperData.paperInfo.subject)
                                                        ? { className: "font-urdu" }
                                                        : {},
                                                )}
                                            </div>
                                            <span className="font-black">(10)</span>
                                        </div>,
                                    );
                            }

                            // 2. DYNAMIC ATOMIC MCQ ITEMS
                            if (sectionKey.startsWith("mcq-")) {
                                const idx = parseInt(sectionKey.replace("mcq-", ""));
                                if (isNaN(idx) || !paperData.mcqs?.[idx]) return null;

                                const mcq = paperData.mcqs[idx];
                                const mcqId = `mcq_item_${idx}`;

                                // Turjama-tul-Quran Subject Specific Logic (Atomic)
                                const subjectsQuran = ["tarjamatulquran", "tarjumatulquran"];
                                if (
                                    subjectsQuran.includes(
                                        paperData.paperInfo?.subject
                                            ?.toLowerCase()
                                            .replace(/[_\s-]/g, ""),
                                    )
                                ) {
                                    return wrapSection(
                                        mcqId,
                                        <div className="page-break-inside-avoid border border-zinc-200 rounded p-4 mb-4">
                                            <div className="mb-2 border-b border-dotted border-zinc-300 pb-2">
                                                <div
                                                    className="flex justify-between items-start mb-1"
                                                    dir="rtl"
                                                >
                                                    <span className="font-bold ml-2" dir="ltr">({idx + 1})</span>
                                                    <div className="flex-1 text-right font-urdu text-[18px]">
                                                        {renderEditable(
                                                            `mcq-ur-${idx}-q`,
                                                            mcq.ur,
                                                            (val) => updateMcq(idx, "ur", val),
                                                            { className: "font-urdu", dir: "rtl" },
                                                        )}
                                                    </div>
                                                </div>
                                                {mcq.en && (
                                                    <div
                                                        className="text-left font-arabic text-[20px] text-zinc-600 pl-8 mt-1"
                                                        dir="rtl"
                                                    >
                                                        {renderEditable(
                                                            `mcq-en-${idx}-q`,
                                                            mcq.en,
                                                            (val) => updateMcq(idx, "en", val),
                                                            { className: "font-arabic", dir: "rtl" },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className="grid grid-cols-2 lg:grid-cols-4 gap-2"
                                                dir="rtl"
                                            >
                                                {mcq.options.map((opt: any, oIdx: number) => {
                                                    const optId = `mcq-${idx}-opt-${oIdx}`;
                                                    return (
                                                        <div
                                                            key={oIdx}
                                                            className="text-[14px] text-right font-urdu border border-zinc-100 rounded px-2 py-1 hover:bg-emerald-50/30"
                                                        >
                                                            <span className="font-bold ml-1 text-emerald-600">
                                                                ({["الف", "ب", "ج", "د"][oIdx]})
                                                            </span>
                                                            {renderEditable(
                                                                optId,
                                                                opt.ur,
                                                                (val) => updateMcqOption(idx, oIdx, "ur", val),
                                                                { className: "font-urdu inline", dir: "rtl" },
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>,
                                    );
                                }

                                // General/Urdu Atomic MCQ
                                const isUrdu = isUrduPaper(paperData.paperInfo.subject);
                                return wrapSection(
                                    mcqId,
                                    <div
                                        className="mb-6 group/mcq relative page-break-inside-avoid"
                                        dir={isUrdu ? "rtl" : "ltr"}
                                    >
                                        <div
                                            className={cn(
                                                "flex gap-2 items-start mb-2",
                                                isUrdu && "text-right",
                                            )}
                                        >
                                            <span className="font-black text-[14px] min-w-[24px]" dir="ltr">
                                                ({idx + 1})
                                            </span>
                                            <div className="flex-1 space-y-2">
                                                {shouldShow(mcqId, "en") && mcq.en && (
                                                    <div className="font-serif leading-tight text-[15px]">
                                                        {renderEditable(
                                                            `mcq-${idx}-question-en`,
                                                            mcq.en,
                                                            (val) => updateMcq(idx, "en", val),
                                                        )}
                                                    </div>
                                                )}
                                                {shouldShow(mcqId, "ur") && mcq.ur && (
                                                    <div
                                                        className="font-urdu leading-relaxed text-[17px]"
                                                        dir="rtl"
                                                    >
                                                        {renderEditable(
                                                            `mcq-${idx}-question-ur`,
                                                            mcq.ur,
                                                            (val) => updateMcq(idx, "ur", val),
                                                            { className: "font-urdu", dir: "rtl" },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                "flex flex-wrap gap-y-3 gap-x-4 px-6",
                                                isUrdu
                                                    ? "justify-between text-right"
                                                    : "justify-between",
                                            )}
                                        >
                                            {mcq.options.map((opt: any, oIdx: number) => {
                                                const label = isUrdu
                                                    ? ["(الف)", "(ب)", "(ج)", "(د)"][oIdx]
                                                    : ["(A)", "(B)", "(C)", "(D)"][oIdx];
                                                return (
                                                    <div
                                                        key={oIdx}
                                                        className={cn(
                                                            "flex items-center gap-2 min-w-[120px]",
                                                            isUrdu && "text-right",
                                                        )}
                                                    >
                                                        <span className="font-bold text-[12px] opacity-60">
                                                            {label}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            {shouldShow(mcqId, "en") && opt.en && (
                                                                <span className="text-[13px] font-serif">
                                                                    {renderEditable(
                                                                        `mcq-${idx}-opt-${oIdx}-en`,
                                                                        opt.en,
                                                                        (val) =>
                                                                            updateMcqOption(idx, oIdx, "en", val),
                                                                    )}
                                                                </span>
                                                            )}
                                                            {shouldShow(mcqId, "ur") && opt.ur && (
                                                                <span
                                                                    className="text-[15px] font-urdu"
                                                                    dir="rtl"
                                                                >
                                                                    {renderEditable(
                                                                        `mcq-${idx}-opt-${oIdx}-ur`,
                                                                        opt.ur,
                                                                        (val) =>
                                                                            updateMcqOption(idx, oIdx, "ur", val),
                                                                        { className: "font-urdu", dir: "rtl" },
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>,
                                );
                            }

                            // 3. DYNAMIC ATOMIC SHORT QUESTION ITEMS
                            if (sectionKey.startsWith("sq-")) {
                                const idx = parseInt(sectionKey.replace("sq-", ""));
                                if (isNaN(idx) || !paperData.shortQuestions?.[idx]) return null;
                                const sq = paperData.shortQuestions[idx];
                                const sqId = `sq_item_${idx}`;
                                return wrapSection(
                                    sqId,
                                    <div className="mb-4 group/sq relative page-break-inside-avoid">
                                        <div
                                            className={cn(
                                                "flex gap-2 items-start",
                                                isUrduPaper(paperData.paperInfo.subject) &&
                                                "text-right",
                                            )}
                                            dir={isUrduPaper(paperData.paperInfo.subject) ? "rtl" : "ltr"}
                                        >
                                            <span className="font-black text-[14px] min-w-[24px] notranslate" dir="ltr">
                                                ({idx + 1})
                                            </span>
                                            <div className="flex-1 space-y-1">
                                                {shouldShow(sqId, "en") && sq.en && (
                                                    <div className="font-serif text-[14px]">
                                                        {renderEditable(`sq-${idx}-en`, sq.en, (val) =>
                                                            updateShortQuestion(idx, "en", val),
                                                        )}
                                                    </div>
                                                )}
                                                {shouldShow(sqId, "ur") && sq.ur && (
                                                    <div className="font-urdu text-[16px]" dir="rtl">
                                                        {renderEditable(
                                                            `sq-${idx}-ur`,
                                                            sq.ur,
                                                            (val) => updateShortQuestion(idx, "ur", val),
                                                            { className: "font-urdu", dir: "rtl" },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>,
                                );
                            }

                            // 4. GROUPED COMPONENTS (LEGACY OR SPECIAL MODE)
                            // If we reach here, check for grouped keys if they haven't been handled yet

                            if (sectionKey === "mcqs" || sectionKey === "mcqs-grammar") {
                                // If Urdu Mode, we might want to group them
                                if (isUrduPaper(paperData.paperInfo.subject)) {
                                    // Use the grouped logic but mark indices as used
                                    const renderedUrduGroups = urduMcqGroups.map(
                                        (group, gIdx) => {
                                            const groupMcqs = paperData.mcqs.filter(
                                                (m: any, idx: number) => {
                                                    if (m.type === group.type) {
                                                        usedMcqIndices.add(idx);
                                                        return true;
                                                    }
                                                    return false;
                                                },
                                            );
                                            if (groupMcqs.length === 0) return null;

                                            return (
                                                <div
                                                    key={gIdx}
                                                    className="mb-6 relative page-break-inside-avoid"
                                                    dir={isUrdu ? "rtl" : "ltr"}
                                                >
                                                    <div className="font-urdu font-black text-[20px] mb-4 pb-2 flex justify-between items-center">
                                                        {renderEditable(
                                                            group.key,
                                                            getLabel(group.key, group.title),
                                                            (val) => updateLabel(group.key, val),
                                                            { className: "font-urdu", dir: "rtl" },
                                                        )}
                                                        <span className="text-[14px] font-bold">(05)</span>
                                                    </div>
                                                    {groupMcqs.map((mcq: any) => {
                                                        const originalIdx = paperData.mcqs.indexOf(mcq);
                                                        return (
                                                            <div
                                                                key={originalIdx}
                                                                className="mb-8 page-break-inside-avoid"
                                                            >
                                                                <div className="font-urdu text-[18px] mb-3 flex gap-2">
                                                                    <span className="font-bold ml-2" dir="ltr">
                                                                        ({originalIdx + 1})
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        {renderEditable(
                                                                            `mcq-ur-${originalIdx}-question`,
                                                                            mcq.ur,
                                                                            (val) =>
                                                                                updateMcq(originalIdx, "ur", val),
                                                                            { className: "font-urdu", dir: "rtl" },
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pr-8">
                                                                    {mcq.options.map((opt: any, oIdx: number) => (
                                                                        <div
                                                                            key={oIdx}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <span className="font-urdu font-bold text-emerald-600">
                                                                                ({["الف", "ب", "ج", "د"][oIdx]})
                                                                            </span>
                                                                            <div className="font-urdu text-[16px]">
                                                                                {renderEditable(
                                                                                    `mcq-ur-${originalIdx}-opt-${oIdx}`,
                                                                                    opt.ur,
                                                                                    (val) =>
                                                                                        updateMcqOption(
                                                                                            originalIdx,
                                                                                            oIdx,
                                                                                            "ur",
                                                                                            val,
                                                                                        ),
                                                                                    {
                                                                                        className: "font-urdu",
                                                                                        dir: "rtl",
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        },
                                    );

                                    const remainingUrduMcqs = paperData.mcqs.filter(
                                        (_: any, idx: number) => !usedMcqIndices.has(idx),
                                    );

                                    return (
                                        <div key="grouped-urdu-mcqs">
                                            {renderedUrduGroups}
                                            {remainingUrduMcqs.length > 0 && (
                                                <div
                                                    className="mt-8 pt-8 border-t-2 border-dashed border-zinc-200"
                                                    dir="rtl"
                                                >
                                                    <p className="font-urdu font-bold text-[18px] mb-4 text-zinc-400 uppercase italic">
                                                        Remaining Questions
                                                    </p>
                                                    {remainingUrduMcqs.map((mcq: any) => {
                                                        const originalIdx = paperData.mcqs.indexOf(mcq);
                                                        return (
                                                            <div
                                                                key={originalIdx}
                                                                className="mb-6 page-break-inside-avoid"
                                                            >
                                                                <div className="font-urdu text-[16px] mb-2 flex gap-2">
                                                                    <span className="font-bold notranslate" dir="ltr">
                                                                        ({originalIdx + 1})
                                                                    </span>
                                                                    {renderEditable(
                                                                        `mcq-rem-${originalIdx}`,
                                                                        mcq.ur || mcq.en,
                                                                        (val) => updateMcq(originalIdx, "ur", val),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }

                            // Turjama-tul-Quran MCQ Logic
                            // Normalize subject by removing spaces and special chars, and lowercasing
                            const normalizedSubject = paperData.paperInfo.subject
                                .toLowerCase()
                                .replace(/[_\s-]/g, "");
                            if (
                                ["tarjamatulquran", "tarjumatulquran"].includes(
                                    normalizedSubject,
                                )
                            ) {
                                return Array.from({
                                    length: Math.ceil(paperData.mcqs.length / 2),
                                }).map((_, rowIndex) => {
                                    const firstIdx = rowIndex * 2;
                                    const secondIdx = firstIdx + 1;
                                    const mcqsInRow = [
                                        paperData.mcqs[firstIdx],
                                        paperData.mcqs[secondIdx],
                                    ].filter(Boolean);

                                    return (
                                        <div
                                            key={rowIndex}
                                            className="flex flex-col gap-4 mb-4 page-break-inside-avoid"
                                        >
                                            {mcqsInRow.map((mcq: any, i: number) => {
                                                const originalIdx = firstIdx + i;
                                                const mcqItemId = `mcq-quran-${originalIdx}`;
                                                return (
                                                    <div
                                                        key={originalIdx}
                                                        id={mcqItemId}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSectionClick?.(mcqItemId, e);
                                                        }}
                                                        className={cn(
                                                            "flex-1 border border-zinc-200 rounded p-2 cursor-pointer hover:bg-zinc-50/50 transition-colors",
                                                            selectedSectionIds.includes(mcqItemId) &&
                                                            "ring-2 ring-emerald-500 ring-inset",
                                                        )}
                                                        style={getSectionStyle(mcqItemId)}
                                                    >
                                                        <div className="mb-2 border-b border-dotted border-zinc-300 pb-2">
                                                            <div
                                                                className="flex justify-between items-start mb-1"
                                                                dir="rtl"
                                                            >
                                                                <span className="font-bold ml-2 notranslate" dir="ltr">
                                                                    ({originalIdx + 1})
                                                                </span>
                                                                {shouldShow(mcqItemId, "ur") && (
                                                                    <div className="flex-1 text-right font-urdu text-[16px]">
                                                                        {renderEditable(
                                                                            `mcq-ur-${originalIdx}-q`,
                                                                            mcq.ur,
                                                                            (val) =>
                                                                                updateMcq(originalIdx, "ur", val),
                                                                            { className: "font-urdu", dir: "rtl" },
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {shouldShow(mcqItemId, "en") && (
                                                                <div
                                                                    className="text-left font-arabic text-[18px] text-zinc-600 pl-8 mt-1"
                                                                    dir="rtl"
                                                                >
                                                                    {renderEditable(
                                                                        `mcq-en-${originalIdx}-q`,
                                                                        mcq.en,
                                                                        (val) => updateMcq(originalIdx, "en", val),
                                                                        { className: "font-arabic", dir: "rtl" },
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {mcq.options.map((opt: any, oIdx: number) => {
                                                                const optId = `mcq-quran-${originalIdx}-opt-${oIdx}`;
                                                                return (
                                                                    <div
                                                                        key={oIdx}
                                                                        id={optId}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onSectionClick?.(optId, e);
                                                                        }}
                                                                        className={cn(
                                                                            "text-[14px] text-right font-urdu border border-zinc-100 rounded px-1 hover:bg-emerald-50/30 cursor-pointer",
                                                                            selectedSectionIds.includes(optId) &&
                                                                            "ring-1 ring-emerald-400 bg-emerald-500/5",
                                                                        )}
                                                                        style={getSectionStyle(optId)}
                                                                        dir="rtl"
                                                                    >
                                                                        <span className="font-bold ml-1 text-[12px] text-emerald-600 notranslate">
                                                                            ({["الف", "ب", "ج", "د"][oIdx]})
                                                                        </span>
                                                                        {renderEditable(
                                                                            optId,
                                                                            opt.ur,
                                                                            (val) =>
                                                                                updateMcqOption(
                                                                                    originalIdx,
                                                                                    oIdx,
                                                                                    "ur",
                                                                                    val,
                                                                                ),
                                                                            {
                                                                                className: "font-urdu inline",
                                                                                dir: "rtl",
                                                                            },
                                                                        )}
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
                            }

                            // Atomic MCQ Instruction
                            if (sectionKey === "mcq-instruction") {
                                return wrapSection(
                                    "mcq-instruction",
                                    <div
                                        className={cn(
                                            "font-bold mb-4",
                                            isUrduPaper(paperData.paperInfo.subject) &&
                                            "font-urdu text-right",
                                        )}
                                    >
                                        {renderEditable(
                                            "mcq_instruction",
                                            getLabel(
                                                "mcq_instruction",
                                                isUrduPaper(paperData.paperInfo.subject)
                                                    ? "ہر سوال کے چار ممکنہ جوابات دئے گئے ہیں۔ درست جواب کا انتخاب کریں۔"
                                                    : "Choose the correct answer from the given options.",
                                            ),
                                            (val) => updateLabel("mcq_instruction", val),
                                        )}
                                    </div>,
                                );
                            }

                            // Atomic MCQ Item
                            if (
                                sectionKey.startsWith("mcq-") &&
                                !sectionKey.startsWith("mcq-ur-") &&
                                !sectionKey.startsWith("mcq-quran-")
                            ) {
                                const idx = parseInt(sectionKey.replace("mcq-", ""));
                                if (!isNaN(idx) && paperData.mcqs?.[idx]) {
                                    const mcq = paperData.mcqs[idx];
                                    const originalIdx = idx; // Since we are using absolute index
                                    const mcqItemId = `mcq-item-${originalIdx}`;

                                    // Reuse the formatting logic from generic fallback but for single item
                                    return wrapSection(
                                        mcqItemId,
                                        <div className="mb-6 relative">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-[14px] flex-1 pr-4">
                                                    <span className="font-bold mr-2 notranslate">
                                                        {originalIdx + 1}.
                                                    </span>
                                                    {shouldShow(mcqItemId, "en") &&
                                                        renderEditable(
                                                            `mcq-${originalIdx}-question`,
                                                            mcq.en,
                                                            (val) => updateMcq(originalIdx, "en", val),
                                                        )}
                                                    {shouldShow(mcqItemId, "ur") && mcq.ur && (
                                                        <div
                                                            className="font-urdu text-[16px] text-right mt-1"
                                                            dir="rtl"
                                                        >
                                                            {renderEditable(
                                                                `mcq-ur-${originalIdx}-question`,
                                                                mcq.ur,
                                                                (val) => updateMcq(originalIdx, "ur", val),
                                                                { className: "font-urdu", dir: "rtl" },
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-x-2 mt-2 border-t border-dotted border-zinc-200 pt-1 relative">
                                                {mcq.options.map((opt: any, oIdx: number) => {
                                                    const optId = `mcq-${originalIdx}-opt-${oIdx}`;
                                                    return (
                                                        <div
                                                            key={oIdx}
                                                            id={optId}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSectionClick?.(optId, e);
                                                            }}
                                                            className={cn(
                                                                "flex items-start text-[12px] leading-tight group cursor-pointer hover:bg-emerald-50/30 rounded px-1 transition-all min-h-[32px] py-1",
                                                                selectedSectionIds.includes(optId) &&
                                                                "ring-1 ring-emerald-400 bg-emerald-500/5",
                                                            )}
                                                            style={getSectionStyle(optId)}
                                                        >
                                                            <span className="font-bold mr-2 mt-0.5 notranslate">
                                                                {isUrduPaper(paperData.paperInfo.subject)
                                                                    ? `(${["الف", "ب", "ج", "د"][oIdx]})`
                                                                    : `(${String.fromCharCode(65 + oIdx)})`}
                                                            </span>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                {shouldShow(mcqItemId, "en", optId) && (
                                                                    <span className="block wrap-break-word">
                                                                        {renderEditable(optId, opt.en, (val) =>
                                                                            updateMcqOption(
                                                                                originalIdx,
                                                                                oIdx,
                                                                                "en",
                                                                                val,
                                                                            ),
                                                                        )}
                                                                    </span>
                                                                )}
                                                                {shouldShow(mcqItemId, "ur", optId) &&
                                                                    opt.ur && (
                                                                        <span
                                                                            className="block font-urdu text-right"
                                                                            dir="rtl"
                                                                        >
                                                                            {renderEditable(
                                                                                `mcq-ur-${originalIdx}-opt-${oIdx}`,
                                                                                opt.ur,
                                                                                (val) =>
                                                                                    updateMcqOption(
                                                                                        originalIdx,
                                                                                        oIdx,
                                                                                        "ur",
                                                                                        val,
                                                                                    ),
                                                                                { className: "font-urdu", dir: "rtl" },
                                                                            )}
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>,
                                    );
                                }
                            }

                            // Generic MCQ fallback Logic (Legacy)
                            if (sectionKey === "mcqs") {
                                const remainingMcqs = paperData.mcqs.filter(
                                    (_: any, idx: number) => !usedMcqIndices.has(idx),
                                );
                                return (
                                    <div key="mcqs-legacy-block">
                                        {remainingMcqs.map((mcq: any) => {
                                            const originalIdx = paperData.mcqs.indexOf(mcq);
                                            const mcqItemId = `mcq-item-${originalIdx}`;
                                            return (
                                                <div key={originalIdx} id={mcqItemId} className="mb-8">
                                                    {/* Simplified rendering for legacy block to avoid duplication code complexity here, 
                                                        ideally this block is deprecated in favor of atomic keys */}
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold mr-2 notranslate">
                                                            {originalIdx + 1}.
                                                        </span>
                                                        {renderEditable(
                                                            `mcq-${originalIdx}-question`,
                                                            mcq.en,
                                                            (val) => updateMcq(originalIdx, "en", val),
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }
                            if (
                                (sectionKey === "short-questions" ||
                                    sectionKey === "short-questions-lessons") &&
                                (paperData.shortQuestions?.length > 0 ||
                                    paperData.urduData?.shyrNazm?.length > 0)
                            ) {
                                return (
                                    <div key={sectionKey} className="section-container">
                                        {wrapSection(
                                            "short-questions",
                                            <div className="mb-6">
                                                {/* Pre-Question Note Section */}
                                                <div className="mb-4 italic text-[13px] text-zinc-600 bg-zinc-50/50 p-2 rounded border-l-4 border-zinc-200 print:bg-transparent print:border-l-0 break-inside-avoid page-break-inside-avoid">
                                                    {renderEditable(
                                                        "sq_note",
                                                        getLabel(
                                                            "sq_note",
                                                            isUrduPaper(paperData.paperInfo.subject)
                                                                ? "نوٹ: مندرجہ ذیل سوالات کے جوابات غور سے تحریر کریں۔"
                                                                : "Note: Answer the following questions carefully.",
                                                        ),
                                                        (val) => updateLabel("sq_note", val),
                                                        isUrduPaper(paperData.paperInfo.subject)
                                                            ? { className: "font-urdu italic", dir: "rtl" }
                                                            : { className: "italic" },
                                                    )}
                                                </div>

                                                {(() => {
                                                    let components = [];
                                                    const isUrdu = isUrduPaper(
                                                        paperData.paperInfo.subject,
                                                    );

                                                    // Standard Short Questions (Chunked)
                                                    if (paperData.shortQuestions?.length > 0) {
                                                        const chunks: Array<
                                                            Array<{ data: any; globalIdx: number }>
                                                        > = [];
                                                        const rawQuestions = paperData.shortQuestions.map(
                                                            (q: any, i: number) => ({
                                                                data: q,
                                                                globalIdx: i,
                                                            }),
                                                        );

                                                        for (let i = 0; i < rawQuestions.length; i += 6) {
                                                            chunks.push(rawQuestions.slice(i, i + 6));
                                                        }

                                                        if (chunks.length > 1) {
                                                            const lastChunk = chunks[chunks.length - 1];
                                                            if (lastChunk.length < 5) {
                                                                const prevChunk = chunks[chunks.length - 2];
                                                                prevChunk.push(...lastChunk);
                                                                chunks.pop();
                                                            }
                                                        }

                                                        const chunkComponents = chunks.map(
                                                            (chunk, cIdx) => {
                                                                // For Urdu papers, Poem is Q2, so Short Questions start from Q3
                                                                const questionNum = isUrdu
                                                                    ? 3 + cIdx
                                                                    : 2 + cIdx;
                                                                const attemptCount = Math.floor(
                                                                    (chunk.length * 2) / 3,
                                                                );
                                                                const chunkId = `q-chunk-${questionNum}`;
                                                                const bilingualSideBySide =
                                                                    paperData.layout?.bilingualMode ===
                                                                    "sideBySide";

                                                                return (
                                                                    <div
                                                                        key={`chunk-${cIdx}`}
                                                                        className={cn(
                                                                            "mb-8 cursor-pointer hover:bg-zinc-50/20 rounded p-1 transition-colors",
                                                                            selectedSectionIds.includes(chunkId) &&
                                                                            "ring-2 ring-emerald-500",
                                                                            isUrdu && "text-right",
                                                                        )}
                                                                        id={chunkId}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onSectionClick?.(chunkId, e);
                                                                        }}
                                                                        style={getSectionStyle(chunkId)}
                                                                        dir={isUrdu ? "rtl" : "ltr"}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                "flex justify-between font-bold mb-4 text-[14px]",
                                                                                isUrdu && "flex-row-reverse",
                                                                            )}
                                                                        >
                                                                            <span
                                                                                className={isUrdu ? "font-urdu" : ""}
                                                                            >
                                                                                <span
                                                                                    className={isUrdu ? "ml-1" : "mr-1"}
                                                                                >
                                                                                    {isUrdu
                                                                                        ? `سوال نمبر ${questionNum}:`
                                                                                        : `${questionNum}.`}
                                                                                </span>
                                                                                <span className="notranslate">
                                                                                    {renderEditable(
                                                                                        `lbl_sq_title_${cIdx}`,
                                                                                        getLabel(
                                                                                            `lbl_sq_title_${cIdx}`,
                                                                                            isUrdu
                                                                                                ? `درج ذیل میں سے کوئی سے (${attemptCount}) سوالات کے مختصر جوابات تحریر کریں۔`
                                                                                                : `Write short answers to any ${attemptCount} questions.`,
                                                                                        ),
                                                                                        (val) =>
                                                                                            updateLabel(
                                                                                                `lbl_sq_title_${cIdx}`,
                                                                                                val,
                                                                                            ),
                                                                                        isUrdu
                                                                                            ? {
                                                                                                className: "font-urdu",
                                                                                                dir: "rtl",
                                                                                            }
                                                                                            : {},
                                                                                    )}
                                                                                </span>
                                                                                <span className="notranslate">
                                                                                    (2 x {attemptCount} = {attemptCount * 2}
                                                                                    )
                                                                                </span>
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-4">
                                                                            {chunk.map(
                                                                                ({ data: sq, globalIdx }, idx) => {
                                                                                    const sqId = `sq-item-${globalIdx}`;
                                                                                    return (
                                                                                        <div
                                                                                            key={globalIdx}
                                                                                            id={sqId}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                onSectionClick?.(sqId, e);
                                                                                            }}
                                                                                            className={cn(
                                                                                                "flex gap-4 items-start page-break-inside-avoid cursor-pointer hover:bg-emerald-50/30 rounded px-1 transition-all",
                                                                                                selectedSectionIds.includes(
                                                                                                    sqId,
                                                                                                ) &&
                                                                                                "ring-1 ring-emerald-400 bg-emerald-500/5",
                                                                                                bilingualSideBySide
                                                                                                    ? "flex-row"
                                                                                                    : "flex-col",
                                                                                                isUrdu && "flex-row-reverse",
                                                                                            )}
                                                                                            style={getSectionStyle(sqId)}
                                                                                        >
                                                                                            <div
                                                                                                className={cn(
                                                                                                    "flex justify-between items-start w-full",
                                                                                                    isUrdu && "flex-row-reverse",
                                                                                                )}
                                                                                            >
                                                                                                <div
                                                                                                    className={cn(
                                                                                                        "font-bold min-w-[25px] text-[14px] pt-1",
                                                                                                        isUrdu && "text-right",
                                                                                                    )}
                                                                                                    dir="ltr"
                                                                                                >
                                                                                                    ({idx + 1})
                                                                                                </div>
                                                                                                <div className="flex-1 flex flex-col gap-1 mx-2">
                                                                                                    {bilingualSideBySide ? (
                                                                                                        <div className="grid grid-cols-2 gap-12 w-full items-start">
                                                                                                            {shouldShow(
                                                                                                                sqId,
                                                                                                                "en",
                                                                                                                chunkId,
                                                                                                            ) && (
                                                                                                                    <div className="text-[14px] leading-relaxed text-left w-full font-serif">
                                                                                                                        {renderEditable(
                                                                                                                            `sq_en_${globalIdx}`,
                                                                                                                            sq.en,
                                                                                                                            (val) =>
                                                                                                                                updateShortQuestion(
                                                                                                                                    globalIdx,
                                                                                                                                    "en",
                                                                                                                                    val,
                                                                                                                                ),
                                                                                                                            {
                                                                                                                                className:
                                                                                                                                    "font-serif",
                                                                                                                            },
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            {shouldShow(
                                                                                                                sqId,
                                                                                                                "ur",
                                                                                                                chunkId,
                                                                                                            ) && (
                                                                                                                    <div
                                                                                                                        className={cn(
                                                                                                                            "text-[18px] leading-relaxed font-urdu text-right w-full",
                                                                                                                            shouldShow(
                                                                                                                                sqId,
                                                                                                                                "en",
                                                                                                                                chunkId,
                                                                                                                            ) &&
                                                                                                                            "border-l border-zinc-100 pl-6",
                                                                                                                        )}
                                                                                                                        dir="rtl"
                                                                                                                    >
                                                                                                                        {renderEditable(
                                                                                                                            `sq_ur_${globalIdx}`,
                                                                                                                            sq.ur,
                                                                                                                            (val) =>
                                                                                                                                updateShortQuestion(
                                                                                                                                    globalIdx,
                                                                                                                                    "ur",
                                                                                                                                    val,
                                                                                                                                ),
                                                                                                                            {
                                                                                                                                className:
                                                                                                                                    "font-urdu",
                                                                                                                                dir: "rtl",
                                                                                                                            },
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="space-y-2 w-full">
                                                                                                            {shouldShow(
                                                                                                                sqId,
                                                                                                                "en",
                                                                                                                chunkId,
                                                                                                            ) && (
                                                                                                                    <div className="text-[14px] w-full text-left font-serif">
                                                                                                                        {renderEditable(
                                                                                                                            `sq_en_${globalIdx}`,
                                                                                                                            sq.en,
                                                                                                                            (val) =>
                                                                                                                                updateShortQuestion(
                                                                                                                                    globalIdx,
                                                                                                                                    "en",
                                                                                                                                    val,
                                                                                                                                ),
                                                                                                                            {
                                                                                                                                className:
                                                                                                                                    "font-serif",
                                                                                                                            },
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            {shouldShow(
                                                                                                                sqId,
                                                                                                                "ur",
                                                                                                                chunkId,
                                                                                                            ) && (
                                                                                                                    <div
                                                                                                                        className="text-[18px] font-urdu text-right w-full"
                                                                                                                        dir="rtl"
                                                                                                                    >
                                                                                                                        {renderEditable(
                                                                                                                            `sq_ur_${globalIdx}`,
                                                                                                                            sq.ur,
                                                                                                                            (val) =>
                                                                                                                                updateShortQuestion(
                                                                                                                                    globalIdx,
                                                                                                                                    "ur",
                                                                                                                                    val,
                                                                                                                                ),
                                                                                                                            {
                                                                                                                                className:
                                                                                                                                    "font-urdu",
                                                                                                                                dir: "rtl",
                                                                                                                            },
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                },
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        );
                                                        components.push(...chunkComponents);
                                                    }

                                                    return components;
                                                })()}
                                            </div>,
                                        )
                                        }
                                    </div>
                                );
                            }

                            if (sectionKey === "quran-vocabulary") {
                                const isQuranSubject =
                                    paperData.paperInfo.subject
                                        ?.toLowerCase()
                                        .replace(/[_\s-]/g, "") === "tarjamatulquran";
                                return (
                                    <div key="quran-vocabulary" className="section-container">
                                        {(isQuranSubject || paperData.quranData?.vocabulary) && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("quran_vocab_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="quran_vocab_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("quran_vocab_section", e);
                                                }}
                                                style={getSectionStyle("quran_vocab_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    <span className="notranslate">
                                                        سوال نمبر 3: درج ذیل قرآنی الفاظ کے معانی تحریر
                                                        کریں۔
                                                    </span>
                                                    <span className="notranslate">(05)</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <table className="w-full border-collapse border-2 border-black text-center font-bold">
                                                        <thead>
                                                            <tr className="bg-zinc-100">
                                                                <th className="border-2 border-black p-2 font-urdu text-[16px]">
                                                                    الفاظ
                                                                </th>
                                                                <th className="border-2 border-black p-2 font-urdu text-[16px]">
                                                                    معانی
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(
                                                                paperData.quranData?.vocabulary ||
                                                                Array(8).fill({ arabic: "...", urdu: "..." })
                                                            ).map((item: any, idx: number) => (
                                                                <tr key={idx}>
                                                                    {shouldShow("quran_vocab_section", "ar") && (
                                                                        <td
                                                                            className="border-2 border-black p-2 font-arabic text-[22px]"
                                                                            dir="rtl"
                                                                        >
                                                                            {renderEditable(
                                                                                `vocab_ar_${idx}`,
                                                                                item.arabic,
                                                                                (val) => {
                                                                                    if (
                                                                                        !paperData.quranData ||
                                                                                        !setPaperData
                                                                                    )
                                                                                        return;
                                                                                    const newVocab = [
                                                                                        ...paperData.quranData.vocabulary,
                                                                                    ];
                                                                                    newVocab[idx] = {
                                                                                        ...item,
                                                                                        arabic: val,
                                                                                    };
                                                                                    setPaperData({
                                                                                        ...paperData,
                                                                                        quranData: {
                                                                                            ...paperData.quranData,
                                                                                            vocabulary: newVocab,
                                                                                        },
                                                                                    });
                                                                                },
                                                                                { className: "font-arabic" },
                                                                            )}
                                                                        </td>
                                                                    )}
                                                                    {shouldShow("quran_vocab_section", "ur") && (
                                                                        <td
                                                                            className="border-2 border-black p-2 font-urdu text-[18px]"
                                                                            dir="rtl"
                                                                        >
                                                                            {renderEditable(
                                                                                `vocab_ur_${idx}`,
                                                                                item.urdu,
                                                                                (val) => {
                                                                                    if (
                                                                                        !paperData.quranData ||
                                                                                        !setPaperData
                                                                                    )
                                                                                        return;
                                                                                    const newVocab = [
                                                                                        ...paperData.quranData.vocabulary,
                                                                                    ];
                                                                                    newVocab[idx] = {
                                                                                        ...item,
                                                                                        urdu: val,
                                                                                    };
                                                                                    setPaperData({
                                                                                        ...paperData,
                                                                                        quranData: {
                                                                                            ...paperData.quranData,
                                                                                            vocabulary: newVocab,
                                                                                        },
                                                                                    });
                                                                                },
                                                                                { className: "font-urdu" },
                                                                            )}
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "quranic-verses") {
                                const isQuranSubject =
                                    paperData.paperInfo.subject
                                        ?.toLowerCase()
                                        .replace(/[_\s-]/g, "") === "tarjamatulquran";
                                return (
                                    <div key="quranic-verses" className="section-container">
                                        {(isQuranSubject || paperData.quranData?.verses) && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("quran_trans_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="quran_trans_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("quran_trans_section", e);
                                                }}
                                                style={getSectionStyle("quran_trans_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    <span className="notranslate">
                                                        سوال نمبر 4: درج ذیل میں سے کسی دو قرآنی آیات کا با
                                                        محاورہ اردو ترجمہ تحریر کریں۔
                                                    </span>
                                                    <span className="notranslate">(15)</span>
                                                </div>
                                                <div className="space-y-8">
                                                    {(
                                                        paperData.quranData?.verses ||
                                                        Array(3).fill({ arabic: "...", urdu: "..." })
                                                    ).map((item: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="space-y-4 border-b border-zinc-100 pb-4"
                                                        >
                                                            {shouldShow("quran_trans_section", "ar") && (
                                                                <div className="flex flex-row-reverse gap-4 items-start">
                                                                    <span className="font-bold text-[18px] notranslate">
                                                                        ({["الف", "ب", "ج"][idx]})
                                                                    </span>
                                                                    <div
                                                                        className="flex-1 font-arabic text-[28px] leading-loose text-right"
                                                                        dir="rtl"
                                                                    >
                                                                        {renderEditable(
                                                                            `verse_ar_${idx}`,
                                                                            item.arabic,
                                                                            (val) => {
                                                                                if (
                                                                                    !paperData.quranData ||
                                                                                    !setPaperData
                                                                                )
                                                                                    return;
                                                                                const newVerses = [
                                                                                    ...paperData.quranData.verses,
                                                                                ];
                                                                                newVerses[idx] = {
                                                                                    ...item,
                                                                                    arabic: val,
                                                                                };
                                                                                setPaperData({
                                                                                    ...paperData,
                                                                                    quranData: {
                                                                                        ...paperData.quranData,
                                                                                        verses: newVerses,
                                                                                    },
                                                                                });
                                                                            },
                                                                            { className: "font-arabic" },
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {shouldShow("quran_trans_section", "ur") && (
                                                                <div
                                                                    className="font-urdu text-[18px] text-right text-zinc-600 bg-zinc-50 p-4 rounded-xl italic"
                                                                    dir="rtl"
                                                                >
                                                                    {renderEditable(
                                                                        `verse_ur_${idx}`,
                                                                        item.urdu || "ترجمہ یہاں تحریر کریں...",
                                                                        (val) => {
                                                                            if (!paperData.quranData || !setPaperData)
                                                                                return;
                                                                            const newVerses = [
                                                                                ...paperData.quranData.verses,
                                                                            ];
                                                                            newVerses[idx] = { ...item, urdu: val };
                                                                            setPaperData({
                                                                                ...paperData,
                                                                                quranData: {
                                                                                    ...paperData.quranData,
                                                                                    verses: newVerses,
                                                                                },
                                                                            });
                                                                        },
                                                                        { className: "font-urdu italic" },
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            if (sectionKey === "grammar-application") {
                                return (
                                    <div key="grammar-application" className="section-container">
                                        {(paperData.urduData?.sentences ||
                                            paperData.englishData?.grammar) && (
                                                <div
                                                    className={cn(
                                                        "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                        selectedSectionIds.includes("grammar_section") &&
                                                        "ring-2 ring-emerald-500",
                                                    )}
                                                    id="grammar_section"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSectionClick?.("grammar_section", e);
                                                    }}
                                                    style={getSectionStyle("grammar_section")}
                                                >
                                                    <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                        <span>GRAMMAR APPLICATION / SENTENCES</span>
                                                        <span className="notranslate">(05)</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                                                        {(
                                                            paperData.urduData?.sentences || [
                                                                "Sentence 1",
                                                                "Sentence 2",
                                                                "Sentence 3",
                                                                "Sentence 4",
                                                                "Sentence 5",
                                                            ]
                                                        ).map((s: string, idx: number) => (
                                                            <div key={idx} className="flex gap-2 items-center">
                                                                <span className="font-bold notranslate" dir="ltr">({idx + 1})</span>
                                                                <div className="flex-1 underline underline-offset-4 decoration-dotted">
                                                                    {renderEditable(
                                                                        `grammar_s_${idx}`,
                                                                        s,
                                                                        (val) => {
                                                                            if (paperData.urduData) {
                                                                                const newData = [
                                                                                    ...paperData.urduData.sentences,
                                                                                ];
                                                                                newData[idx] = val;
                                                                                setPaperData?.({
                                                                                    ...paperData,
                                                                                    urduData: {
                                                                                        ...paperData.urduData,
                                                                                        sentences: newData,
                                                                                    },
                                                                                });
                                                                            }
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                );
                            }
                            // URDU POETRY (NAZM / GHAZAL)
                            if (sectionKey === "urdu-shyr-nazm" || sectionKey === "urdu-shyr-ghazal") {
                                const isNazm = sectionKey === "urdu-shyr-nazm";
                                const data = isNazm ? paperData.urduData?.shyrNazm : paperData.urduData?.shyrGhazal;

                                if (!data || data.length === 0) return null;

                                return wrapSection(
                                    sectionKey,
                                    <div className="mb-8" dir="rtl">
                                        <div className="text-center font-urdu font-black text-[22px] mb-6 underline decoration-double decoration-zinc-400 underline-offset-8">
                                            {renderEditable(
                                                `${sectionKey}-title`,
                                                getLabel(sectionKey, isNazm ? "نظم" : "غزل"),
                                                (val) => updateLabel(sectionKey, val),
                                                { className: "font-urdu" }
                                            )}
                                        </div>
                                        <div className="space-y-6 px-12">
                                            {data.map((item: any, idx: number) => (
                                                <div key={idx} className="text-center page-break-inside-avoid">
                                                    {item.couplet ? (
                                                        <div className="font-urdu text-[20px] font-bold leading-[2.5] whitespace-pre-line">
                                                            {renderEditable(
                                                                `${sectionKey}-${idx}-couplet`,
                                                                item.couplet,
                                                                (val) => {
                                                                    const newData = [...data];
                                                                    newData[idx] = { ...item, couplet: val };
                                                                    const key = isNazm ? 'shyrNazm' : 'shyrGhazal';
                                                                    setPaperData?.({
                                                                        ...paperData,
                                                                        urduData: { ...paperData.urduData, [key]: newData }
                                                                    });
                                                                },
                                                                { className: "font-urdu text-center", dir: "rtl" }
                                                            )}
                                                        </div>
                                                    ) : typeof item === 'string' ? (
                                                        <div className="font-urdu text-[18px]">
                                                            {renderEditable(
                                                                `${sectionKey}-${idx}-text`,
                                                                item,
                                                                (val) => {
                                                                    const newData = [...data];
                                                                    newData[idx] = val;
                                                                    const key = isNazm ? 'shyrNazm' : 'shyrGhazal';
                                                                    setPaperData?.({
                                                                        ...paperData,
                                                                        urduData: { ...paperData.urduData, [key]: newData }
                                                                    });
                                                                },
                                                                { className: "font-urdu", dir: "rtl" }
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }

                            if (sectionKey === "long-questions-numerical") {
                                return (
                                    <div
                                        key="long-questions-numerical"
                                        className="section-container"
                                    >
                                        {paperData.longQuestions?.length > 0 && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("numerical_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="numerical_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("numerical_section", e);
                                                }}
                                                style={getSectionStyle("numerical_section")}
                                            >
                                                <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                    <span>LONG QUESTIONS (Numerical Based)</span>
                                                    <span className="notranslate">(05)</span>
                                                </div>
                                                <div className="space-y-6">
                                                    {paperData.longQuestions
                                                        .slice(2)
                                                        .map((lq: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl"
                                                            >
                                                                <div className="flex justify-between font-bold mb-2">
                                                                    <span className="notranslate">Q.{idx + 7} (Numerical)</span>
                                                                </div>
                                                                {lq.parts?.map((part: any, pIdx: number) => (
                                                                    <div
                                                                        key={pIdx}
                                                                        className="font-serif text-[15px] italic mb-2"
                                                                    >
                                                                        {renderEditable(
                                                                            `num_q_${idx}_${pIdx}`,
                                                                            part.en,
                                                                            (val) => {
                                                                                const newLqs = [
                                                                                    ...paperData.longQuestions,
                                                                                ];
                                                                                newLqs[idx + 2].parts[pIdx].en = val;
                                                                                setPaperData?.({
                                                                                    ...paperData,
                                                                                    longQuestions: newLqs,
                                                                                });
                                                                            },
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "diagram-practical") {
                                return (
                                    <div key="diagram-practical" className="section-container">
                                        <div
                                            className={cn(
                                                "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                selectedSectionIds.includes("diagram_section") &&
                                                "ring-2 ring-emerald-500",
                                            )}
                                            id="diagram_section"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSectionClick?.("diagram_section", e);
                                            }}
                                            style={getSectionStyle("diagram_section")}
                                        >
                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                <span>DIAGRAM / PRACTICAL BASED QUESTION</span>
                                                <span className="notranslate">(05)</span>
                                            </div>
                                            <div className="border-2 border-dashed border-zinc-200 rounded-2xl h-48 flex items-center justify-center bg-zinc-50/30">
                                                <div className="text-center space-y-2">
                                                    <LucideIcons.Image className="w-8 h-8 mx-auto text-zinc-300" />
                                                    <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">
                                                        [ Drawing / Diagram Space ]
                                                    </p>
                                                    {renderEditable(
                                                        "diagram_label",
                                                        "Draw and label the human heart diagram.",
                                                        (val) => updateLabel("diagram_label", val),
                                                        { className: "font-serif italic text-zinc-600" },
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (sectionKey === "long-theorems") {
                                return (
                                    <div key="long-theorems" className="section-container">
                                        <div
                                            className={cn(
                                                "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                selectedSectionIds.includes("theorems_section") &&
                                                "ring-2 ring-emerald-500",
                                            )}
                                            id="theorems_section"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSectionClick?.("theorems_section", e);
                                            }}
                                            style={getSectionStyle("theorems_section")}
                                        >
                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                <span>MATHEMATICAL THEOREMS (Compulsory)</span>
                                                <span className="notranslate">(08)</span>
                                            </div>
                                            <div className="p-6 bg-emerald-50/30 border-2 border-emerald-500/10 rounded-2xl">
                                                <div className="font-bold mb-4">
                                                    Prove the following theorem:
                                                </div>
                                                <div className="font-serif text-[16px] leading-relaxed">
                                                    {renderEditable(
                                                        "theorem_text",
                                                        "Any point on the right bisector of a line segment is equidistant from its endpoints.",
                                                        (val) => updateLabel("theorem_text", val),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (sectionKey === "lesson-summary") {
                                return (
                                    <div key="lesson-summary" className="section-container">
                                        {paperData.urduData?.khulasa && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("summary_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="summary_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("summary_section", e);
                                                }}
                                                style={getSectionStyle("summary_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    <span>
                                                        سوال نمبر 4: کسی ایک سبق کا خلاصہ مع مصنف کا نام
                                                        تحریر کریں۔
                                                    </span>
                                                    <span className="notranslate">(05)</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {paperData.urduData.khulasa.map(
                                                        (topic: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="p-4 border-2 border-emerald-500/20 rounded-xl bg-emerald-50/20 text-center font-bold font-urdu text-[18px]"
                                                            >
                                                                {renderEditable(
                                                                    `summary_topic_${idx}`,
                                                                    topic,
                                                                    (val) => {
                                                                        const newData = [
                                                                            ...paperData.urduData.khulasa,
                                                                        ];
                                                                        newData[idx] = val;
                                                                        setPaperData?.({
                                                                            ...paperData,
                                                                            urduData: {
                                                                                ...paperData.urduData,
                                                                                khulasa: newData,
                                                                            },
                                                                        });
                                                                    },
                                                                    { className: "font-urdu", dir: "rtl" },
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "letter-application") {
                                return (
                                    <div key="letter-application" className="section-container">
                                        {paperData.urduData?.khatDarkhwast && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("letter_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="letter_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("letter_section", e);
                                                }}
                                                style={getSectionStyle("letter_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    <span>
                                                        سوال نمبر 6:{" "}
                                                        {renderEditable(
                                                            "letter_type_label",
                                                            paperData.urduData.khatDarkhwast.type ||
                                                            "خط یا درخوست",
                                                            (val) => {
                                                                setPaperData?.({
                                                                    ...paperData,
                                                                    urduData: {
                                                                        ...paperData.urduData,
                                                                        khatDarkhwast: {
                                                                            ...paperData.urduData.khatDarkhwast,
                                                                            type: val,
                                                                        },
                                                                    },
                                                                });
                                                            },
                                                        )}{" "}
                                                        تحریر کریں۔
                                                    </span>
                                                    <span className="notranslate">(10)</span>
                                                </div>
                                                <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-[18px] font-urdu leading-relaxed">
                                                    {renderEditable(
                                                        "letter_prompt",
                                                        paperData.urduData.khatDarkhwast.prompt,
                                                        (val) => {
                                                            setPaperData?.({
                                                                ...paperData,
                                                                urduData: {
                                                                    ...paperData.urduData,
                                                                    khatDarkhwast: {
                                                                        ...paperData.urduData.khatDarkhwast,
                                                                        prompt: val,
                                                                    },
                                                                },
                                                            });
                                                        },
                                                        { className: "font-urdu", dir: "rtl" },
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "story-writing") {
                                return (
                                    <div key="story-writing" className="section-container">
                                        {paperData.urduData?.dialogueStory && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("story_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="story_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("story_section", e);
                                                }}
                                                style={getSectionStyle("story_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    <span>
                                                        سوال نمبر 7:{" "}
                                                        {renderEditable(
                                                            "story_type_label",
                                                            paperData.urduData.dialogueStory.type ||
                                                            "کہانی یا مکالمہ",
                                                            (val) => {
                                                                setPaperData?.({
                                                                    ...paperData,
                                                                    urduData: {
                                                                        ...paperData.urduData,
                                                                        dialogueStory: {
                                                                            ...paperData.urduData.dialogueStory,
                                                                            type: val,
                                                                        },
                                                                    },
                                                                });
                                                            },
                                                        )}{" "}
                                                        تحریر کریں۔
                                                    </span>
                                                    <span className="notranslate">(05)</span>
                                                </div>
                                                <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-[18px] font-urdu leading-relaxed italic">
                                                    {renderEditable(
                                                        "story_prompt",
                                                        paperData.urduData.dialogueStory.prompt,
                                                        (val) => {
                                                            setPaperData?.({
                                                                ...paperData,
                                                                urduData: {
                                                                    ...paperData.urduData,
                                                                    dialogueStory: {
                                                                        ...paperData.urduData.dialogueStory,
                                                                        prompt: val,
                                                                    },
                                                                },
                                                            });
                                                        },
                                                        { className: "font-urdu italic", dir: "rtl" },
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "translation-idiomatic") {
                                return (
                                    <div
                                        key="translation-idiomatic"
                                        className="section-container"
                                    >
                                        {paperData.englishData?.translationParagraph && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes(
                                                        "trans_paragraph_section",
                                                    ) && "ring-2 ring-emerald-500",
                                                )}
                                                id="trans_paragraph_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("trans_paragraph_section", e);
                                                }}
                                                style={getSectionStyle("trans_paragraph_section")}
                                            >
                                                <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                    {shouldShow("trans_paragraph_section", "en") && (
                                                        <span>
                                                            <span className="mr-1 notranslate">8.</span>Translate the
                                                            following paragraph into Urdu.
                                                        </span>
                                                    )}
                                                    <span className="notranslate">(08)</span>
                                                </div>
                                                {shouldShow("trans_paragraph_section", "en") && (
                                                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl font-serif text-[15px] leading-relaxed text-justify">
                                                        {renderEditable(
                                                            "trans_para_en",
                                                            paperData.englishData.translationParagraph,
                                                            (val) => {
                                                                setPaperData?.({
                                                                    ...paperData,
                                                                    englishData: {
                                                                        ...paperData.englishData,
                                                                        translationParagraph: val,
                                                                    },
                                                                });
                                                            },
                                                            { className: "font-serif text-justify" },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "thematic-long-questions") {
                                return (
                                    <div
                                        key="thematic-long-questions"
                                        className="section-container"
                                    >
                                        {paperData.longQuestions?.length > 0 && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("thematic_lq_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="thematic_lq_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("thematic_lq_section", e);
                                                }}
                                                style={getSectionStyle("thematic_lq_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    {shouldShow("thematic_lq_section", "ur") && (
                                                        <span className="notranslate">
                                                            سوال نمبر 6: مندرجہ ذیل میں سے کسی ایک سوال کا
                                                            مفصل جواب تحریر کریں۔
                                                        </span>
                                                    )}
                                                    <span className="notranslate">(10)</span>
                                                </div>
                                                <div className="space-y-6">
                                                    {paperData.longQuestions.map(
                                                        (lq: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="p-4 border border-zinc-100 rounded-xl bg-zinc-50/30 font-urdu text-[18px]"
                                                                dir="rtl"
                                                            >
                                                                <span className="font-bold ml-2 notranslate" dir="ltr">
                                                                    ({idx + 1})
                                                                </span>
                                                                {shouldShow("thematic_lq_section", "ur") &&
                                                                    renderEditable(
                                                                        `thematic_lq_${idx}`,
                                                                        lq.ur || lq.en,
                                                                        (val) => updateLq(idx, "ur", val),
                                                                        { className: "font-urdu" },
                                                                    )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "poetry-explanation") {
                                return (
                                    <div key="poetry-explanation" className="section-container">
                                        {paperData.urduData?.shyrNazm && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("poetry_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="poetry_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("poetry_section", e);
                                                }}
                                                style={getSectionStyle("poetry_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    <span>
                                                        سوال نمبر 2: مندرجہ ذیل اشعار کی تشریح مع حوالہ متن
                                                        تحریر کریں۔
                                                    </span>
                                                    <span className="notranslate">(10)</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
                                                    {paperData.urduData.shyrNazm.map(
                                                        (shyr: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="text-center italic font-urdu text-[20px] leading-relaxed border-b border-zinc-100 pb-4"
                                                            >
                                                                {renderEditable(
                                                                    `poetry_shyr_${idx}`,
                                                                    shyr.couplet,
                                                                    (val) => {
                                                                        const newData = [
                                                                            ...paperData.urduData.shyrNazm,
                                                                        ];
                                                                        newData[idx] = { ...shyr, couplet: val };
                                                                        setPaperData?.({
                                                                            ...paperData,
                                                                            urduData: {
                                                                                ...paperData.urduData,
                                                                                shyrNazm: newData,
                                                                            },
                                                                        });
                                                                    },
                                                                    { className: "font-urdu italic", dir: "rtl" },
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "ahadith-translation") {
                                return (
                                    <div key="ahadith-translation" className="section-container">
                                        {(paperData.quranData?.hadith ||
                                            paperData.religiousData?.hadith) && (
                                                <div
                                                    className={cn(
                                                        "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                        selectedSectionIds.includes("hadith_section") &&
                                                        "ring-2 ring-emerald-500",
                                                    )}
                                                    id="hadith_section"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSectionClick?.("hadith_section", e);
                                                    }}
                                                    style={getSectionStyle("hadith_section")}
                                                >
                                                    <div
                                                        className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                        dir="rtl"
                                                    >
                                                        <span>
                                                            سوال نمبر 5: درج ذیل حدیثِ مبارکہ کا ترجمہ و تشریح
                                                            تحریر کریں۔
                                                        </span>
                                                        <span className="notranslate">(05)</span>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {shouldShow("hadith_section", "ar") && (
                                                            <div
                                                                className="font-arabic text-[24px] leading-loose text-right text-emerald-900 bg-emerald-50/20 p-6 rounded-2xl border-l-4 border-emerald-500"
                                                                dir="rtl"
                                                            >
                                                                {renderEditable(
                                                                    "hadith_ar",
                                                                    paperData.religiousData?.hadith?.arabic ||
                                                                    "الحدیث النبوی...",
                                                                    (val) => {
                                                                        if (!setPaperData) return;
                                                                        setPaperData({
                                                                            ...paperData,
                                                                            religiousData: {
                                                                                ...paperData.religiousData,
                                                                                hadith: {
                                                                                    ...paperData.religiousData?.hadith,
                                                                                    arabic: val,
                                                                                },
                                                                            },
                                                                        });
                                                                    },
                                                                    { className: "font-arabic" },
                                                                )}
                                                            </div>
                                                        )}
                                                        {shouldShow("hadith_section", "ur") && (
                                                            <div
                                                                className="font-urdu text-[18px] text-right italic"
                                                                dir="rtl"
                                                            >
                                                                {renderEditable(
                                                                    "hadith_ur",
                                                                    paperData.religiousData?.hadith?.urdu ||
                                                                    "اردو ترجمہ یہاں تحریر کریں...",
                                                                    (val) => {
                                                                        if (!setPaperData) return;
                                                                        setPaperData({
                                                                            ...paperData,
                                                                            religiousData: {
                                                                                ...paperData.religiousData,
                                                                                hadith: {
                                                                                    ...paperData.religiousData?.hadith,
                                                                                    urdu: val,
                                                                                },
                                                                            },
                                                                        });
                                                                    },
                                                                    { className: "font-urdu italic" },
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                );
                            }

                            if (sectionKey === "surah-background") {
                                return (
                                    <div key="surah-background" className="section-container">
                                        {paperData.quranData?.surahIntro && (
                                            <div
                                                className={cn(
                                                    "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                    selectedSectionIds.includes("surah_intro_section") &&
                                                    "ring-2 ring-emerald-500",
                                                )}
                                                id="surah_intro_section"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSectionClick?.("surah_intro_section", e);
                                                }}
                                                style={getSectionStyle("surah_intro_section")}
                                            >
                                                <div
                                                    className="flex justify-between font-bold mb-4 text-[18px] font-urdu"
                                                    dir="rtl"
                                                >
                                                    <span>
                                                        سوال نمبر 2: سورہ کا تعارف، پس منظر اور مرکزی مضامین
                                                        تحریر کریں۔
                                                    </span>
                                                    <span className="notranslate">(10)</span>
                                                </div>
                                                <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-[18px] font-urdu leading-relaxed">
                                                    {renderEditable(
                                                        "surah_intro_content",
                                                        paperData.quranData.surahIntro,
                                                        (val) => {
                                                            if (!setPaperData) return;
                                                            setPaperData({
                                                                ...paperData,
                                                                quranData: {
                                                                    ...paperData.quranData,
                                                                    surahIntro: val,
                                                                },
                                                            });
                                                        },
                                                        { className: "font-urdu", dir: "rtl" },
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (sectionKey === "subjective-header") {
                                return (
                                    <div key="subjective-header" className="section-container">
                                        <div
                                            className="text-center my-8 border-y-2 border-black py-2"
                                            style={getSectionStyle("subjective_header_block")}
                                        >
                                            <h2 className="text-[24px] font-black uppercase tracking-[0.2em] mb-1">
                                                {shouldShow("subjective_header_block", "both") ? (
                                                    renderEditable(
                                                        "sub_header_title",
                                                        paperData.headerDetails?.subjectiveTitle ||
                                                        (isUrduPaper(paperData?.paperInfo?.subject)
                                                            ? "حصہ دوم (انشائیہ)"
                                                            : "PART-II (Subjective)"),
                                                        (val) => updateHeaderDetail("subjectiveTitle", val),
                                                        isUrduPaper(paperData?.paperInfo?.subject)
                                                            ? { className: "font-urdu" }
                                                            : {},
                                                    )
                                                ) : (
                                                    <>
                                                        {shouldShow("subjective_header_block", "en") &&
                                                            !isUrduPaper(paperData?.paperInfo?.subject) && (
                                                                <span className="notranslate">PART-II (Subjective)</span>
                                                            )}
                                                        {shouldShow("subjective_header_block", "ur") &&
                                                            isUrduPaper(paperData?.paperInfo?.subject) && (
                                                                <span className="font-urdu notranslate">
                                                                    حصہ دوم (انشائیہ)
                                                                </span>
                                                            )}
                                                    </>
                                                )}
                                            </h2>
                                            <div className="flex justify-center items-center gap-4 text-[14px] font-bold">
                                                <div className="h-px w-20 bg-black" />
                                                <div className="flex items-center gap-2">
                                                    {shouldShow("subjective_header_block", "en") && (
                                                        <span className="notranslate">
                                                            Time:{" "}
                                                            {paperData.headerDetails?.timeAllowed ||
                                                                "2:10 Hours"}
                                                        </span>
                                                    )}
                                                    {shouldShow("subjective_header_block", "ur") && (
                                                        <span className="font-urdu notranslate" dir="rtl">
                                                            وقت:{" "}
                                                            {paperData.headerDetails?.timeAllowed ||
                                                                "2:10 Hours"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="h-px w-4 bg-black" />
                                                <div className="flex items-center gap-2">
                                                    {shouldShow("subjective_header_block", "en") && (
                                                        <span className="notranslate">
                                                            Marks:{" "}
                                                            {paperData.headerDetails?.totalMarks || "60"}
                                                        </span>
                                                    )}
                                                    {shouldShow("subjective_header_block", "ur") && (
                                                        <span className="font-urdu notranslate" dir="rtl">
                                                            کل نمبر:{" "}
                                                            {paperData.headerDetails?.totalMarks || "60"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="h-px w-20 bg-black" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (sectionKey === "urdu-special-sections") {
                                return (
                                    <div
                                        key="urdu-special-sections"
                                        className="section-container"
                                    >
                                        {isUrduPaper(paperData.paperInfo.subject) &&
                                            paperData.urduData && (
                                                <div className="mb-8 space-y-12" dir="rtl">
                                                    {/* Q3: Siaq-o-Sabaq */}
                                                    {paperData.urduData.siaqoSabaq && (
                                                        <div
                                                            className={cn(
                                                                "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-4 border-2 border-emerald-500/10 rounded-2xl bg-emerald-50/5 transition-all mb-8",
                                                                selectedSectionIds.includes(
                                                                    "urd_siaq_section",
                                                                ) && "ring-2 ring-emerald-500",
                                                            )}
                                                            id="urd_siaq_section"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSectionClick?.("urd_siaq_section", e);
                                                            }}
                                                            style={getSectionStyle("urd_siaq_section")}
                                                        >
                                                            <div className="flex justify-between font-bold mb-6 text-[20px] font-urdu">
                                                                <span className="notranslate">
                                                                    سوال نمبر 3: کسی ایک جزو کی تشریح سیاق و سباق
                                                                    کے حوالے سے کریں۔
                                                                </span>
                                                                <span className="font-black notranslate">
                                                                    (10 + 5 = 15)
                                                                </span>
                                                            </div>
                                                            <div className="p-8 bg-white border-2 border-zinc-100 rounded-3xl shadow-sm relative overflow-hidden group/para">
                                                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                                                                <div className="text-[22px] font-urdu leading-[2.5] text-justify mb-8 px-4 border-r-4 border-emerald-500/20 pr-8">
                                                                    {renderEditable(
                                                                        "siaq_paragraph",
                                                                        paperData.urduData.siaqoSabaq.paragraph,
                                                                        (val) => {
                                                                            if (
                                                                                !paperData.urduData?.siaqoSabaq ||
                                                                                !setPaperData
                                                                            )
                                                                                return;
                                                                            setPaperData({
                                                                                ...paperData,
                                                                                urduData: {
                                                                                    ...paperData.urduData,
                                                                                    siaqoSabaq: {
                                                                                        ...paperData.urduData.siaqoSabaq,
                                                                                        paragraph: val,
                                                                                    },
                                                                                },
                                                                            });
                                                                        },
                                                                        { className: "font-urdu", dir: "rtl" },
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-8 border-t border-zinc-100 pt-6 px-4">
                                                                    <div className="flex items-center gap-4 bg-zinc-50/50 p-4 rounded-xl">
                                                                        <span className="font-urdu font-black text-emerald-600 text-[18px]">
                                                                            حوالہ متن:
                                                                        </span>
                                                                        <div className="font-urdu text-[18px] flex-1">
                                                                            <span className="text-zinc-400 ml-2">
                                                                                سبق:
                                                                            </span>
                                                                            {renderEditable(
                                                                                "siaq_lesson",
                                                                                paperData.urduData.siaqoSabaq.lesson,
                                                                                (val) => {
                                                                                    if (
                                                                                        !paperData.urduData?.siaqoSabaq ||
                                                                                        !setPaperData
                                                                                    )
                                                                                        return;
                                                                                    setPaperData({
                                                                                        ...paperData,
                                                                                        urduData: {
                                                                                            ...paperData.urduData,
                                                                                            siaqoSabaq: {
                                                                                                ...paperData.urduData
                                                                                                    .siaqoSabaq,
                                                                                                lesson: val,
                                                                                            },
                                                                                        },
                                                                                    });
                                                                                },
                                                                                {
                                                                                    className: "font-urdu inline",
                                                                                    dir: "rtl",
                                                                                },
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 bg-zinc-50/50 p-4 rounded-xl">
                                                                        <span className="font-urdu font-black text-emerald-600 text-[18px]">
                                                                            مصنف کا نام:
                                                                        </span>
                                                                        <div className="font-urdu text-[18px] flex-1">
                                                                            {renderEditable(
                                                                                "siaq_author",
                                                                                paperData.urduData.siaqoSabaq.author,
                                                                                (val) => {
                                                                                    if (
                                                                                        !paperData.urduData?.siaqoSabaq ||
                                                                                        !setPaperData
                                                                                    )
                                                                                        return;
                                                                                    setPaperData({
                                                                                        ...paperData,
                                                                                        urduData: {
                                                                                            ...paperData.urduData,
                                                                                            siaqoSabaq: {
                                                                                                ...paperData.urduData
                                                                                                    .siaqoSabaq,
                                                                                                author: val,
                                                                                            },
                                                                                        },
                                                                                    });
                                                                                },
                                                                                {
                                                                                    className: "font-urdu inline",
                                                                                    dir: "rtl",
                                                                                },
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Q8: Sentence Correction */}
                                                    {paperData.urduData.sentenceCorrection && (
                                                        <div className="page-break-inside-avoid">
                                                            <div className="flex justify-between font-bold mb-4 text-[18px] font-urdu">
                                                                <span className="notranslate">
                                                                    سوال نمبر 8: جملوں کی درستگی کریں۔ (کوئی سے
                                                                    پانچ)
                                                                </span>
                                                                <span className="notranslate">(05)</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-3 px-4">
                                                                {paperData.urduData.sentenceCorrection.map(
                                                                    (sentence: any, idx: number) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex items-center text-[18px] font-urdu border-b border-dotted border-zinc-200 pb-2"
                                                                        >
                                                                            <span className="font-bold ml-4 notranslate">
                                                                                ({idx + 1})
                                                                            </span>
                                                                            {renderEditable(
                                                                                `urdu_corr_${idx}`,
                                                                                sentence,
                                                                                (val) => {
                                                                                    if (
                                                                                        !paperData.urduData
                                                                                            ?.sentenceCorrection ||
                                                                                        !setPaperData
                                                                                    )
                                                                                        return;
                                                                                    const newData = [
                                                                                        ...paperData.urduData
                                                                                            .sentenceCorrection,
                                                                                    ];
                                                                                    newData[idx] = val;
                                                                                    setPaperData({
                                                                                        ...paperData,
                                                                                        urduData: {
                                                                                            ...paperData.urduData,
                                                                                            sentenceCorrection: newData,
                                                                                        },
                                                                                    });
                                                                                },
                                                                                { className: "font-urdu", dir: "rtl" },
                                                                            )}
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Q9: Essay (Mazmoon) */}
                                                    {paperData.urduData.mazmoon && (
                                                        <div
                                                            className={cn(
                                                                "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors",
                                                                selectedSectionIds.includes(
                                                                    "urdu_mazmoon_section",
                                                                ) && "ring-2 ring-emerald-500",
                                                            )}
                                                            id="urdu_mazmoon_section"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSectionClick?.("urdu_mazmoon_section", e);
                                                            }}
                                                            style={getSectionStyle("urdu_mazmoon_section")}
                                                        >
                                                            <div className="flex justify-between font-bold mb-4 text-[18px] font-urdu">
                                                                <span className="notranslate">
                                                                    سوال نمبر 9: مندرجہ ذیل میں سے کسی ایک عنوان
                                                                    پر جامع مضمون لکھیں۔
                                                                </span>
                                                                <span className="notranslate">(20)</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                {paperData.urduData.mazmoon.map(
                                                                    (topic: any, idx: number) => {
                                                                        const mId = `urdu_mazmoon_${idx}`;
                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                id={mId}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onSectionClick?.(mId, e);
                                                                                }}
                                                                                className={cn(
                                                                                    "p-6 border-2 border-emerald-500/20 rounded-2xl bg-emerald-50/30 text-center font-bold text-[18px] font-urdu hover:bg-emerald-50 transition-colors cursor-pointer",
                                                                                    selectedSectionIds.includes(mId) &&
                                                                                    "ring-2 ring-emerald-500 bg-emerald-100",
                                                                                )}
                                                                                style={getSectionStyle(mId)}
                                                                            >
                                                                                {renderEditable(
                                                                                    mId,
                                                                                    topic,
                                                                                    (val) => {
                                                                                        if (
                                                                                            !paperData.urduData?.mazmoon ||
                                                                                            !setPaperData
                                                                                        )
                                                                                            return;
                                                                                        const newMazmoons = [
                                                                                            ...paperData.urduData.mazmoon,
                                                                                        ];
                                                                                        newMazmoons[idx] = val;
                                                                                        setPaperData({
                                                                                            ...paperData,
                                                                                            urduData: {
                                                                                                ...paperData.urduData,
                                                                                                mazmoon: newMazmoons,
                                                                                            },
                                                                                        });
                                                                                    },
                                                                                    {
                                                                                        className: "font-urdu",
                                                                                        dir: "rtl",
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                );
                            }

                            if (sectionKey === "english-special-sections") {
                                return (
                                    <div
                                        key="english-special-sections"
                                        className="section-container"
                                    >
                                        {paperData.paperInfo.subject === "English" && (
                                            <div className="mb-8 space-y-8">
                                                {/* Q2: Paraphrasing */}
                                                {paperData.englishData &&
                                                    paperData.englishData.paraphrasing &&
                                                    paperData.englishData.paraphrasing.length > 0 && (
                                                        <div className="page-break-inside-avoid">
                                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                                <span>
                                                                    <span className="mr-1 notranslate">2.</span>
                                                                    {renderEditable(
                                                                        "lbl_eng_para",
                                                                        "Paraphrase one of the following stanzas.",
                                                                        (val) => updateLabel("lbl_eng_para", val),
                                                                    )}
                                                                </span>
                                                                <span className="notranslate">(5)</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                                                                {paperData.englishData.paraphrasing.map(
                                                                    (stanza: any, idx: number) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="italic text-center"
                                                                        >
                                                                            <span className="font-bold not-italic block mb-2 text-left notranslate">
                                                                                {idx === 0 ? "(i)" : "(ii)"}
                                                                            </span>
                                                                            <div className="whitespace-pre-line leading-relaxed font-serif text-[15px]">
                                                                                {renderEditable(
                                                                                    `para_stanza_${idx}`,
                                                                                    stanza.stanza,
                                                                                    (val) => {
                                                                                        if (
                                                                                            !paperData.englishData
                                                                                                ?.paraphrasing ||
                                                                                            !setPaperData
                                                                                        )
                                                                                            return;
                                                                                        const newData = [
                                                                                            ...paperData.englishData
                                                                                                .paraphrasing,
                                                                                        ];
                                                                                        newData[idx] = {
                                                                                            ...stanza,
                                                                                            stanza: val,
                                                                                        };
                                                                                        setPaperData({
                                                                                            ...paperData,
                                                                                            englishData: {
                                                                                                ...paperData.englishData,
                                                                                                paraphrasing: newData,
                                                                                            },
                                                                                        });
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Q3: Reference to Context (Alternate to Q2) */}
                                                {paperData.englishData &&
                                                    paperData.englishData.referenceToContext &&
                                                    paperData.englishData.referenceToContext.stanza && (
                                                        <div className="page-break-inside-avoid border-t border-zinc-100 pt-8">
                                                            <div className="flex justify-between font-bold mb-4 text-[14px]">
                                                                <span>
                                                                    {renderEditable(
                                                                        "lbl_eng_ref",
                                                                        "OR Explain the following stanza with reference to the context.",
                                                                        (val) => updateLabel("lbl_eng_ref", val),
                                                                    )}
                                                                </span>
                                                                <span className="notranslate">(5)</span>
                                                            </div>
                                                            <div className="italic text-center px-12">
                                                                <div className="whitespace-pre-line leading-relaxed font-serif text-[15px] border-l-4 border-zinc-200 pl-6">
                                                                    {renderEditable(
                                                                        "ref_context_stanza",
                                                                        paperData.englishData.referenceToContext
                                                                            .stanza,
                                                                        (val) => {
                                                                            if (
                                                                                !paperData.englishData
                                                                                    ?.referenceToContext ||
                                                                                !setPaperData
                                                                            )
                                                                                return;
                                                                            setPaperData({
                                                                                ...paperData,
                                                                                englishData: {
                                                                                    ...paperData.englishData,
                                                                                    referenceToContext: {
                                                                                        ...paperData.englishData
                                                                                            .referenceToContext,
                                                                                        stanza: val,
                                                                                    },
                                                                                },
                                                                            });
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Q4: Passage Comprehension */}
                                                {paperData.englishData &&
                                                    paperData.englishData.passageComprehension && (
                                                        <div className="page-break-inside-avoid">
                                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                                <span>
                                                                    <span className="mr-1 notranslate">4.</span>
                                                                    {renderEditable(
                                                                        "lbl_eng_passage",
                                                                        "Read the following passage and answer the questions at the end.",
                                                                        (val) =>
                                                                            updateLabel("lbl_eng_passage", val),
                                                                    )}
                                                                </span>
                                                                <span className="notranslate">(10)</span>
                                                            </div>
                                                            <div className="px-6 py-4 border border-zinc-200 rounded-lg bg-zinc-50/50 text-[13px] leading-relaxed font-serif whitespace-pre-line text-justify mb-4">
                                                                {renderEditable(
                                                                    "passage_text",
                                                                    paperData.englishData.passageComprehension
                                                                        .passage,
                                                                    (val) => {
                                                                        if (
                                                                            !paperData.englishData
                                                                                ?.passageComprehension ||
                                                                            !setPaperData
                                                                        )
                                                                            return;
                                                                        setPaperData({
                                                                            ...paperData,
                                                                            englishData: {
                                                                                ...paperData.englishData,
                                                                                passageComprehension: {
                                                                                    ...paperData.englishData
                                                                                        .passageComprehension,
                                                                                    passage: val,
                                                                                },
                                                                            },
                                                                        });
                                                                    },
                                                                    { className: "font-serif text-justify" },
                                                                )}
                                                            </div>
                                                            <div className="space-y-3 pl-4 mb-4">
                                                                {paperData.englishData.passageComprehension.questions.map(
                                                                    (q: any, idx: number) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex justify-between text-[14px]"
                                                                        >
                                                                            <span className="flex-1">
                                                                                <span className="font-bold mr-2 notranslate" dir="ltr">
                                                                                    ({idx + 1})
                                                                                </span>
                                                                                {renderEditable(
                                                                                    `passage_q_${idx}`,
                                                                                    q.question,
                                                                                    (val) => {
                                                                                        if (
                                                                                            !paperData.englishData
                                                                                                ?.passageComprehension ||
                                                                                            !setPaperData
                                                                                        )
                                                                                            return;
                                                                                        const newQs = [
                                                                                            ...paperData.englishData
                                                                                                .passageComprehension.questions,
                                                                                        ];
                                                                                        newQs[idx] = {
                                                                                            ...q,
                                                                                            question: val,
                                                                                        };
                                                                                        setPaperData({
                                                                                            ...paperData,
                                                                                            englishData: {
                                                                                                ...paperData.englishData,
                                                                                                passageComprehension: {
                                                                                                    ...paperData.englishData
                                                                                                        .passageComprehension,
                                                                                                    questions: newQs,
                                                                                                },
                                                                                            },
                                                                                        });
                                                                                    },
                                                                                )}
                                                                            </span>
                                                                            <span className="font-bold notranslate">
                                                                                ({q.marks})
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Q5: Summary */}
                                                {paperData.englishData &&
                                                    paperData.englishData.summary && (
                                                        <div className="page-break-inside-avoid">
                                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                                <span>
                                                                    <span className="mr-1 notranslate">5.</span>
                                                                    {renderEditable(
                                                                        "lbl_eng_summary",
                                                                        paperData.englishData.summary.userSummary
                                                                            ? "Read the summary and answer the questions."
                                                                            : "Write down the summary of the poem.",
                                                                        (val) =>
                                                                            updateLabel("lbl_eng_summary", val),
                                                                    )}
                                                                </span>
                                                                <span className="notranslate">(5)</span>
                                                            </div>

                                                            {paperData.englishData.summary.userSummary ? (
                                                                <div className="px-6 py-4 border border-zinc-200 rounded-lg bg-zinc-50/50 text-[13px] leading-relaxed font-serif whitespace-pre-line text-justify">
                                                                    {renderEditable(
                                                                        "summary_text",
                                                                        paperData.englishData.summary.userSummary,
                                                                        (val) => {
                                                                            if (
                                                                                !paperData.englishData?.summary ||
                                                                                !setPaperData
                                                                            )
                                                                                return;
                                                                            setPaperData({
                                                                                ...paperData,
                                                                                englishData: {
                                                                                    ...paperData.englishData,
                                                                                    summary: {
                                                                                        ...paperData.englishData.summary,
                                                                                        userSummary: val,
                                                                                    },
                                                                                },
                                                                            });
                                                                        },
                                                                        { className: "font-serif" },
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="px-8 py-6 border-2 border-dashed border-zinc-200 rounded-xl text-center bg-zinc-50/30">
                                                                    <span className="text-[14px] font-black uppercase tracking-[0.2em] italic text-zinc-400">
                                                                        Poem Title:{" "}
                                                                    </span>
                                                                    <span className="text-[18px] font-black text-emerald-600 ml-2">
                                                                        {renderEditable(
                                                                            "summary_title",
                                                                            paperData.englishData.summary.poem,
                                                                            (val) =>
                                                                                setPaperData &&
                                                                                setPaperData({
                                                                                    ...paperData,
                                                                                    englishData: {
                                                                                        ...paperData.englishData!,
                                                                                        summary: {
                                                                                            ...paperData.englishData!
                                                                                                .summary!,
                                                                                            poem: val,
                                                                                        },
                                                                                    },
                                                                                }),
                                                                        )}
                                                                    </span>
                                                                    <div className="mt-4 text-[9px] text-zinc-400 uppercase font-black tracking-widest leading-tight">
                                                                        Student is required to write the summary of
                                                                        the poem <br /> on the provided answer
                                                                        sheet.
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                <div
                                                    className={cn(
                                                        "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                        selectedSectionIds.includes("eng_idioms_section") &&
                                                        "ring-2 ring-emerald-500",
                                                    )}
                                                    id="eng_idioms_section"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSectionClick?.("eng_idioms_section", e);
                                                    }}
                                                    style={getSectionStyle("eng_idioms_section")}
                                                >
                                                    <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                        <span>
                                                            <span className="mr-1 notranslate">6.</span>
                                                            {renderEditable(
                                                                "lbl_eng_idioms",
                                                                "Use the following words / phrases / idioms in your sentences.",
                                                                (val) => updateLabel("lbl_eng_idioms", val),
                                                            )}
                                                        </span>
                                                        <span className="notranslate">
                                                            ({paperData.englishData.idioms.length} x 1 ={" "}
                                                            {paperData.englishData.idioms.length})
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-8 gap-y-2 px-4 italic font-bold text-[14px]">
                                                        {paperData.englishData.idioms.map(
                                                            (item: any, idx: number) => {
                                                                const id = `idiom_${idx}`;
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={cn(
                                                                            "flex gap-2 cursor-pointer hover:bg-emerald-50/30 rounded px-1",
                                                                            selectedSectionIds.includes(id) &&
                                                                            "ring-1 ring-emerald-400 bg-emerald-500/5",
                                                                        )}
                                                                        id={id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onSectionClick?.(id, e);
                                                                        }}
                                                                        style={getSectionStyle(id)}
                                                                    >
                                                                        <span className="notranslate">
                                                                            {
                                                                                [
                                                                                    "(i)",
                                                                                    "(ii)",
                                                                                    "(iii)",
                                                                                    "(iv)",
                                                                                    "(v)",
                                                                                    "(vi)",
                                                                                    "(vii)",
                                                                                    "(viii)",
                                                                                ][idx]
                                                                            }
                                                                        </span>
                                                                        {renderEditable(
                                                                            id,
                                                                            item.word,
                                                                            (val) => {
                                                                                if (
                                                                                    !paperData.englishData?.idioms ||
                                                                                    !setPaperData
                                                                                )
                                                                                    return;
                                                                                const newData = [
                                                                                    ...paperData.englishData.idioms,
                                                                                ];
                                                                                newData[idx] = { ...item, word: val };
                                                                                setPaperData({
                                                                                    ...paperData,
                                                                                    englishData: {
                                                                                        ...paperData.englishData,
                                                                                        idioms: newData,
                                                                                    },
                                                                                });
                                                                            },
                                                                            { className: "italic" },
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Q7: Letter/Story/Dialogue */}
                                                {paperData.englishData &&
                                                    paperData.englishData.letterStoryDialogue && (
                                                        <div className="page-break-inside-avoid">
                                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                                <span>
                                                                    <span className="mr-1 notranslate">7.</span>
                                                                    {renderEditable(
                                                                        "lbl_eng_letter_pre",
                                                                        "Write a",
                                                                        (val) =>
                                                                            updateLabel("lbl_eng_letter_pre", val),
                                                                    )}{" "}
                                                                    {
                                                                        paperData.englishData.letterStoryDialogue
                                                                            .type
                                                                    }{" "}
                                                                    {renderEditable(
                                                                        "lbl_eng_letter_post",
                                                                        "on the following.",
                                                                        (val) =>
                                                                            updateLabel("lbl_eng_letter_post", val),
                                                                    )}
                                                                </span>
                                                                <span className="notranslate">(8)</span>
                                                            </div>
                                                            <div className="px-4 font-bold text-[14px] italic text-emerald-700">
                                                                {renderEditable(
                                                                    "letter_topic",
                                                                    paperData.englishData.letterStoryDialogue
                                                                        .topic,
                                                                    (val) => {
                                                                        if (
                                                                            !paperData.englishData
                                                                                ?.letterStoryDialogue ||
                                                                            !setPaperData
                                                                        )
                                                                            return;
                                                                        setPaperData({
                                                                            ...paperData,
                                                                            englishData: {
                                                                                ...paperData.englishData,
                                                                                letterStoryDialogue: {
                                                                                    ...paperData.englishData
                                                                                        .letterStoryDialogue,
                                                                                    topic: val,
                                                                                },
                                                                            },
                                                                        });
                                                                    },
                                                                    { className: "italic" },
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Q8: Translation */}
                                                {paperData.englishData &&
                                                    paperData.englishData.translation &&
                                                    paperData.englishData.translation.length > 0 && (
                                                        <div
                                                            className={cn(
                                                                "page-break-inside-avoid cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors mb-8",
                                                                selectedSectionIds.includes(
                                                                    "eng_trans_section",
                                                                ) && "ring-2 ring-emerald-500",
                                                            )}
                                                            id="eng_trans_section"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSectionClick?.("eng_trans_section", e);
                                                            }}
                                                            style={getSectionStyle("eng_trans_section")}
                                                        >
                                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                                <span>
                                                                    <span className="mr-1 notranslate">8.</span>
                                                                    {renderEditable(
                                                                        "lbl_eng_trans",
                                                                        "Translate the following sentences into English.",
                                                                        (val) => updateLabel("lbl_eng_trans", val),
                                                                    )}
                                                                </span>
                                                                <span className="notranslate">(4)</span>
                                                            </div>
                                                            <div className="space-y-4 px-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {paperData.englishData.translation.map(
                                                                        (item: any, idx: number) => {
                                                                            const id = `trans_ur_${idx}`;
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    id={id}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        onSectionClick?.(id, e);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "flex justify-between items-center text-[14px] font-nastaleeq border-b border-zinc-50 pb-2 cursor-pointer hover:bg-emerald-50/30 px-1 rounded transition-all",
                                                                                        selectedSectionIds.includes(id) &&
                                                                                        "ring-1 ring-emerald-400 bg-emerald-500/5",
                                                                                    )}
                                                                                    dir="rtl"
                                                                                    style={getSectionStyle(id)}
                                                                                >
                                                                                    <span className="font-bold ml-2 notranslate">
                                                                                        (
                                                                                        {["i", "ii", "iii", "iv", "v"][idx]}
                                                                                        )
                                                                                    </span>
                                                                                    {renderEditable(
                                                                                        id,
                                                                                        item.ur,
                                                                                        (val) => {
                                                                                            if (
                                                                                                !paperData.englishData
                                                                                                    ?.translation ||
                                                                                                !setPaperData
                                                                                            )
                                                                                                return;
                                                                                            const newData = [
                                                                                                ...paperData.englishData
                                                                                                    .translation,
                                                                                            ];
                                                                                            newData[idx] = {
                                                                                                ...item,
                                                                                                ur: val,
                                                                                            };
                                                                                            setPaperData({
                                                                                                ...paperData,
                                                                                                englishData: {
                                                                                                    ...paperData.englishData,
                                                                                                    translation: newData,
                                                                                                },
                                                                                            });
                                                                                        },
                                                                                        {
                                                                                            className: "font-nastaleeq",
                                                                                            dir: "rtl",
                                                                                        },
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Q9: Change of Voice */}
                                                {paperData.englishData &&
                                                    paperData.englishData.voice &&
                                                    paperData.englishData.voice.length > 0 && (
                                                        <div className="page-break-inside-avoid">
                                                            <div className="flex justify-between font-bold border-b border-black mb-4 text-[14px]">
                                                                <span>
                                                                    <span className="mr-1 notranslate">9.</span>
                                                                    {renderEditable(
                                                                        "lbl_eng_voice",
                                                                        "Change the voice of the following.",
                                                                        (val) => updateLabel("lbl_eng_voice", val),
                                                                    )}
                                                                </span>
                                                                <span dir="ltr" className="notranslate">
                                                                    ({paperData.englishData.voice.length})
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2 px-4 italic">
                                                                {paperData.englishData.voice.map(
                                                                    (item: any, idx: number) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex gap-2 text-[14px]"
                                                                        >
                                                                            <span className="font-bold notranslate" dir="ltr">
                                                                                ({["i", "ii", "iii", "iv", "v"][idx]})
                                                                            </span>
                                                                            {renderEditable(
                                                                                `voice_act_${idx}`,
                                                                                item.active,
                                                                                (val) => {
                                                                                    if (
                                                                                        !paperData.englishData?.voice ||
                                                                                        !setPaperData
                                                                                    )
                                                                                        return;
                                                                                    const newData = [
                                                                                        ...paperData.englishData.voice,
                                                                                    ];
                                                                                    newData[idx] = {
                                                                                        ...item,
                                                                                        active: val,
                                                                                    };
                                                                                    setPaperData({
                                                                                        ...paperData,
                                                                                        englishData: {
                                                                                            ...paperData.englishData,
                                                                                            voice: newData,
                                                                                        },
                                                                                    });
                                                                                },
                                                                                { className: "italic" },
                                                                            )}
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            if (
                                sectionKey === "long-questions" ||
                                sectionKey === "long-questions-numerical" ||
                                sectionKey === "long-theorems" ||
                                sectionKey === "long-calculations"
                            ) {
                                if (isUrduPaper(paperData.paperInfo.subject)) return null;
                                return (
                                    <div key={sectionKey} className="section-container">
                                        {paperData.longQuestions &&
                                            paperData.longQuestions.length > 0 && (
                                                <div
                                                    className={cn(
                                                        "mt-8 page-break-inside-avoid border-t-2 border-black pt-4 cursor-pointer hover:bg-zinc-50/30 p-2 rounded transition-colors",
                                                        selectedSectionIds.includes("long_qs_section") &&
                                                        "ring-2 ring-emerald-500",
                                                    )}
                                                    id="long_qs_section"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSectionClick?.("long_qs_section", e);
                                                    }}
                                                    style={getSectionStyle("long_qs_section")}
                                                >
                                                    <div className="text-center mb-6">
                                                        <h3 className="text-[18px] font-black uppercase tracking-widest inline-block px-8 pb-1">
                                                            {renderEditable(
                                                                "lq_main_header",
                                                                getLabel(
                                                                    "lq_main_header",
                                                                    isUrduPaper(paperData.paperInfo.subject)
                                                                        ? "حصہ دوم (انشائیہ)"
                                                                        : "SECTION II (Subjective)",
                                                                ),
                                                                (val) => updateLabel("lq_main_header", val),
                                                                isUrduPaper(paperData.paperInfo.subject)
                                                                    ? { className: "font-urdu" }
                                                                    : {},
                                                            )}
                                                        </h3>
                                                        <p className="text-[12px] font-bold mt-2 italic">
                                                            {renderEditable(
                                                                "lq_note",
                                                                getLabel(
                                                                    "lq_note",
                                                                    isUrduPaper(paperData.paperInfo.subject)
                                                                        ? "نوٹ: مندرجہ ذیل سوالات کے جوابات تحریر کریں۔"
                                                                        : "Note: Attempt the following questions.",
                                                                ),
                                                                (val) => updateLabel("lq_note", val),
                                                                isUrduPaper(paperData.paperInfo.subject)
                                                                    ? {
                                                                        className: "font-urdu italic",
                                                                        dir: "rtl",
                                                                    }
                                                                    : {},
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-8">
                                                        {paperData.longQuestions.map(
                                                            (lq: any, idx: number) => {
                                                                const lqId = `lq_item_${idx}`;
                                                                const isScience =
                                                                    !isUrduPaper(paperData.paperInfo.subject) &&
                                                                    !["pakistan studies", "english"].includes(
                                                                        paperData.paperInfo.subject.toLowerCase(),
                                                                    );
                                                                const isUrdu = isUrduPaper(
                                                                    paperData.paperInfo.subject,
                                                                );

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={cn(
                                                                            "group/lq hover:bg-emerald-50/20 rounded p-2 transition-all",
                                                                            selectedSectionIds.includes(lqId) &&
                                                                            "ring-1 ring-emerald-500",
                                                                        )}
                                                                        id={lqId}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onSectionClick?.(lqId, e);
                                                                        }}
                                                                        style={getSectionStyle(lqId)}
                                                                    >
                                                                        {/* Question Header */}
                                                                        <div
                                                                            className={cn(
                                                                                "flex justify-between font-bold text-[16px] mb-2",
                                                                                isUrdu && "flex-row-reverse",
                                                                            )}
                                                                        >
                                                                            <div
                                                                                className={cn(
                                                                                    "flex gap-2 w-full",
                                                                                    isUrdu
                                                                                        ? "flex-row-reverse"
                                                                                        : "flex-col",
                                                                                )}
                                                                            >
                                                                                <div
                                                                                    className={cn(
                                                                                        "flex gap-2",
                                                                                        isUrdu && "flex-row-reverse",
                                                                                    )}
                                                                                >
                                                                                    <span
                                                                                        className={
                                                                                            `notranslate ${isUrdu ? "font-urdu mt-1" : ""}`
                                                                                        }
                                                                                    >
                                                                                        {isUrdu
                                                                                            ? `سوال نمبر ${idx + 5}`
                                                                                            : `Q.${idx + (paperData.paperInfo.subject === "Biology" || paperData.paperInfo.subject === "Chemistry" || paperData.paperInfo.subject === "Physics" ? 5 : 5)}`}
                                                                                    </span>
                                                                                    {shouldShow(lqId, "en") &&
                                                                                        !isUrdu && (
                                                                                            <div className="font-serif flex-1">
                                                                                                {renderEditable(
                                                                                                    `${lqId}-en`,
                                                                                                    lq.en,
                                                                                                    (val) =>
                                                                                                        updateLq(idx, "en", val),
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                </div>
                                                                                {shouldShow(lqId, "ur") &&
                                                                                    !isUrdu &&
                                                                                    lq.ur && (
                                                                                        <div
                                                                                            className="font-urdu text-right w-full pr-8"
                                                                                            dir="rtl"
                                                                                        >
                                                                                            {renderEditable(
                                                                                                `${lqId}-ur`,
                                                                                                lq.ur,
                                                                                                (val) =>
                                                                                                    updateLq(idx, "ur", val),
                                                                                                {
                                                                                                    className: "font-urdu",
                                                                                                    dir: "rtl",
                                                                                                },
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                {shouldShow(lqId, "ur") && isUrdu && (
                                                                                    <div
                                                                                        className="font-urdu text-right flex-1"
                                                                                        dir="rtl"
                                                                                    >
                                                                                        {renderEditable(
                                                                                            `${lqId}-ur`,
                                                                                            lq.ur || lq.en,
                                                                                            (val) => updateLq(idx, "ur", val),
                                                                                            {
                                                                                                className: "font-urdu",
                                                                                                dir: "rtl",
                                                                                            },
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <span className="min-w-[50px] text-right notranslate" dir="ltr">
                                                                                ({lq.marks || (isScience ? "4+4" : "8")}
                                                                                )
                                                                            </span>
                                                                        </div>

                                                                        {/* Parts (a) and (b) for Science/Generic */}
                                                                        {lq.parts && lq.parts.length > 0 && (
                                                                            <div className="space-y-4 ml-6">
                                                                                {lq.parts.map(
                                                                                    (part: any, pIdx: number) => {
                                                                                        const partId = `${lqId}-p-${pIdx}`;
                                                                                        const isTheory = pIdx === 0; // Assumption for Science: (a) is Theory, (b) is Numerical usually
                                                                                        return (
                                                                                            <div
                                                                                                key={pIdx}
                                                                                                className="flex justify-between"
                                                                                                id={partId}
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    onSectionClick?.(partId, e);
                                                                                                }}
                                                                                            >
                                                                                                <div className="flex gap-2 text-[14px]">
                                                                                                    <span className="font-bold notranslate">
                                                                                                        ({["a", "b", "c"][pIdx]})
                                                                                                    </span>

                                                                                                    {isScience && (
                                                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-0.5 select-none notranslate">
                                                                                                            {isTheory
                                                                                                                ? "[THEORY]"
                                                                                                                : "[NUMERICAL]"}
                                                                                                        </span>
                                                                                                    )}

                                                                                                    <div className="flex-1">
                                                                                                        {paperData.layout
                                                                                                            ?.bilingualMode ===
                                                                                                            "sideBySide" ? (
                                                                                                            <div className="grid grid-cols-2 gap-8 w-full">
                                                                                                                <div className="font-serif text-justify">
                                                                                                                    {renderEditable(
                                                                                                                        `${partId}-en`,
                                                                                                                        part.en,
                                                                                                                        (val) => {
                                                                                                                            // Deep update logic needed here, simplifying for now
                                                                                                                            const newLqs = [
                                                                                                                                ...paperData.longQuestions,
                                                                                                                            ];
                                                                                                                            newLqs[idx].parts[
                                                                                                                                pIdx
                                                                                                                            ].en = val;
                                                                                                                            setPaperData?.({
                                                                                                                                ...paperData,
                                                                                                                                longQuestions:
                                                                                                                                    newLqs,
                                                                                                                            });
                                                                                                                        },
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <div
                                                                                                                    className="font-urdu text-right"
                                                                                                                    dir="rtl"
                                                                                                                >
                                                                                                                    {renderEditable(
                                                                                                                        `${partId}-ur`,
                                                                                                                        part.ur,
                                                                                                                        (val) => {
                                                                                                                            const newLqs = [
                                                                                                                                ...paperData.longQuestions,
                                                                                                                            ];
                                                                                                                            newLqs[idx].parts[
                                                                                                                                pIdx
                                                                                                                            ].ur = val;
                                                                                                                            setPaperData?.({
                                                                                                                                ...paperData,
                                                                                                                                longQuestions:
                                                                                                                                    newLqs,
                                                                                                                            });
                                                                                                                        },
                                                                                                                        {
                                                                                                                            className:
                                                                                                                                "font-urdu",
                                                                                                                            dir: "rtl",
                                                                                                                        },
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="space-y-1">
                                                                                                                <div className="font-serif">
                                                                                                                    {renderEditable(
                                                                                                                        `${partId}-en`,
                                                                                                                        part.en,
                                                                                                                        (val) => {
                                                                                                                            const newLqs = [
                                                                                                                                ...paperData.longQuestions,
                                                                                                                            ];
                                                                                                                            newLqs[idx].parts[
                                                                                                                                pIdx
                                                                                                                            ].en = val;
                                                                                                                            setPaperData?.({
                                                                                                                                ...paperData,
                                                                                                                                longQuestions:
                                                                                                                                    newLqs,
                                                                                                                            });
                                                                                                                        },
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <div
                                                                                                                    className="font-urdu text-right"
                                                                                                                    dir="rtl"
                                                                                                                >
                                                                                                                    {renderEditable(
                                                                                                                        `${partId}-ur`,
                                                                                                                        part.ur,
                                                                                                                        (val) => {
                                                                                                                            const newLqs = [
                                                                                                                                ...paperData.longQuestions,
                                                                                                                            ];
                                                                                                                            newLqs[idx].parts[
                                                                                                                                pIdx
                                                                                                                            ].ur = val;
                                                                                                                            setPaperData?.({
                                                                                                                                ...paperData,
                                                                                                                                longQuestions:
                                                                                                                                    newLqs,
                                                                                                                            });
                                                                                                                        },
                                                                                                                        {
                                                                                                                            className:
                                                                                                                                "font-urdu",
                                                                                                                            dir: "rtl",
                                                                                                                        },
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="font-bold text-[14px]">
                                                                                                    ({part.marks || 4})
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                );
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
            </div >

            {/* Floating Creative Elements Layer */}
            < div className="absolute inset-0 pointer-events-none overflow-hidden print:overflow-visible" >
                <div className="relative w-full h-full">
                    <AnimatePresence>
                        {paperData.floatingElements?.map((el: any, idx: number) => (
                            <React.Fragment key={idx}>
                                {renderCreativeElement?.(el, idx)}
                            </React.Fragment>
                        ))}
                    </AnimatePresence>
                </div>
            </div >
        </div >
    );
}
