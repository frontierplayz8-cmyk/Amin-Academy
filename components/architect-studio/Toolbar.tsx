"use client"

import React from 'react'
import {
    Move, Lasso, Crop, Palette,
    Stamp, Eraser, Type, Hand, PenTool,
    Wand2, Square, LayoutTemplate
} from 'lucide-react'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

// Toolbar Tools Definition
const TOOLS = [
    { id: 'move', icon: Move, label: 'Move Tool (V)', shortcut: 'v' },
    { id: 'marquee', icon: Square, label: 'Marquee Tool (M)', shortcut: 'm' },
    { id: 'lasso', icon: Lasso, label: 'Lasso Tool (L)', shortcut: 'l' },
    { id: 'magic', icon: Wand2, label: 'Magic Wand (W)', shortcut: 'w' },
    { id: 'crop', icon: Crop, label: 'Crop Tool (C)', shortcut: 'c' },
    { id: 'brush', icon: Palette, label: 'Brush Tool (B)', shortcut: 'b' },
    { id: 'clone', icon: Stamp, label: 'Clone Stamp (S)', shortcut: 's' },
    { id: 'eraser', icon: Eraser, label: 'Eraser (E)', shortcut: 'e' },
    { id: 'pen', icon: PenTool, label: 'Pen Tool (P)', shortcut: 'p' },
    { id: 'text', icon: Type, label: 'Horizontal Type Tool (T)', shortcut: 't' },
    { id: 'hand', icon: Hand, label: 'Hand Tool (H)', shortcut: 'h' },
]

interface ToolbarProps {
    activeTool: string
    setActiveTool: (tool: string) => void
    showTemplates: boolean
    onToggleTemplates: () => void
}

export function Toolbar({ activeTool, setActiveTool, showTemplates, onToggleTemplates }: ToolbarProps) {
    return (
        <Sidebar className="border-r border-black/30 bg-[#2d2d2d] flex flex-col items-center py-2 gap-0.5 shadow-xl w-[50px]">
            <SidebarContent className="flex flex-col items-center gap-1 px-0 py-2 w-full overflow-hidden">
                <button
                    onClick={onToggleTemplates}
                    title="Templates"
                    className={cn(
                        "p-2 rounded transition-all group relative mb-2",
                        showTemplates ? "bg-blue-600/20 text-blue-400" : "hover:bg-zinc-700/50 text-[#888] hover:text-[#ccc]"
                    )}
                >
                    <LayoutTemplate size={18} strokeWidth={2.5} />
                    {showTemplates && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-500 rounded-r-full" />}
                </button>

                <div className="w-6 h-[1px] bg-white/5 mb-2" />

                {TOOLS.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        title={tool.label}
                        className={cn(
                            "p-2 rounded transition-all group relative",
                            activeTool === tool.id ? "bg-zinc-700 text-white shadow-inner" : "hover:bg-zinc-700/50 text-[#888] hover:text-[#ccc]"
                        )}
                    >
                        <tool.icon size={16} strokeWidth={2.5} />
                        {activeTool === tool.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-500 rounded-r-full" />}
                    </button>
                ))}
                <div className="flex-1" />
                <div className="p-2 space-y-1">
                    <div className="w-5 h-5 bg-white border border-black/40 shadow-lg relative z-10" />
                    <div className="w-5 h-5 bg-black border border-white/20 shadow-lg -mt-3 ml-2" />
                </div>
            </SidebarContent>
        </Sidebar>
    )
}
