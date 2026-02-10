"use client"

import React from 'react'
import {
    Plus, Wand2, History, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import * as fabric from 'fabric' // For type checking if needed, though we use `fabricCanvas` ref

interface PropertiesPanelProps {
    activePanel: 'properties' | 'brand-kit' | 'ai-lab'
    setActivePanel: (panel: 'properties' | 'brand-kit' | 'ai-lab') => void
    selectedObjectProps: any
    updateActiveObject: (props: any) => void
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>
    handleClippingMask: () => void
}

export function PropertiesPanel({
    activePanel,
    setActivePanel,
    selectedObjectProps,
    updateActiveObject,
    fabricCanvasRef,
    handleClippingMask
}: PropertiesPanelProps) {

    const isTextSelected = fabricCanvasRef.current?.getActiveObject()?.type === 'i-text'

    const handleApplyBrandColor = (color: string) => {
        const activeObj = fabricCanvasRef.current?.getActiveObject()
        if (activeObj) {
            activeObj.set('fill', color)
            fabricCanvasRef.current?.renderAll()
            // We should also update local state, but updateActiveObject might expect an object
            updateActiveObject({ fill: color })
            toast.success(`Applied brand color: ${color}`)
        }
    }

    const handleApplyBrandFont = (font: string) => {
        const activeObj = fabricCanvasRef.current?.getActiveObject()
        if (activeObj && activeObj.type === 'i-text') {
            (activeObj as any).set('fontFamily', font)
            fabricCanvasRef.current?.renderAll()
            updateActiveObject({ fontFamily: font })
            toast.success(`Applied brand font: ${font}`)
        }
    }

    return (
        <Sidebar side="right" collapsible="none" className="border-l border-black/30 bg-[#2d2d2d] flex flex-col w-80 shadow-xl">
            {/* Panel Tabs */}
            <SidebarHeader className="h-8 bg-[#333] border-b border-black/40 flex flex-row p-0 gap-0 text-[10px] font-black uppercase tracking-widest text-zinc-500 shrink-0">
                <button
                    onClick={() => setActivePanel('properties')}
                    className={cn(
                        "flex-1 border-r border-black/20 hover:bg-white/5 transition-colors",
                        activePanel === 'properties' ? "bg-[#2d2d2d] text-blue-400" : "hover:text-white"
                    )}
                >
                    Properties
                </button>
                <button
                    onClick={() => setActivePanel('brand-kit')}
                    className={cn(
                        "flex-1 border-r border-black/20 hover:bg-white/5 transition-colors",
                        activePanel === 'brand-kit' ? "bg-[#2d2d2d] text-blue-400" : "hover:text-white"
                    )}
                >
                    Brand Kit
                </button>
                <button
                    onClick={() => setActivePanel('ai-lab')}
                    className={cn(
                        "flex-1 border-r border-black/20 hover:bg-white/5 transition-colors",
                        activePanel === 'ai-lab' ? "bg-[#2d2d2d] text-blue-400" : "hover:text-white"
                    )}
                >
                    AI Lab
                </button>
                <button className="flex-1 hover:bg-white/5 hover:text-white transition-colors h-full flex items-center justify-center">History</button>
            </SidebarHeader>

            <SidebarContent className="flex-1 overflow-auto custom-scrollbar bg-[#2d2d2d] p-0">

                {activePanel === 'properties' && (
                    /* Properties Panel */
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-4 space-y-4">
                            {/* Alignment */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] uppercase font-black text-zinc-500">Alignment</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 rounded border border-white/5 cursor-pointer" />)}
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-white/5" />

                            {/* Dynamic Appearance */}
                            <div className="space-y-4">
                                <span className="text-[9px] uppercase font-black text-zinc-500">Appearance</span>

                                {/* Fill Color */}
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] text-zinc-400">Fill</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 font-mono">{String(selectedObjectProps.fill).toUpperCase()}</span>
                                        <div className="w-6 h-6 rounded-md border border-white/10 overflow-hidden relative">
                                            <input
                                                type="color"
                                                value={selectedObjectProps.fill}
                                                onChange={(e) => updateActiveObject({ fill: e.target.value })}
                                                className="absolute -inset-1 w-10 h-10 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                {/* Opacity */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] text-zinc-400">Opacity</Label>
                                        <span className="text-[10px] text-zinc-500">{Math.round(selectedObjectProps.opacity * 100)}%</span>
                                    </div>
                                    <Slider
                                        value={[selectedObjectProps.opacity * 100]}
                                        onValueChange={(val) => {
                                            const newVal = Array.isArray(val) ? val[0] : val
                                            updateActiveObject({ opacity: newVal / 100 })
                                        }}
                                        max={100}
                                        step={1}
                                        className="py-2" />
                                </div>
                            </div>

                            {/* Typography Controls */}
                            {isTextSelected && (
                                <>
                                    <Separator className="bg-white/5" />
                                    <div className="space-y-4">
                                        <span className="text-[9px] uppercase font-black text-zinc-500">Typography</span>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <div className="text-[8px] text-zinc-600 mb-1 uppercase font-black">Font Size</div>
                                                <Input
                                                    type="number"
                                                    value={selectedObjectProps.fontSize}
                                                    onChange={(e) => updateActiveObject({ fontSize: parseInt(e.target.value) })}
                                                    className="h-8 bg-black/20 border-white/5 text-[11px] text-white p-1.5 focus:ring-blue-500/20" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[8px] text-zinc-600 mb-1 uppercase font-black">Weight</div>
                                                <select
                                                    value={selectedObjectProps.fontWeight}
                                                    onChange={(e) => updateActiveObject({ fontWeight: e.target.value })}
                                                    className="w-full h-8 bg-black/20 border border-white/5 rounded text-[11px] text-white px-1 outline-none"
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="bold">Bold</option>
                                                    <option value="900">Black</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activePanel === 'brand-kit' && (
                    /* Brand Kit Panel */
                    <div className="flex-1 flex flex-col p-4 space-y-6 overflow-auto custom-scrollbar">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] uppercase font-black text-zinc-500">Brand Colors</span>
                                <Plus size={12} className="text-zinc-500 hover:text-white cursor-pointer" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                                    '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'
                                ].map(color => (
                                    <div
                                        key={color}
                                        onClick={() => handleApplyBrandColor(color)}
                                        className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-lg group relative"
                                        style={{ backgroundColor: color }}
                                    >
                                        <div className="absolute inset-0 border-2 border-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <span className="text-[9px] uppercase font-black text-zinc-500">Brand Fonts</span>
                            <div className="space-y-2">
                                {['Inter', 'Outfit', 'Playfair Display', 'Space Mono'].map(font => (
                                    <button
                                        key={font}
                                        onClick={() => handleApplyBrandFont(font)}
                                        className="w-full p-3 bg-white/5 border border-white/5 hover:border-blue-500/50 rounded-xl text-left transition-all"
                                        style={{ fontFamily: font }}
                                    >
                                        <span className="text-sm text-white">{font}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activePanel === 'ai-lab' && (
                    /* AI Lab Panel */
                    <div className="flex-1 flex flex-col p-4 space-y-6 overflow-auto custom-scrollbar">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Wand2 size={16} className="text-blue-400" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-white">Magic Media</span>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[9px] uppercase font-black text-zinc-500">Text to Video</Label>
                                <textarea
                                    placeholder="Describe a cinematic scene..."
                                    className="w-full h-24 bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-blue-500/50 outline-none resize-none" />
                                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl shadow-lg shadow-blue-500/20">
                                    Generate 5s Clip
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <History size={16} className="text-emerald-400" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-white">Content Planner</span>
                            </div>
                            <Button
                                onClick={() => toast.info("Social Media Calendar opened", {
                                    description: "Sync your designs directly to Instagram & LinkedIn."
                                })}
                                variant="outline"
                                className="w-full bg-[#1e1e1e] border-white/5 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/0 hover:shadow-emerald-500/20"
                            >
                                Open Calendar
                            </Button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={16} className="text-purple-400" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-white">Pro Studio</span>
                            </div>
                            <Button onClick={handleClippingMask} variant="outline" className="w-full bg-[#1e1e1e] border-white/5 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-lg shadow-purple-500/0 hover:shadow-purple-500/20">
                                Clipping Mask
                            </Button>
                            <Button variant="outline" className="w-full bg-[#1e1e1e] border-white/5 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-lg shadow-purple-500/0 hover:shadow-purple-500/20">
                                Magic Grab
                            </Button>
                        </div>
                    </div>
                )}

            </SidebarContent>
        </Sidebar>
    )
}
