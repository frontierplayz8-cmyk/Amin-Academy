"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as fabric from 'fabric'
import {
    Move, MousePointer2, Lasso, Sparkles, Crop, Palette,
    Stamp, Eraser, Layers as LayersIcon, Type, Hand, PenTool,
    ChevronRight, Undo2, Redo2, Maximize2, Settings2, Eye, EyeOff,
    Lock, Unlock, Plus, Trash2, Download, Save, Image as ImageIcon,
    History, Sliders, Monitor, Wand2, Scissors, Square,
    ArrowRight,
    Upload,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle
} from '@/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
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

export default function ImageArchitectStudio() {
    const [view, setView] = useState<'choice' | 'blank-setup' | 'editor'>('choice')
    const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [activeTool, setActiveTool] = useState('move')
    const [layers, setLayers] = useState<any[]>([
        { id: 1, name: 'Background', visible: true, locked: false, opacity: 100 }
    ])
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(1)
    const [activePanel, setActivePanel] = useState<'properties' | 'brand-kit' | 'ai-lab'>('properties')
    const [selectedObjectProps, setSelectedObjectProps] = useState<any>({
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 0,
        opacity: 1,
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 'normal',
        textAlign: 'left'
    })

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvas = useRef<fabric.Canvas | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [showGenFill, setShowGenFill] = useState(false)
    const [genPrompt, setGenPrompt] = useState('')
    const [zoomLevel, setZoomLevel] = useState(100)
    const [isZKeyPressed, setIsZKeyPressed] = useState(false)

    // Initialize Fabric Canvas
    useEffect(() => {
        if (view === 'editor' && canvasRef.current && !fabricCanvas.current) {
            fabricCanvas.current = new (fabric as any).Canvas(canvasRef.current, {
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: '#ffffff',
            });

            // Sync Layers UI
            const syncLayers = () => {
                const objects = fabricCanvas.current?.getObjects() || [];
                setLayers(objects.map((obj) => {
                    if (!(obj as any)._layerId) {
                        (obj as any)._layerId = Math.random();
                    }
                    return {
                        id: (obj as any)._layerId,
                        name: (obj as any).name || obj.type,
                        visible: obj.visible,
                        locked: !obj.selectable,
                        opacity: (obj.opacity || 1) * 100
                    };
                }).reverse());
            };

            const syncSelection = () => {
                const activeObj = fabricCanvas.current?.getActiveObject();
                if (activeObj) {
                    setSelectedLayerId((activeObj as any)._layerId);
                    setSelectedObjectProps({
                        fill: activeObj.fill || '#000000',
                        stroke: activeObj.stroke || '#000000',
                        strokeWidth: activeObj.strokeWidth || 0,
                        opacity: activeObj.opacity || 1,
                        fontFamily: (activeObj as any).fontFamily || 'Inter',
                        fontSize: (activeObj as any).fontSize || 20,
                        fontWeight: (activeObj as any).fontWeight || 'normal',
                        textAlign: (activeObj as any).textAlign || 'left'
                    });
                } else {
                    setSelectedLayerId(null);
                }
            };

            fabricCanvas.current?.on('object:added', syncLayers);
            fabricCanvas.current?.on('object:removed', syncLayers);
            fabricCanvas.current?.on('object:modified', syncLayers);

            fabricCanvas.current?.on('selection:created', (e) => {
                setShowGenFill(true);
                syncSelection();
            });
            fabricCanvas.current?.on('selection:updated', syncSelection);
            fabricCanvas.current?.on('selection:cleared', () => {
                setShowGenFill(false);
                setSelectedObjectProps({
                    fill: '#000000',
                    stroke: '#000000',
                    strokeWidth: 0,
                    opacity: 1,
                    fontFamily: 'Inter',
                    fontSize: 20,
                    fontWeight: 'normal',
                    textAlign: 'left'
                });
            });

            if (bgImage) {
                (fabric as any).FabricImage.fromURL(bgImage).then((img: any) => {
                    img.scaleToWidth(dimensions.width);
                    img.set({ name: 'Background', selectable: true });
                    fabricCanvas.current?.add(img);
                    fabricCanvas.current?.sendObjectToBack(img);
                    fabricCanvas.current?.renderAll();
                });
            }
        }

        return () => {
            if (fabricCanvas.current) {
                fabricCanvas.current.dispose()
                fabricCanvas.current = null
            }
        }
    }, [view])

    const updateActiveObject = (props: any) => {
        const activeObj = fabricCanvas.current?.getActiveObject();
        if (activeObj) {
            activeObj.set(props);
            fabricCanvas.current?.renderAll();
            setSelectedObjectProps((prev: any) => ({ ...prev, ...props }));
        }
    };

    const handleBlendModeChange = (mode: string) => {
        const activeObj = fabricCanvas.current?.getActiveObject();
        if (activeObj) {
            const cssToFabric: any = {
                'Normal': 'source-over',
                'Multiply': 'multiply',
                'Screen': 'screen',
                'Overlay': 'overlay',
                'Darken': 'darken',
                'Lighten': 'lighten',
            };
            activeObj.set({ globalCompositeOperation: cssToFabric[mode] || 'source-over' });
            fabricCanvas.current?.renderAll();
        }
    };

    const toggleLayerVisibility = (layerId: any) => {
        const obj = fabricCanvas.current?.getObjects().find((o: any) => o._layerId === layerId);
        if (obj) {
            obj.set({ visible: !obj.visible });
            fabricCanvas.current?.renderAll();
            // syncLayers is triggered by renderAll if we added the right listeners or manually call it
            const objects = fabricCanvas.current?.getObjects() || [];
            setLayers(objects.map((o: any) => ({
                id: o._layerId,
                name: o.name || o.type,
                visible: o.visible,
                locked: !o.selectable,
                opacity: (o.opacity || 1) * 100
            })).reverse());
        }
    };

    const toggleLayerLock = (layerId: any) => {
        const obj = fabricCanvas.current?.getObjects().find((o: any) => o._layerId === layerId);
        if (obj) {
            obj.set({ selectable: !obj.selectable, evented: !obj.selectable });
            fabricCanvas.current?.renderAll();
            const objects = fabricCanvas.current?.getObjects() || [];
            setLayers(objects.map((o: any) => ({
                id: o._layerId,
                name: o.name || o.type,
                visible: o.visible,
                locked: !o.selectable,
                opacity: (o.opacity || 1) * 100
            })).reverse());
        }
    };

    const [showMagicSwitch, setShowMagicSwitch] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<any>(null)

    const handleResize = (preset: { label: string, w: number, h: number }) => {
        if (!fabricCanvas.current) return;

        const oldW = dimensions.width;
        const oldH = dimensions.height;
        const newW = preset.w;
        const newH = preset.h;

        // Calculate Scale Factor (Uniform)
        const scaleX = newW / oldW;
        const scaleY = newH / oldH;
        const scaleFactor = Math.min(scaleX, scaleY);

        // Update Component State
        setDimensions({ width: newW, height: newH });

        // Update Fabric Canvas
        const canvas = fabricCanvas.current;
        canvas.setDimensions({ width: newW, height: newH });

        // Scale and Center Objects
        canvas.forEachObject(obj => {
            const center = obj.getCenterPoint();
            obj.set({
                scaleX: (obj.scaleX || 1) * scaleFactor,
                scaleY: (obj.scaleY || 1) * scaleFactor,
                left: center.x * scaleX,
                top: center.y * scaleY
            });
            obj.setCoords();
        });

        canvas.renderAll();
        setShowMagicSwitch(false);
        toast.success(`Resized to ${preset.label} (${newW}x${newH})`);
    }

    // Tool Logic Effect
    useEffect(() => {
        if (!fabricCanvas.current) return;

        const canvas = fabricCanvas.current;
        canvas.isDrawingMode = activeTool === 'brush' || activeTool === 'eraser';

        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush = activeTool === 'eraser'
                ? new (fabric as any).EraserBrush(canvas)
                : new (fabric as any).PencilBrush(canvas);
            canvas.freeDrawingBrush!.width = 10;
            canvas.freeDrawingBrush!.color = activeTool === 'eraser' ? '#ffffff' : '#000000';
        }

        // Pen Tool (Simplified Vector Path)
        if (activeTool === 'pen') {
            let isDrawing = false;
            let currentPath: any = null;

            const onMouseDown = (o: any) => {
                isDrawing = true;
                const pointer = canvas.getScenePoint(o.e);
                currentPath = new (fabric as any).Path(`M ${pointer.x} ${pointer.y}`, {
                    fill: '',
                    stroke: '#000000',
                    strokeWidth: 2,
                    selectable: true
                });
                canvas.add(currentPath);
            };

            const onMouseMove = (o: any) => {
                if (!isDrawing) return;
                const pointer = canvas.getScenePoint(o.e);
                const pathData = currentPath.path;
                pathData.push(['L', pointer.x, pointer.y]);
                currentPath.set({ path: pathData });
                canvas.requestRenderAll();
            };

            const onMouseUp = () => {
                isDrawing = false;
            };

            canvas.on('mouse:down', onMouseDown);
            canvas.on('mouse:move', onMouseMove);
            canvas.on('mouse:up', onMouseUp);

            return () => {
                canvas.off('mouse:down', onMouseDown);
                canvas.off('mouse:move', onMouseMove);
                canvas.off('mouse:up', onMouseUp);
            };
        }

        // Text Tool
        if (activeTool === 'text') {
            const onMouseDown = (o: any) => {
                const pointer = canvas.getScenePoint(o.e);
                const text = new (fabric as any).IText('Type something...', {
                    left: pointer.x,
                    top: pointer.y,
                    fontSize: 32,
                    fontFamily: 'Inter',
                    fill: '#000000'
                });
                canvas.add(text);
                canvas.setActiveObject(text);
                setActiveTool('move');
                toast.success("Text layer added");
            };
            canvas.on('mouse:down', onMouseDown);
            return () => canvas.off('mouse:down', onMouseDown);
        }

        // Marquee Tool (Simplified)
        if (activeTool === 'marquee') {
            let isDrawing = false;
            let selectionRect: any = null;
            let startPoint: any = null;

            const onMouseDown = (o: any) => {
                isDrawing = true;
                startPoint = canvas.getScenePoint(o.e);
                selectionRect = new (fabric as any).Rect({
                    left: startPoint.x,
                    top: startPoint.y,
                    width: 0,
                    height: 0,
                    fill: 'rgba(59, 130, 246, 0.2)',
                    stroke: '#3b82f6',
                    strokeDashArray: [5, 5],
                    selectable: false,
                    evented: false
                });
                canvas.add(selectionRect);
            };

            const onMouseMove = (o: any) => {
                if (!isDrawing) return;
                const pointer = canvas.getScenePoint(o.e);
                selectionRect.set({
                    width: Math.abs(pointer.x - startPoint.x),
                    height: Math.abs(pointer.y - startPoint.y),
                    left: Math.min(pointer.x, startPoint.x),
                    top: Math.min(pointer.y, startPoint.y)
                });
                canvas.requestRenderAll();
            };

            const onMouseUp = () => {
                isDrawing = false;
                setShowGenFill(true);
                // Keep the rect for visualization until gen fill is used or tool changed
            };

            canvas.on('mouse:down', onMouseDown);
            canvas.on('mouse:move', onMouseMove);
            canvas.on('mouse:up', onMouseUp);

            return () => {
                if (selectionRect) canvas.remove(selectionRect);
                canvas.off('mouse:down', onMouseDown);
                canvas.off('mouse:move', onMouseMove);
                canvas.off('mouse:up', onMouseUp);
            };
        }

        // Selection Logic
        canvas.selection = activeTool === 'move';
        canvas.forEachObject(obj => {
            obj.selectable = activeTool === 'move';
        });

        canvas.renderAll();
    }, [activeTool])

    const handleClippingMask = () => {
        if (!fabricCanvas.current) return;
        const canvas = fabricCanvas.current;
        const activeObjects = canvas.getActiveObjects();

        if (activeObjects.length !== 2) {
            toast.error("Please select exactly two objects (Image and Shape)");
            return;
        }

        // Top object is the one to be clipped, Bottom object is the mask
        const mask = activeObjects[0].top! < activeObjects[1].top! ? activeObjects[1] : activeObjects[0];
        const target = activeObjects[0] === mask ? activeObjects[1] : activeObjects[0];

        // Clone mask to use as clipPath
        mask.clone().then((clonedMask: any) => {
            clonedMask.set({
                absolutePositioned: true,
                originX: 'center',
                originY: 'center',
            });
            target.set('clipPath', clonedMask);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            toast.success("Clipping Mask Created!");
        });
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            // Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                toast.info("Undo Triggered");
            }

            // Zoom In: Ctrl/Cmd + Plus or Ctrl/Cmd + =
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                setZoomLevel(prev => {
                    const newZoom = Math.min(prev + 10, 300);
                    if (fabricCanvas.current) {
                        const zoom = newZoom / 100;
                        fabricCanvas.current.setZoom(zoom);
                        fabricCanvas.current.renderAll();
                    }
                    toast.success(`Zoom: ${newZoom}%`);
                    return newZoom;
                });
            }

            // Zoom Out: Ctrl/Cmd + Minus
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                setZoomLevel(prev => {
                    const newZoom = Math.max(prev - 10, 10);
                    if (fabricCanvas.current) {
                        const zoom = newZoom / 100;
                        fabricCanvas.current.setZoom(zoom);
                        fabricCanvas.current.renderAll();
                    }
                    toast.success(`Zoom: ${newZoom}%`);
                    return newZoom;
                });
            }

            // Reset Zoom: Ctrl/Cmd + 0
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                setZoomLevel(100);
                if (fabricCanvas.current) {
                    fabricCanvas.current.setZoom(1);
                    fabricCanvas.current.renderAll();
                }
                toast.success("Zoom: 100%");
            }

            // Tool shortcuts
            if (e.key === 'v') setActiveTool('move');
            if (e.key === 'b') setActiveTool('brush');
            if (e.key === 't') setActiveTool('text');

            // Track Z key for zoom
            if (e.key === 'z' && !e.ctrlKey && !e.metaKey) {
                setIsZKeyPressed(true);
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'z') {
                setIsZKeyPressed(false);
            }
        }

        window.addEventListener('keydown', handleKeys);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeys);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [])

    // Z + Scroll Wheel Zoom
    useEffect(() => {
        const canvasContainer = document.querySelector('.canvas-zoom-area');
        if (!canvasContainer) return;

        const handleWheel = (e: Event) => {
            if (!isZKeyPressed) return;

            e.preventDefault();

            const delta = (e as WheelEvent).deltaY > 0 ? -10 : 10; // Scroll down = zoom out, scroll up = zoom in

            setZoomLevel(prev => {
                const newZoom = Math.min(Math.max(prev + delta, 10), 300);

                if (fabricCanvas.current) {
                    const zoom = newZoom / 100;
                    fabricCanvas.current.setZoom(zoom);
                    fabricCanvas.current.renderAll();
                }

                return newZoom;
            });
        };

        canvasContainer.addEventListener('wheel', handleWheel, { passive: false });
        return () => canvasContainer.removeEventListener('wheel', handleWheel);
    }, [isZKeyPressed])

    const handleTextAdd = () => {
        if (!fabricCanvas.current) return;
        const text = new (fabric as any).IText('Double click to edit', {
            left: 100,
            top: 100,
            fontFamily: 'Inter',
            fontSize: 40,
            fill: '#000000'
        });
        fabricCanvas.current.add(text);
        fabricCanvas.current.setActiveObject(text);
        setActiveTool('move');
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (f) => {
                const data = f.target?.result as string;
                if (view === 'editor' && fabricCanvas.current) {
                    (fabric as any).FabricImage.fromURL(data).then((img: any) => {
                        img.scaleToWidth(400);
                        fabricCanvas.current?.add(img);
                        fabricCanvas.current?.centerObject(img);
                        fabricCanvas.current?.renderAll();
                    });
                } else {
                    setBgImage(data)
                    setView('editor')
                }
                toast.success("Image added to canvas")
            }
            reader.readAsDataURL(file)
        }
    }

    const handleExport = (format: 'png' | 'jpg') => {
        if (!fabricCanvas.current) return;
        const dataURL = fabricCanvas.current.toDataURL({
            format: format === 'png' ? 'png' : 'jpeg',
            quality: 0.9,
            multiplier: 2 // High res export
        });
        const link = document.createElement('a');
        link.download = `architect-export.${format}`;
        link.href = dataURL;
        link.click();
        toast.success(`Exported as ${format.toUpperCase()}`);
    }

    const handleGenerativeFill = () => {
        if (!genPrompt) return;
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 2000)),
            {
                loading: 'Generative AI is filling the area...',
                success: 'Generative Fill complete!',
                error: 'Failed to generate content'
            }
        );
        setShowGenFill(false);
        setGenPrompt('');
    }

    if (view === 'editor') {
        return (
            <div className="fixed inset-0 bg-[#1e1e1e] text-[#b4b4b4] flex flex-col font-sans select-none overflow-hidden">
                {/* 1. TOP MENU BAR */}
                <div className="h-8 bg-[#2d2d2d] border-b border-black/30 flex items-center px-2 justify-between text-[11px] font-medium">
                    <div className="flex items-center gap-1">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center mr-2">
                            <ImageIcon size={14} className="text-white" />
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 rounded cursor-default transition-colors text-zinc-300 group relative">
                            File
                            <div className="absolute top-full left-0 w-48 bg-[#2d2d2d] border border-black/50 hidden group-hover:block z-50 shadow-2xl">
                                <div onClick={() => setView('choice')} className="px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between">
                                    <span>New...</span>
                                    <span className="text-zinc-500 text-[9px]">Ctrl+N</span>
                                </div>
                                <div className="h-[1px] bg-white/5 mx-2" />
                                <div onClick={() => handleExport('png')} className="px-4 py-2 hover:bg-blue-600 hover:text-white">Export as PNG</div>
                                <div onClick={() => handleExport('jpg')} className="px-4 py-2 hover:bg-blue-600 hover:text-white">Export as JPG</div>
                                <div className="h-[1px] bg-white/5 mx-2" />
                                <div className="px-4 py-2 hover:bg-blue-600 hover:text-white">Close</div>
                            </div>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 rounded cursor-default transition-colors text-zinc-300 group relative">
                            Edit
                            <div className="absolute top-full left-0 w-48 bg-[#2d2d2d] border border-black/50 hidden group-hover:block z-50 shadow-2xl">
                                <div className="px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between">
                                    <span>Undo</span>
                                    <span className="text-zinc-500 text-[9px]">Ctrl+Z</span>
                                </div>
                                <div className="px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between">
                                    <span>Redo</span>
                                    <span className="text-zinc-500 text-[9px]">Ctrl+Shift+Z</span>
                                </div>
                                <div className="h-[1px] bg-white/5 mx-2" />
                                <div className="px-4 py-2 hover:bg-blue-600 hover:text-white">Free Transform</div>
                            </div>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 rounded cursor-default transition-colors text-zinc-300 group relative">
                            Image
                            <div className="absolute top-full left-0 w-48 bg-[#2d2d2d] border border-black/50 hidden group-hover:block z-50 shadow-2xl">
                                <div onClick={() => setShowMagicSwitch(true)} className="px-4 py-2 hover:bg-emerald-600 hover:text-white flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={12} className="text-emerald-400" />
                                        <span>Magic Switch...</span>
                                    </div>
                                    <span className="text-zinc-500 text-[9px]">Ctrl+Alt+I</span>
                                </div>
                                <div className="h-[1px] bg-white/5 mx-2" />
                                <div className="px-4 py-2 hover:bg-blue-600 hover:text-white">Adjustments</div>
                                <div className="px-4 py-2 hover:bg-blue-600 hover:text-white">Canvas Size</div>
                            </div>
                        </div>
                        {['Layer', 'Type', 'Select', 'Filter', 'View', 'Window', 'Help'].map(item => (
                            <div key={item} className="px-2 py-1 hover:bg-white/10 rounded cursor-default transition-colors text-zinc-300">
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 px-4 text-zinc-500">
                        <div className="flex items-center gap-2">
                            <Undo2 size={12} className="cursor-pointer hover:text-white" />
                            <Redo2 size={12} className="cursor-pointer hover:text-white" />
                        </div>
                        <span className="text-[10px] font-mono tracking-tighter text-blue-500 font-bold uppercase">Bolt-Velocity v2.0</span>
                    </div>
                </div>

                {/* 2. CONTEXTUAL OPTIONS BAR */}
                <div className="h-8 bg-[#2d2d2d] border-b border-black/40 flex items-center px-4 gap-6 text-[10px] uppercase font-bold tracking-widest text-[#888]">
                    <div className="flex items-center gap-2 border-r border-white/5 pr-4 h-4">
                        <Monitor size={12} />
                        <span>{dimensions.width} x {dimensions.height}</span>
                    </div>
                    {activeTool === 'brush' && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span>Size:</span>
                                <input type="range" className="w-24 accent-blue-600" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Opacity:</span>
                                <input type="range" className="w-24 accent-blue-600" />
                            </div>
                        </div>
                    )}
                    {activeTool === 'move' && (
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3 bg-zinc-800 border-none rounded" />
                                <span>Auto-Select</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3 bg-zinc-800 border-none rounded" />
                                <span>Show Transform Controls</span>
                            </label>
                        </div>
                    )}
                </div>

                <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
                    {/* 3. LEFT TOOLBAR */}
                    <ResizablePanel defaultSize={4} minSize={3} maxSize={8}>
                        <div className="h-full bg-[#2d2d2d] border-r border-black/30 flex flex-col items-center py-2 gap-0.5 shadow-xl">
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
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* 4. MAIN CANVAS AREA */}
                    <ResizablePanel defaultSize={76}>
                        <div className={cn(
                            "h-full bg-[#121212] overflow-auto p-20 flex items-center justify-center custom-scrollbar relative canvas-zoom-area",
                            isZKeyPressed && "cursor-zoom-in"
                        )}>
                            {/* Generative Fill Floating Bar */}
                            <AnimatePresence>
                                {showGenFill && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-[#2d2d2d] border border-black/50 rounded-2xl shadow-2xl backdrop-blur-xl"
                                    >
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 rounded-xl border border-blue-500/20">
                                            <Sparkles size={14} className="text-blue-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Generative Fill</span>
                                        </div>
                                        <Input
                                            value={genPrompt}
                                            onChange={(e) => setGenPrompt(e.target.value)}
                                            placeholder="What should I create in this area?"
                                            className="h-9 w-64 bg-black/40 border-white/5 text-xs text-white rounded-xl placeholder:text-zinc-600 focus:ring-blue-500/20"
                                        />
                                        <Button
                                            onClick={handleGenerativeFill}
                                            className="h-9 px-4 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase"
                                        >
                                            Fill
                                        </Button>
                                        <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowGenFill(false)}
                                            className="h-9 w-9 rounded-xl hover:bg-white/5"
                                        >
                                            <X size={14} />
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-black/50 bg-white">
                                <canvas ref={canvasRef} />
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* 5. RIGHT PANEL SYSTEM */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <div className="h-full bg-[#2d2d2d] border-l border-black/30 flex flex-col overflow-hidden">
                            {/* Panel Tabs */}
                            <div className="h-8 bg-[#333] border-b border-black/40 flex text-[9px] font-black uppercase tracking-widest text-zinc-500">
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
                                <button className="flex-1 hover:bg-white/5 hover:text-white transition-colors">History</button>
                            </div>

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
                                                            className="absolute -inset-1 w-10 h-10 cursor-pointer"
                                                        />
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
                                                        const newVal = Array.isArray(val) ? val[0] : val;
                                                        updateActiveObject({ opacity: newVal / 100 });
                                                    }}
                                                    max={100}
                                                    step={1}
                                                    className="py-2"
                                                />
                                            </div>
                                        </div>

                                        {/* Typography Controls */}
                                        {fabricCanvas.current?.getActiveObject()?.type === 'i-text' && (
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
                                                                className="h-8 bg-black/20 border-white/5 text-[11px] text-white p-1.5 focus:ring-blue-500/20"
                                                            />
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
                                                    onClick={() => {
                                                        const activeObj = fabricCanvas.current?.getActiveObject();
                                                        if (activeObj) {
                                                            activeObj.set('fill', color);
                                                            fabricCanvas.current?.renderAll();
                                                            toast.success(`Applied brand color: ${color}`);
                                                        }
                                                    }}
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
                                                    onClick={() => {
                                                        const activeObj = fabricCanvas.current?.getActiveObject();
                                                        if (activeObj && activeObj.type === 'i-text') {
                                                            (activeObj as any).set('fontFamily', font);
                                                            fabricCanvas.current?.renderAll();
                                                            toast.success(`Applied brand font: ${font}`);
                                                        }
                                                    }}
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
                                                className="w-full h-24 bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-blue-500/50 outline-none resize-none"
                                            />
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

                            {/* Layers Panel */}
                            <div className="h-[400px] border-t border-black/50 flex flex-col bg-[#2d2d2d]">
                                <div className="h-8 bg-[#3c3c3c] border-b border-black/20 flex items-center px-3 justify-between">
                                    <div className="flex items-center gap-2">
                                        <LayersIcon size={14} className="text-zinc-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#bbb]">Layers</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Plus size={12} className="cursor-pointer hover:text-white" />
                                        <Trash2 size={12} className="cursor-pointer hover:text-red-500" />
                                    </div>
                                </div>

                                {/* Blending Modes & Opacity */}
                                <div className="p-2 border-b border-black/10 flex items-center gap-2 text-[10px]">
                                    <select
                                        onChange={(e) => handleBlendModeChange(e.target.value)}
                                        className="flex-1 bg-black/30 border border-white/5 rounded px-2 py-1 outline-none text-zinc-300"
                                    >
                                        <option>Normal</option>
                                        <option>Multiply</option>
                                        <option>Screen</option>
                                        <option>Overlay</option>
                                        <option>Darken</option>
                                        <option>Lighten</option>
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
                                            onClick={() => {
                                                const obj = fabricCanvas.current?.getObjects().find((o: any) => (o as any)._layerId === layer.id);
                                                if (obj) {
                                                    fabricCanvas.current?.setActiveObject(obj);
                                                    fabricCanvas.current?.renderAll();
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center px-3 py-2 border-b border-black/10 gap-3 group transition-colors cursor-pointer",
                                                selectedLayerId === layer.id ? "bg-blue-600 text-white" : "hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="hover:text-blue-400">
                                                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-red-500" />}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }} className="hover:text-amber-400">
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
                                    <Trash2 size={14} className="hover:text-zinc-400 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>

                {/* 6. STATUS BAR */}
                <div className="h-6 bg-blue-600 flex items-center px-4 justify-between text-[10px] text-white/90 font-medium">
                    <div className="flex gap-4">
                        <span>Zoom: {zoomLevel}%</span>
                        <span>Layer: {layers.find(l => l.id === selectedLayerId)?.name || 'None'}</span>
                    </div>
                    <span>Ready</span>
                </div>

                {/* MAGIC SWITCH MODAL */}
                <AnimatePresence>
                    {showMagicSwitch && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="max-w-2xl w-full bg-[#1e1e1e] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                            >
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#252525]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                                            <Sparkles size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white">Magic Switch</h2>
                                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Intelligent Resize Engine</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowMagicSwitch(false)} className="rounded-full hover:bg-white/5">
                                        <X size={18} />
                                    </Button>
                                </div>

                                <div className="p-8 grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Instagram Reel', w: 1080, h: 1920, icon: <Monitor className="rotate-90" size={16} /> },
                                        { label: 'LinkedIn Banner', w: 1584, h: 396, icon: <Monitor size={16} /> },
                                        { label: 'YouTube Thumbnail', w: 1280, h: 720, icon: <Monitor size={16} /> },
                                        { label: 'A4 Document', w: 2480, h: 3508, icon: <Monitor size={16} /> },
                                        { label: 'Facebook Post', w: 1200, h: 630, icon: <ImageIcon size={16} /> },
                                        { label: 'Square Post', w: 1080, h: 1080, icon: <Square size={16} /> }
                                    ].map(preset => (
                                        <button
                                            key={preset.label}
                                            onClick={() => handleResize(preset)}
                                            className="group p-4 bg-white/5 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl flex items-center gap-4 transition-all text-left"
                                        >
                                            <div className="p-3 bg-white/5 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all text-zinc-400">
                                                {preset.icon}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white mb-0.5">{preset.label}</div>
                                                <div className="text-[10px] text-zinc-600 font-mono">{preset.w} x {preset.h} px</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-8 bg-[#181818] flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setShowMagicSwitch(false)} className="text-zinc-500">Cancel</Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs px-8 h-10 rounded-xl">Custom Size</Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-[#121212] flex items-center justify-center p-6 text-white font-sans">
            <AnimatePresence mode="wait">
                {view === 'choice' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <div className="space-y-6">
                            <div className="inline-block p-3 bg-blue-600/10 border border-blue-600/20 rounded-2xl mb-4">
                                <ImageIcon className="text-blue-500" size={32} />
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter">Image Architect <span className="text-blue-500">Studio</span></h1>
                            <p className="text-zinc-400 text-lg leading-relaxed max-w-sm">
                                Professional-grade image editing and generative manipulation at your fingertips.
                            </p>
                            <div className="flex gap-2">
                                <div className="h-1.5 w-8 bg-blue-500 rounded-full" />
                                <div className="h-1.5 w-1.5 bg-zinc-800 rounded-full" />
                                <div className="h-1.5 w-1.5 bg-zinc-800 rounded-full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="group p-8 bg-zinc-900 border border-white/5 rounded-3xl text-left hover:border-blue-500/50 hover:bg-zinc-800/50 transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <Upload size={24} />
                                    </div>
                                    <ArrowRight size={20} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Upload Image</h3>
                                <p className="text-zinc-500 text-sm">Start editing from a local JPG, PNG, or PSD file.</p>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </button>

                            <button
                                onClick={() => setView('blank-setup')}
                                className="group p-8 bg-zinc-900 border border-white/5 rounded-3xl text-left hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all text-emerald-500 group-hover:text-white">
                                        <Plus size={24} />
                                    </div>
                                    <ArrowRight size={20} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white">Blank Canvas</h3>
                                <p className="text-zinc-500 text-sm">Create a new workspace with custom dimensions.</p>
                            </button>
                        </div>
                    </motion.div>
                )}

                {view === 'blank-setup' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 space-y-8 shadow-2xl"
                    >
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Canvas Setup</h2>
                            <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">New Document Properties</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Width <span className="text-zinc-400">(PX)</span></Label>
                                <Input
                                    type="number"
                                    value={dimensions.width}
                                    onChange={(e) => setDimensions({ ...dimensions, width: parseInt(e.target.value) })}
                                    className="h-14 bg-black/40 border-white/5 text-lg font-bold rounded-2xl focus:ring-emerald-500/20 items-center justify-center flex"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Height <span className="text-zinc-400">(PX)</span></Label>
                                <Input
                                    type="number"
                                    value={dimensions.height}
                                    onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) })}
                                    className="h-14 bg-black/40 border-white/5 text-lg font-bold rounded-2xl focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Presets</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'FHD (1080p)', w: 1920, h: 1080 },
                                    { label: '4K (UHD)', w: 3840, h: 2160 },
                                    { label: 'Square', w: 1080, h: 1080 },
                                    { label: 'Mobile', w: 1080, h: 1920 }
                                ].map(preset => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setDimensions({ width: preset.w, height: preset.h })}
                                        className="h-12 bg-white/5 border border-white/5 hover:border-white/20 rounded-xl text-xs font-bold transition-all"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setView('choice')} className="h-14 px-6 rounded-2xl text-zinc-500 hover:text-white">
                                Back
                            </Button>
                            <Button onClick={() => setView('editor')} className="h-14 flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg shadow-xl shadow-emerald-600/20">
                                Create Workspace
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
