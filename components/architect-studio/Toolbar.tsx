"use client"

import React from 'react'
import {
    Move, Lasso, Crop, Palette,
    Stamp, Eraser, Type, Hand, PenTool,
    Wand2, Square, LayoutTemplate
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const TOOLS = [
    { id: 'move', icon: Move, label: 'Move Tool', shortcut: 'V' },
    { id: 'marquee', icon: Square, label: 'Marquee Tool', shortcut: 'M' },
    { id: 'lasso', icon: Lasso, label: 'Lasso Tool', shortcut: 'L' },
    { id: 'magic', icon: Wand2, label: 'Magic Wand', shortcut: 'W' },
    { id: 'crop', icon: Crop, label: 'Crop Tool', shortcut: 'C' },
    { id: 'brush', icon: Palette, label: 'Brush Tool', shortcut: 'B' },
    { id: 'clone', icon: Stamp, label: 'Clone Stamp', shortcut: 'S' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
    { id: 'pen', icon: PenTool, label: 'Pen Tool', shortcut: 'P' },
    { id: 'text', icon: Type, label: 'Type Tool', shortcut: 'T' },
    { id: 'hand', icon: Hand, label: 'Hand Tool', shortcut: 'H' },
]

interface ToolbarProps {
    activeTool: string
    setActiveTool: (tool: string) => void
    showTemplates: boolean
    onToggleTemplates: () => void
}

export function Toolbar({ activeTool, setActiveTool, showTemplates, onToggleTemplates }: ToolbarProps) {
    return (
        <TooltipProvider>
            {/* REMOVED: <Sidebar> and <SidebarContent> */}
            {/* ADDED: Standard HTML <aside> with manual Tailwind styling */}
            <aside className="h-screen w-[52px] flex flex-col items-center py-3 bg-[#1e1e1e] border-r border-white/5 shadow-2xl z-50">

                {/* Template Toggle */}
                <Tooltip>
                    <TooltipTrigger>
                        <button
                            onClick={onToggleTemplates}
                            className={cn(
                                "p-2.5 rounded-md transition-all duration-200 mb-1",
                                showTemplates
                                    ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
                            )}
                        >
                            <LayoutTemplate size={20} strokeWidth={2} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Templates</TooltipContent>
                </Tooltip>

                <div className="w-8 h-[1px] bg-white/10 my-2" />

                {/* Tools Loop */}
                <div className="flex flex-col gap-1">
                    {TOOLS.map(tool => (
                        <Tooltip key={tool.id}>
                            <TooltipTrigger>
                                <button
                                    onClick={() => setActiveTool(tool.id)}
                                    className={cn(
                                        "p-2.5 rounded-md transition-all relative group",
                                        activeTool === tool.id
                                            ? "bg-zinc-800 text-blue-400 border border-white/10 shadow-lg"
                                            : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
                                    )}
                                >
                                    <tool.icon
                                        size={18}
                                        strokeWidth={activeTool === tool.id ? 2.5 : 2}
                                    />

                                    {activeTool === tool.id && (
                                        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {tool.label} <span className="ml-2 text-zinc-500 font-mono">{tool.shortcut}</span>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>

                <div className="flex-1" />

                {/* Color Picker UI */}
                <div className="pb-4 flex flex-col items-center group">
                    <div className="relative w-7 h-7">
                        <div className="absolute top-0 left-0 w-5 h-5 bg-zinc-100 border border-black/40 shadow-sm z-20 rounded-sm cursor-pointer hover:scale-110 transition-transform" />
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-zinc-900 border border-white/20 shadow-sm z-10 rounded-sm cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                </div>
            </aside>
        </TooltipProvider>
    )
}