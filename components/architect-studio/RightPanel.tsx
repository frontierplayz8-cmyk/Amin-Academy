"use client"

import React from 'react'
import {
    Plus, Wand2, History, Sparkles,
    AlignLeft, AlignCenter, AlignRight,
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    StretchHorizontal, StretchVertical, MousePointer2,
    Type, Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import * as fabric from 'fabric' // For type checking if needed

// Sub-components
import { LayersPanel, Layer } from './LayersPanel'
import { AssetsPanel } from './AssetsPanel'
import { PosterGenerator } from './PosterGenerator'
import { MagicMediaPanel } from './MagicMediaPanel'

interface RightPanelProps {
    activePanel: 'properties' | 'brand-kit' | 'ai-lab' | 'assets'
    setActivePanel: (panel: 'properties' | 'brand-kit' | 'ai-lab' | 'assets') => void
    selectedObjectProps: any
    updateActiveObject: (props: any) => void
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>
    handleClippingMask: () => void
    onRemoveBackground: () => void
    // Layers Props
    layers: Layer[]
    selectedLayerId: number | null
    onLayerSelect: (id: number) => void
    onLayerToggle: (id: number) => void
    onLayerLock: (id: number) => void
    onLayerDelete: (id: number) => void
    onBlendModeChange: (mode: string) => void
    applyFilter: (type: string, value: number) => void
    onAddAIImage: (url: string) => void
    customAssets?: any[]
    onDeleteAsset?: (id: number) => void
    isSelectionActive: boolean
    onTextToVector: () => void
    onDataToViz: () => void
    isMobile?: boolean
}

export function RightPanel({
    activePanel,
    setActivePanel,
    selectedObjectProps,
    updateActiveObject,
    fabricCanvasRef,
    handleClippingMask,
    onRemoveBackground,
    layers,
    selectedLayerId,
    onLayerSelect,
    onLayerToggle,
    onLayerLock,
    onLayerDelete,
    onBlendModeChange,
    applyFilter,
    onAddAIImage,
    customAssets,
    onDeleteAsset,
    isSelectionActive,
    onTextToVector,
    onDataToViz,
    isMobile
}: RightPanelProps) {
    {/* Adjustments (Only for Images) */ }
    {
        fabricCanvasRef.current?.getActiveObject()?.type === 'image' && (
            <div className="space-y-4 pt-2">
                <span className="text-[9px] uppercase font-black text-zinc-500">Adjustments</span>

                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] text-zinc-400">Brightness</span>
                        <span className="text-[9px] text-white">{Math.round((selectedObjectProps.brightness || 0) * 100)}%</span>
                    </div>
                    <Slider
                        value={[(selectedObjectProps.brightness || 0) * 100]}
                        onValueChange={(val: any) => applyFilter('brightness', val[0] / 100)}
                        min={-100}
                        max={100}
                        step={1}
                        className="py-1"
                    />

                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] text-zinc-400">Contrast</span>
                        <span className="text-[9px] text-white">{Math.round((selectedObjectProps.contrast || 0) * 100)}%</span>
                    </div>
                    <Slider
                        value={[(selectedObjectProps.contrast || 0) * 100]}
                        onValueChange={(val: any) => applyFilter('contrast', val[0] / 100)}
                        min={-100}
                        max={100}
                        step={1}
                        className="py-1"
                    />

                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] text-zinc-400">Saturation</span>
                        <span className="text-[9px] text-white">{Math.round((selectedObjectProps.saturation || 0) * 100)}%</span>
                    </div>
                    <Slider
                        value={[(selectedObjectProps.saturation || 0) * 100]}
                        onValueChange={(val: any) => applyFilter('saturation', val[0] / 100)}
                        min={-100}
                        max={100}
                        step={1}
                        className="py-1"
                    />
                </div>
                <Separator className="bg-white/5" />
            </div>
        )
    }

    // Custom Vertical Resizing Logic
    const [layersPanelHeight, setLayersPanelHeight] = React.useState(300)
    const isResizingLayers = React.useRef(false)

    const startResizingLayers = React.useCallback(() => {
        isResizingLayers.current = true
        document.body.style.cursor = 'row-resize'
        document.body.style.userSelect = 'none'
    }, [])

    const stopResizingLayers = React.useCallback(() => {
        isResizingLayers.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }, [])

    const resizeLayers = React.useCallback((e: MouseEvent) => {
        if (isResizingLayers.current) {
            const newHeight = window.innerHeight - e.clientY
            // Min height 100px, Max height 80% of screen
            if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
                setLayersPanelHeight(newHeight)
            }
        }
    }, [])

    const [brandColors, setBrandColors] = React.useState([
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'
    ])

    const [brandFonts, setBrandFonts] = React.useState([
        'Inter', 'Outfit', 'Playfair Display', 'Space Mono'
    ])

    const isTextSelected = fabricCanvasRef.current?.getActiveObject()?.type === 'i-text'

    const handleApplyBrandColor = (color: string) => {
        const activeObj = fabricCanvasRef.current?.getActiveObject()
        if (activeObj) {
            activeObj.set('fill', color)
            fabricCanvasRef.current?.renderAll()
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

    // Alignment and Distribution Logic
    const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const activeGroup = canvas.getActiveObject() as any;

        if (!activeGroup) {
            toast.error("Select objects to align");
            return;
        }

        const objects = activeGroup._objects || [activeGroup];

        objects.forEach((obj: any) => {
            switch (type) {
                case 'left':
                    obj.set({ left: -activeGroup.width / 2 });
                    break;
                case 'center':
                    obj.set({ left: 0 });
                    break;
                case 'right':
                    obj.set({ left: activeGroup.width / 2 - obj.width * obj.scaleX });
                    break;
                case 'top':
                    obj.set({ top: -activeGroup.height / 2 });
                    break;
                case 'middle':
                    obj.set({ top: 0 });
                    break;
                case 'bottom':
                    obj.set({ top: activeGroup.height / 2 - obj.height * obj.scaleY });
                    break;
            }
        });

        canvas.requestRenderAll();
        toast.success(`Aligned ${type}`);
    }

    const handleDistribute = (dir: 'horizontal' | 'vertical') => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const activeGroup = canvas.getActiveObject() as any;

        if (!activeGroup || !activeGroup._objects || activeGroup._objects.length < 3) {
            toast.error("Select at least 3 objects to distribute");
            return;
        }

        const objects = [...activeGroup._objects].sort((a: any, b: any) => dir === 'horizontal' ? a.left - b.left : a.top - b.top);
        const count = objects.length;

        if (dir === 'horizontal') {
            const totalWidth = objects[count - 1].left - objects[0].left;
            const step = totalWidth / (count - 1);
            objects.forEach((obj: any, i: number) => {
                obj.set({ left: objects[0].left + (i * step) });
            });
        } else {
            const totalHeight = objects[count - 1].top - objects[0].top;
            const step = totalHeight / (count - 1);
            objects.forEach((obj: any, i: number) => {
                obj.set({ top: objects[0].top + (i * step) });
            });
        }

        canvas.requestRenderAll();
        toast.success(`Distributed ${dir}`);
    }

    React.useEffect(() => {
        window.addEventListener('mousemove', resizeLayers)
        window.addEventListener('mouseup', stopResizingLayers)
        return () => {
            window.removeEventListener('mousemove', resizeLayers)
            window.removeEventListener('mouseup', stopResizingLayers)
        }
    }, [resizeLayers, stopResizingLayers])

    return (
        <Sidebar side="right" collapsible="none" className={cn(
            "border-l border-black/30 bg-[#2d2d2d] flex flex-col w-full h-full shadow-xl",
            isMobile && "border-l-0"
        )}>
            {/* Panel Tabs */}
            <SidebarHeader className="h-8 bg-[#333] border-b border-black/40 flex flex-row p-0 gap-0 text-[10px] font-black uppercase tracking-widest text-zinc-500 shrink-0">
                <button
                    onClick={() => setActivePanel('properties')}
                    className={cn(
                        "flex-1 border-r border-black/20 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5",
                        activePanel === 'properties' ? "bg-[#2d2d2d] text-blue-400" : "hover:text-white"
                    )}
                >
                    Properties
                </button>
                <button
                    onClick={() => setActivePanel('assets')}
                    className={cn(
                        "flex-1 border-r border-black/20 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5",
                        activePanel === 'assets' ? "bg-[#2d2d2d] text-blue-400" : "hover:text-white"
                    )}
                >
                    Assets
                </button>
                <button
                    onClick={() => setActivePanel('brand-kit')}
                    className={cn(
                        "flex-1 border-r border-black/20 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5",
                        activePanel === 'brand-kit' ? "bg-[#2d2d2d] text-blue-400" : "hover:text-white"
                    )}
                >
                    Brand Kit
                </button>
                <button
                    onClick={() => setActivePanel('ai-lab')}
                    className={cn(
                        "flex-1 border-r border-black/20 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5",
                        activePanel === 'ai-lab' ? "bg-[#2d2d2d] text-blue-400" : "hover:text-white"
                    )}
                >
                    AI Lab
                </button>
            </SidebarHeader>

            {/* Content Area (Upper Panel) - Takes remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <SidebarContent className="h-full overflow-auto custom-scrollbar bg-[#2d2d2d] p-0">
                    {activePanel === 'properties' && (
                        /* Properties Panel */
                        <div className="flex-1 flex flex-col min-h-0">
                            {!isSelectionActive ? (
                                <div className="flex flex-col items-center justify-center flex-1 p-6 text-center opacity-50 space-y-4">
                                    <MousePointer2 size={48} className="text-zinc-600 mb-2" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-400">No Selection</p>
                                        <p className="text-xs text-zinc-600 mt-1">Select an object on the canvas to edit its properties.</p>
                                    </div>
                                    <div className="text-xs text-zinc-700 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                        Tip: Press 'T' to add text, 'R' for rectangle
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 space-y-4">
                                    {/* Alignment & Distribution */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] uppercase font-black text-zinc-500">Alignment</span>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleAlign('left')} title="Align Left"><AlignLeft size={12} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleAlign('center')} title="Align Horizontal Center"><AlignCenter size={12} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleAlign('right')} title="Align Right"><AlignRight size={12} /></Button>
                                                <div className="w-[1px] h-3 bg-white/10 mx-1" />
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleAlign('top')} title="Align Top"><AlignStartVertical size={12} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleAlign('middle')} title="Align Vertical Center"><AlignCenterVertical size={12} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleAlign('bottom')} title="Align Bottom"><AlignEndVertical size={12} /></Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] uppercase font-black text-zinc-500">Distribute</span>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleDistribute('horizontal')} title="Distribute Horizontally"><StretchHorizontal size={12} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleDistribute('vertical')} title="Distribute Vertically"><StretchVertical size={12} /></Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    {/* Adjustments (Only for Images) */}
                                    {fabricCanvasRef.current?.getActiveObject()?.type === 'image' && (
                                        <div className="space-y-4 pt-2">
                                            <span className="text-[9px] uppercase font-black text-zinc-500">Adjustments</span>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] text-zinc-400">Brightness</span>
                                                    <span className="text-[9px] text-white">{Math.round((selectedObjectProps.brightness || 0) * 100)}%</span>
                                                </div>
                                                <Slider
                                                    value={[(selectedObjectProps.brightness || 0) * 100]}
                                                    onValueChange={(val: any) => applyFilter('brightness', val[0] / 100)}
                                                    min={-100}
                                                    max={100}
                                                    step={1}
                                                    className="py-1"
                                                />

                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] text-zinc-400">Contrast</span>
                                                    <span className="text-[9px] text-white">{Math.round((selectedObjectProps.contrast || 0) * 100)}%</span>
                                                </div>
                                                <Slider
                                                    value={[(selectedObjectProps.contrast || 0) * 100]}
                                                    onValueChange={(val: any) => applyFilter('contrast', val[0] / 100)}
                                                    min={-100}
                                                    max={100}
                                                    step={1}
                                                    className="py-1"
                                                />

                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] text-zinc-400">Saturation</span>
                                                    <span className="text-[9px] text-white">{Math.round((selectedObjectProps.saturation || 0) * 100)}%</span>
                                                </div>
                                                <Slider
                                                    value={[(selectedObjectProps.saturation || 0) * 100]}
                                                    onValueChange={(val: any) => applyFilter('saturation', val[0] / 100)}
                                                    min={-100}
                                                    max={100}
                                                    step={1}
                                                    className="py-1"
                                                />
                                            </div>
                                            <Separator className="bg-white/5" />
                                        </div>
                                    )}

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
                            )}
                        </div>
                    )}

                    {activePanel === 'assets' && (
                        <AssetsPanel onAddImage={onAddAIImage} customAssets={customAssets || []} onDeleteAsset={onDeleteAsset || (() => { })} />
                    )}

                    {activePanel === 'brand-kit' && (
                        /* Brand Kit Panel */
                        <div className="flex-1 flex flex-col p-4 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] uppercase font-black text-zinc-500">Brand Colors</span>
                                    <div className="relative group">
                                        <Plus size={12} className="text-zinc-500 hover:text-white cursor-pointer" />
                                        <input
                                            type="color"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => setBrandColors([...brandColors, e.target.value])}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {brandColors.map(color => (
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
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] uppercase font-black text-zinc-500">Brand Fonts</span>
                                    <Plus
                                        size={12}
                                        className="text-zinc-500 hover:text-white cursor-pointer"
                                        onClick={() => {
                                            const newFont = prompt("Enter font name (e.g. Roboto, Montserrat):")
                                            if (newFont) setBrandFonts([...brandFonts, newFont])
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    {brandFonts.map(font => (
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
                        <div className="w-full bg-[#2d2d2d] h-full flex flex-col">

                            {/* Magic Media Generator */}
                            <div className="border-b border-white/5">
                                <MagicMediaPanel onAddImage={onAddAIImage} />
                            </div>

                            {/* Legacy AI Tools */}
                            <div className="p-4 space-y-6 shrink-0 overflow-y-auto">
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
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Button onClick={handleClippingMask} variant="outline" className="w-full bg-[#1e1e1e] border-white/5 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl hover:bg-purple-600 hover:text-white transition-all">
                                            Clipping Mask
                                        </Button>
                                        <Button onClick={onRemoveBackground} variant="outline" className="w-full bg-[#1e1e1e] border-white/5 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl hover:bg-green-600 hover:text-white transition-all group">
                                            <Wand2 className="w-3 h-3 mr-1 group-hover:rotate-12 transition-transform" />
                                            Remove BG
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={onTextToVector}
                                        variant="outline"
                                        className="w-full bg-[#1e1e1e] border-white/5 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl hover:bg-purple-600 hover:text-white transition-all"
                                    >
                                        Text-to-Vector
                                    </Button>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => onAddAIImage(`https://picsum.photos/seed/${i + 10}/800/600`)}
                                                className="aspect-square bg-[#1e1e1e] rounded flex items-center justify-center border border-white/5 hover:border-blue-500 transition-all cursor-pointer overflow-hidden relative group"
                                            >
                                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Sparkles size={16} className="text-white" />
                                                </div>
                                                <img src={`https://picsum.photos/seed/${i + 10}/100/100`} alt="AI Generated" className="w-full h-full object-cover opacity-50 group-hover:opacity-100" />
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={onDataToViz}
                                        variant="outline"
                                        className="w-full bg-[#1e1e1e] border-white/5 text-[10px] uppercase font-black tracking-widest h-10 rounded-xl hover:bg-purple-600 hover:text-white transition-all"
                                    >
                                        Data-to-Viz
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </SidebarContent>
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={startResizingLayers}
                className="h-1 bg-black/40 border-y border-white/5 hover:bg-blue-500/50 hover:h-1.5 transition-all cursor-row-resize z-10 w-full"
            />

            {/* Layers Panel (Bottom Panel) */}
            <div
                style={{ height: layersPanelHeight }}
                className="flex flex-col shrink-0 bg-[#2d2d2d] transition-all"
            >
                <LayersPanel
                    layers={layers}
                    selectedLayerId={selectedLayerId}
                    onLayerSelect={onLayerSelect}
                    onLayerToggle={onLayerToggle}
                    onLayerLock={onLayerLock}
                    onLayerDelete={onLayerDelete}
                    onBlendModeChange={onBlendModeChange}
                />
            </div>
        </Sidebar>
    )
}
