"use client"

import React from 'react'
import {
    Eye, EyeOff, Lock, Unlock,
    Plus, Trash2, Image as ImageIcon,
    Scissors, Layers as LayersIcon
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface Layer {
    id: number
    name: string
    visible: boolean
    locked: boolean
    opacity: number
}

interface LayersPanelProps {
    layers: Layer[]
    selectedLayerId: number | null
    onLayerSelect: (id: number) => void
    onLayerToggle: (id: number) => void
    onLayerLock: (id: number) => void
    onLayerDelete: (id: number) => void
    onBlendModeChange: (mode: string) => void
}

export function LayersPanel({
    layers,
    selectedLayerId,
    onLayerSelect,
    onLayerToggle,
    onLayerLock,
    onLayerDelete,
    onBlendModeChange
}: LayersPanelProps) {
    return (
        <div className="h-full border-t border-black/50 flex flex-col bg-[#2d2d2d]">
            <div className="h-8 bg-[#3c3c3c] border-b border-black/20 flex items-center px-3 justify-between">
                <div className="flex items-center gap-2">
                    <LayersIcon size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#bbb]">Layers</span>
                </div>
                <div className="flex gap-2">
                    <Plus size={12} className="cursor-pointer hover:text-white" />
                    <Trash2 onClick={() => selectedLayerId && onLayerDelete(selectedLayerId)} size={12} className="cursor-pointer hover:text-white" />
                </div>
            </div>

            {/* Blending Modes & Opacity */}
            <div className="p-2 border-b border-black/10 flex items-center gap-2 text-[10px]">
                <select
                    onChange={(e) => onBlendModeChange(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 outline-none text-zinc-300 text-[9px] font-bold uppercase tracking-wider hover:bg-black/60 transition-colors"
                >
                    <optgroup label="Basic">
                        <option value="Normal">Normal</option>
                        <option value="Dissolve" disabled>Dissolve</option>
                    </optgroup>
                    <optgroup label="Darken">
                        <option value="Darken">Darken</option>
                        <option value="Multiply">Multiply</option>
                        <option value="Color Burn" disabled>Color Burn</option>
                    </optgroup>
                    <optgroup label="Lighten">
                        <option value="Lighten">Lighten</option>
                        <option value="Screen">Screen</option>
                        <option value="Color Dodge" disabled>Color Dodge</option>
                    </optgroup>
                    <optgroup label="Contrast">
                        <option value="Overlay">Overlay</option>
                        <option value="Soft Light" disabled>Soft Light</option>
                        <option value="Hard Light" disabled>Hard Light</option>
                    </optgroup>
                </select>
                <div className="flex items-center gap-1">
                    <span className="text-zinc-600">Op:</span>
                    <span className="text-white w-6 text-right">
                        {selectedLayerId ? Math.round((layers.find(l => l.id === selectedLayerId)?.opacity || 0)) : 100}%
                    </span>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-[#252525]">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        onClick={() => onLayerSelect(layer.id)}
                        className={cn(
                            "flex items-center px-3 py-2 border-b border-black/10 gap-3 group transition-colors cursor-pointer",
                            selectedLayerId === layer.id ? "bg-blue-600 text-white" : "hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onLayerToggle(layer.id) }} className="hover:text-blue-400">
                                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-red-500" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onLayerLock(layer.id) }} className="hover:text-amber-400">
                                {layer.locked ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} />}
                            </button>
                        </div>
                        <div className="w-10 h-10 bg-black/20 border border-white/5 rounded shrink-0 flex items-center justify-center">
                            <ImageIcon size={16} className={cn(selectedLayerId === layer.id ? "text-white/50" : "text-zinc-700")} />
                        </div>
                        <span className="text-[11px] font-medium truncate">{layer.name}</span>
                    </div>
                ))}
            </ScrollArea>

            {/* Layer Actions Footer */}
            <div className="h-8 bg-[#333] border-t border-black/20 flex items-center justify-around text-zinc-500">
                <Plus size={14} className="hover:text-white cursor-pointer" />
                <ImageIcon size={14} className="hover:text-white cursor-pointer" />
                <Scissors size={14} className="hover:text-white cursor-pointer" />
                <Trash2 onClick={() => selectedLayerId && onLayerDelete(selectedLayerId)} size={14} className="hover:text-zinc-400 cursor-pointer" />
            </div>
        </div>
    )
}
