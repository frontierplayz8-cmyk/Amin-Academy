"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as fabric from 'fabric'
import {
    Sparkles, Monitor, X,
    Layers as LayersIcon,
    Layout,
    Minus,
    Plus,
    Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

// Components
import { GatewayModal } from '@/components/architect-studio/GatewayModal'
import { Toolbar } from '@/components/architect-studio/Toolbar'
import { TopBar } from '@/components/architect-studio/TopBar'
import { RightPanel } from '@/components/architect-studio/RightPanel'
import { MagicSwitch } from '@/components/architect-studio/MagicSwitch'
import { TemplateSidebar } from '@/components/architect-studio/TemplateSidebar'
import { CustomContextMenu } from '@/components/architect-studio/ContextMenu'
import { removeBackground } from "@imgly/background-removal"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from "@/components/ui/separator"

export default function ImageArchitectStudio() {
    const [view, setView] = useState<'choice' | 'blank-setup' | 'editor'>('choice')
    const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [activeTool, setActiveTool] = useState('move')
    const [layers, setLayers] = useState<any[]>([
        { id: 1, name: 'Background', visible: true, locked: false, opacity: 100 }
    ])
    const [customAssets, setCustomAssets] = useState<any[]>([])
    const [recentProject, setRecentProject] = useState<any>(null)
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(1)
    const [activePanel, setActivePanel] = useState<'properties' | 'brand-kit' | 'ai-lab' | 'assets'>('properties')
    const initialProps = {
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 0,
        opacity: 1,
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 'normal',
        textAlign: 'left',
        brightness: 0,
        contrast: 0,
        saturation: 0,
        zIndex: 0,
        isLocked: false
    }
    const [selectedObjectProps, setSelectedObjectProps] = useState<any>(initialProps)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvas = useRef<fabric.Canvas | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [showGenFill, setShowGenFill] = useState(false)
    const [genPrompt, setGenPrompt] = useState('')
    const [zoomLevel, setZoomLevel] = useState(100)
    const [isZKeyPressed, setIsZKeyPressed] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)

    // History & Project State
    const [history, setHistory] = useState<string[]>([])
    const [historyStep, setHistoryStep] = useState(-1)
    const [projectTitle, setProjectTitle] = useState('Untitled Design')
    const [isSelectionActive, setIsSelectionActive] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
    const [showMagicSwitch, setShowMagicSwitch] = useState(false)
    const isHandlingHistory = useRef(false)

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile) setIsRightPanelOpen(false)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Sidebar Resizing Logic
    const [rightPanelWidth, setRightPanelWidth] = useState(300)
    const isResizing = useRef(false)
    const sidebarRef = useRef<HTMLDivElement>(null)

    const startResizing = React.useCallback(() => {
        isResizing.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [])

    const stopResizing = React.useCallback(() => {
        isResizing.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }, [])

    const resize = React.useCallback((e: MouseEvent) => {
        if (isResizing.current) {
            const newWidth = window.innerWidth - e.clientX
            if (newWidth > 250 && newWidth < 600) { // Min and Max width constraints
                setRightPanelWidth(newWidth)
            }
        }
    }, [])

    useEffect(() => {
        window.addEventListener('mousemove', resize)
        window.addEventListener('mouseup', stopResizing)
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [resize, stopResizing])

    // Load Custom Assets & Recent Project
    useEffect(() => {
        const savedAssets = localStorage.getItem('bolt_architect_assets')
        if (savedAssets) {
            try {
                setCustomAssets(JSON.parse(savedAssets))
            } catch (e) {
                console.error("Failed to load assets", e)
            }
        }

        const savedProject = localStorage.getItem('bolt_architect_recent')
        if (savedProject) {
            try {
                const parsed = JSON.parse(savedProject)
                setRecentProject(parsed)
            } catch (e) {
                console.error("Failed to load recent project", e)
            }
        }
    }, [])

    const syncLayers = React.useCallback(() => {
        if (!fabricCanvas.current) return;
        const objects = fabricCanvas.current.getObjects() || [];
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
    }, []);

    // Global Fabric Performance Settings
    useEffect(() => {
        (fabric as any).util.objectCaching = true;
    }, []);

    // Auto-Save & History Handlers
    const saveCanvas = React.useCallback(() => {
        if (!fabricCanvas.current) return;
        const json = (fabricCanvas.current as any).toJSON(['_layerId', 'name', 'locked', 'selectable', 'evented']);
        // Add preview image
        const preview = fabricCanvas.current.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.2 });
        const projectData = {
            json,
            preview,
            timestamp: Date.now(),
            dimensions
        };
        localStorage.setItem('bolt_architect_recent', JSON.stringify(projectData));
    }, [dimensions]);

    const saveHistory = React.useCallback(() => {
        if (!fabricCanvas.current || isHandlingHistory.current) return;
        const json = JSON.stringify((fabricCanvas.current as any).toJSON(['_layerId', 'name', 'locked', 'selectable', 'evented']));
        setHistory(prev => {
            const newHistory = prev.slice(0, historyStep + 1);
            newHistory.push(json);
            // Limit history to 50 steps
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryStep(prev => Math.min(prev + 1, 49));
    }, [historyStep]);

    // Auto-Save Canvas
    useEffect(() => {
        if (view !== 'editor' || !fabricCanvas.current) return;

        const canvas = fabricCanvas.current;
        canvas.on('object:modified', saveCanvas);
        canvas.on('object:added', saveCanvas);
        canvas.on('object:removed', saveCanvas);

        canvas.on('object:added', saveHistory);
        canvas.on('object:removed', saveHistory);
        canvas.on('object:modified', saveHistory);

        // Auto-save every 30 seconds as backup
        const interval = setInterval(saveCanvas, 30000);

        return () => {
            canvas.off('object:modified', saveCanvas);
            canvas.off('object:added', saveCanvas);
            canvas.off('object:removed', saveCanvas);
            canvas.off('object:added', saveHistory);
            canvas.off('object:removed', saveHistory);
            canvas.off('object:modified', saveHistory);
            clearInterval(interval);
        };
    }, [view, saveCanvas, saveHistory])

    const undo = () => {
        if (historyStep > 0 && fabricCanvas.current) {
            isHandlingHistory.current = true;
            const prevStep = historyStep - 1;
            fabricCanvas.current.loadFromJSON(history[prevStep], () => {
                fabricCanvas.current?.requestRenderAll();
                setHistoryStep(prevStep);
                isHandlingHistory.current = false;
                toast.info("Undo");
            });
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1 && fabricCanvas.current) {
            isHandlingHistory.current = true;
            const nextStep = historyStep + 1;
            fabricCanvas.current.loadFromJSON(history[nextStep], () => {
                fabricCanvas.current?.requestRenderAll();
                setHistoryStep(nextStep);
                isHandlingHistory.current = false;
                toast.info("Redo");
            });
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) redo();
                else undo();
                e.preventDefault();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                redo();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyStep])

    const loadRecentProject = () => {
        if (!recentProject) return;
        setDimensions(recentProject.dimensions);
        setView('editor');
        // The canvas initialization effect will run next. We need a way to load data AFTER init.
        // We'll use a ref or specific effect for this.
        setTimeout(() => {
            if (fabricCanvas.current && recentProject.json) {
                fabricCanvas.current.loadFromJSON(recentProject.json, () => {
                    fabricCanvas.current?.requestRenderAll();
                    toast.success("Resumed previous session");
                });
            }
        }, 500); // Small delay to ensure canvas is ready
    };


    useEffect(() => {
        if (view === 'editor' && canvasRef.current && !fabricCanvas.current) {
            fabricCanvas.current = new (fabric as any).Canvas(canvasRef.current, {
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: 'transparent', // Ensure transparency
                preserveObjectStacking: true,
                renderOnAddRemove: true,
                stopContextMenu: false, // Allow default context menu event to propagate (for React Context Menu)
                fireRightClick: true, // Enable right-click events
            });

            // Performance optimizations
            if (fabricCanvas.current) {
                fabricCanvas.current.enableRetinaScaling = false; // Disable retina for 60fps on mobile
            }


            // Sync Layers UI
            syncLayers();

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
                        textAlign: (activeObj as any).textAlign || 'left',
                        zIndex: fabricCanvas.current?.getObjects().indexOf(activeObj) || 0,
                        isLocked: !activeObj.selectable
                    });
                } else {
                    setSelectedLayerId(null);
                }
            };

            fabricCanvas.current?.on('object:added', syncLayers);
            fabricCanvas.current?.on('object:removed', syncLayers);
            fabricCanvas.current?.on('object:modified', syncLayers);

            fabricCanvas.current?.on('selection:created', () => {
                setShowGenFill(true);
                setIsSelectionActive(true);
                syncSelection();
            });
            fabricCanvas.current?.on('selection:updated', () => {
                setIsSelectionActive(true);
                syncSelection();
            });
            fabricCanvas.current?.on('selection:cleared', () => {
                setShowGenFill(false);
                setIsSelectionActive(false);
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


    // Tool Logic Effect
    useEffect(() => {
        if (!fabricCanvas.current) return;

        const canvas = fabricCanvas.current;
        canvas.isDrawingMode = activeTool === 'brush' || activeTool === 'eraser';

        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush = new (fabric as any).PencilBrush(canvas);
            if (canvas.freeDrawingBrush) {
                canvas.freeDrawingBrush.width = activeTool === 'eraser' ? 30 : (selectedObjectProps.strokeWidth || 5);
                canvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : (selectedObjectProps.fill || '#000000');
                if (activeTool === 'eraser') {
                    canvas.freeDrawingBrush.shadow = new (fabric as any).Shadow({
                        blur: 0,
                        offsetX: 0,
                        offsetY: 0,
                        color: 'transparent'
                    });
                }
            }
        }

        // Pen Tool (Point-to-Point Vector Path)
        if (activeTool === 'pen') {
            let points: any[] = [];
            let currentPath: any = null;

            const onMouseDown = (o: any) => {
                const pointer = canvas.getScenePoint(o.e);
                points.push(pointer);

                if (points.length === 1) {
                    currentPath = new (fabric as any).Path(`M ${pointer.x} ${pointer.y}`, {
                        fill: 'transparent',
                        stroke: '#3b82f6',
                        strokeWidth: 2,
                        selectable: true,
                        evented: true
                    });
                    canvas.add(currentPath);
                } else {
                    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    currentPath.set({ path: (fabric as any).util.parsePath(pathData) });
                    canvas.requestRenderAll();
                }

                // Close path if clicking near start
                if (points.length > 2) {
                    const start = points[0];
                    const dist = Math.sqrt(Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2));
                    if (dist < 20) {
                        points.pop();
                        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                        currentPath.set({
                            path: (fabric as any).util.parsePath(pathData),
                            fill: 'rgba(59, 130, 246, 0.2)'
                        });
                        points = [];
                        toast.success("Path closed");
                        canvas.requestRenderAll();
                    }
                }
            };

            canvas.on('mouse:down', onMouseDown);
            return () => {
                canvas.off('mouse:down', onMouseDown);
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

        // Lasso Tool (Freehand selection)
        if (activeTool === 'lasso') {
            let points: any[] = [];
            let lassoPath: any = null;

            const onMouseDown = (o: any) => {
                const pointer = canvas.getScenePoint(o.e);
                points = [pointer];
                lassoPath = new (fabric as any).Path(`M ${pointer.x} ${pointer.y}`, {
                    fill: 'rgba(59, 130, 246, 0.1)',
                    stroke: '#3b82f6',
                    strokeWidth: 1,
                    strokeDashArray: [5, 5],
                    selectable: false,
                    evented: false
                });
                canvas.add(lassoPath);
            };

            const onMouseMove = (o: any) => {
                if (!lassoPath) return;
                const pointer = canvas.getScenePoint(o.e);
                points.push(pointer);
                const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                lassoPath.set({ path: (fabric as any).util.parsePath(pathData + ' Z') });
                canvas.requestRenderAll();
            };

            const onMouseUp = () => {
                if (!lassoPath) return;
                // Simplified selection: just keep the path for now
                toast.success("Lasso selection captured");
                canvas.remove(lassoPath);
                lassoPath = null;
                points = [];
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

        // Magic Wand Tool (Simplified)
        if (activeTool === 'magic') {
            const onMouseDown = (o: any) => {
                const target = canvas.findTarget(o.e) as any;
                if (target) {
                    canvas.setActiveObject(target);
                    toast.success(`Magic Wand: Selected ${target.type}`);
                } else {
                    toast.info("Magic Wand: No object found at point");
                }
            };
            canvas.on('mouse:down', onMouseDown);
            return () => canvas.off('mouse:down', onMouseDown);
        }

        // Marquee Tool (Visual selection)
        if (activeTool === 'marquee') {
            let rect: any = null;
            let startPointer: any = null;

            const onMouseDown = (o: any) => {
                startPointer = canvas.getScenePoint(o.e);
                rect = new (fabric as any).Rect({
                    left: startPointer.x,
                    top: startPointer.y,
                    width: 0,
                    height: 0,
                    fill: 'rgba(59, 130, 246, 0.1)',
                    stroke: '#3b82f6',
                    strokeWidth: 1,
                    strokeDashArray: [5, 5],
                    selectable: false,
                    evented: false
                });
                canvas.add(rect);
            };

            const onMouseMove = (o: any) => {
                if (!rect) return;
                const pointer = canvas.getScenePoint(o.e);
                rect.set({
                    width: Math.abs(pointer.x - startPointer.x),
                    height: Math.abs(pointer.y - startPointer.y),
                    left: Math.min(pointer.x, startPointer.x),
                    top: Math.min(pointer.y, startPointer.y)
                });
                canvas.renderAll();
            };

            const onMouseUp = () => {
                if (!rect) return;
                const objects = canvas.getObjects().filter((obj: any) =>
                    obj !== rect && obj.intersectsWithObject(rect)
                );
                canvas.remove(rect);
                if (objects.length > 0) {
                    const selection = new (fabric as any).ActiveSelection(objects, { canvas });
                    canvas.setActiveObject(selection);
                    setShowGenFill(true);
                }
                rect = null;
                canvas.renderAll();
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

        // Stamp Tool (Duplicate on Click)
        if (activeTool === 'stamp') {
            const onMouseDown = (o: any) => {
                const activeObj = canvas.getActiveObject();
                if (activeObj) {
                    const pointer = canvas.getScenePoint(o.e);
                    activeObj.clone().then((cloned: any) => {
                        cloned.set({
                            left: pointer.x,
                            top: pointer.y,
                            originX: 'center',
                            originY: 'center'
                        });
                        canvas.add(cloned);
                        canvas.renderAll();
                    });
                }
            };
            canvas.on('mouse:down', onMouseDown);
            return () => canvas.off('mouse:down', onMouseDown);
        }

        // Selection Logic
        canvas.selection = activeTool === 'move';
        canvas.forEachObject(obj => {
            obj.selectable = activeTool === 'move';
        });

        canvas.renderAll();
    }, [activeTool, selectedObjectProps.fill, selectedObjectProps.strokeWidth])

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

    // Placeholder for handleZoom functions
    const handleZoom = (type: 'in' | 'out' | 'fit' | '100') => {
        if (!fabricCanvas.current) return;
        const canvas = fabricCanvas.current;
        let newZoomLevel = zoomLevel;

        switch (type) {
            case 'in':
                newZoomLevel = Math.min(zoomLevel + 10, 300);
                break;
            case 'out':
                newZoomLevel = Math.max(zoomLevel - 10, 10);
                break;
            case '100':
                newZoomLevel = 100;
                break;
            case 'fit':
                // Simple fit: scale to fit canvas width
                const scaleX = canvas.width / dimensions.width;
                const scaleY = canvas.height / dimensions.height;
                newZoomLevel = Math.min(scaleX, scaleY) * 100;
                break;
        }

        setZoomLevel(newZoomLevel);
        canvas.setZoom(newZoomLevel / 100);
        canvas.requestRenderAll();
        toast.success(`Zoom: ${Math.round(newZoomLevel)}%`);
    };

    // Keyboard Shortcuts (Same as original but verified)
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
                setZoomLevel((prev: number) => {
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
                setZoomLevel((prev: number) => {
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

            if (e.key === 'z' && !e.ctrlKey && !e.metaKey) {
                setIsZKeyPressed(true);
            }

            // Delete functionality - Only Delete key, NOT Backspace
            if (e.key === 'Delete') {
                const activeObjects = fabricCanvas.current?.getActiveObjects();
                if (activeObjects?.length) {
                    activeObjects.forEach((obj: any) => fabricCanvas.current?.remove(obj));
                    fabricCanvas.current?.discardActiveObject();
                    fabricCanvas.current?.renderAll();
                    toast.success("Deleted selected object(s)");
                }
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

            setZoomLevel((prev: any) => {
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


    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (f) => {
                const data = f.target?.result as string;
                if (view === 'editor' && fabricCanvas.current) {
                    (fabric as any).FabricImage.fromURL(data).then((img: any) => {
                        // Dynamic scaling
                        const targetWidth = dimensions.width * 0.5;
                        if (img.width > targetWidth) {
                            img.scaleToWidth(targetWidth);
                        }
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



    const handleSelectAll = () => {
        if (!fabricCanvas.current) return;
        fabricCanvas.current.discardActiveObject();
        const sel = new (fabric as any).ActiveSelection(fabricCanvas.current.getObjects(), {
            canvas: fabricCanvas.current,
        });
        fabricCanvas.current.setActiveObject(sel);
        fabricCanvas.current.requestRenderAll();
        toast.info("Selected all objects");
    };

    const handleDeselect = () => {
        if (!fabricCanvas.current) return;
        fabricCanvas.current.discardActiveObject();
        fabricCanvas.current.requestRenderAll();
        toast.info("Deselected all");
    };

    const handleGroup = () => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject() as any;
        if (!activeObj || activeObj.type !== 'activeSelection') {
            toast.error("Select multiple objects to group");
            return;
        }
        activeObj.toGroup();
        fabricCanvas.current.requestRenderAll();
        saveHistory();
        toast.success("Grouped objects");
    };

    const handleUngroup = () => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject() as any;
        if (!activeObj || activeObj.type !== 'group') {
            toast.error("Select a group to ungroup");
            return;
        }
        activeObj.toActiveSelection();
        fabricCanvas.current.requestRenderAll();
        saveHistory();
        toast.success("Ungrouped objects");
    };

    const handleLock = () => {
        if (!fabricCanvas.current) return;
        const activeObjects = fabricCanvas.current.getActiveObjects();
        activeObjects.forEach(obj => {
            obj.set({
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                hasControls: false,
                selectable: false,
                evented: true,
                locked: true
            } as any);
        });
        fabricCanvas.current.discardActiveObject();
        fabricCanvas.current.requestRenderAll();
        saveHistory();
        setSelectedObjectProps((prev: any) => ({ ...prev, isLocked: true }));
        toast.success("Locked selected objects");
    };

    const handleUnlock = () => {
        if (!fabricCanvas.current) return;
        const objects = fabricCanvas.current.getObjects();
        objects.forEach(obj => {
            if ((obj as any).locked) {
                obj.set({
                    lockMovementX: false,
                    lockMovementY: false,
                    lockRotation: false,
                    lockScalingX: false,
                    lockScalingY: false,
                    hasControls: true,
                    selectable: true,
                    locked: false
                } as any);
            }
        });
        fabricCanvas.current.requestRenderAll();
        saveHistory();
        setSelectedObjectProps((prev: any) => ({ ...prev, isLocked: false }));
        toast.success("Unlocked all objects");
    };

    const handleZIndexChange = (value: number) => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject();
        if (activeObj) {
            fabricCanvas.current.moveObjectTo(activeObj, value);
            fabricCanvas.current.requestRenderAll();
            saveHistory();
        }
    };

    const handleAddText = (type: 'heading' | 'body') => {
        if (!fabricCanvas.current) return;
        const text = new (fabric as any).Textbox(type === 'heading' ? 'Add Heading' : 'Add Body Text', {
            left: 100,
            top: 100,
            fontSize: type === 'heading' ? 40 : 20,
            fontWeight: type === 'heading' ? 'bold' : 'normal',
            fontFamily: 'Inter, sans-serif',
            fill: '#000000',
            width: 300,
            _layerId: Math.random(),
        });
        fabricCanvas.current.add(text);
        fabricCanvas.current.setActiveObject(text);
        fabricCanvas.current.requestRenderAll();
        saveHistory();
    };

    const handleSaveToAssets = () => {
        const activeObj = fabricCanvas.current?.getActiveObject();
        if (activeObj) {
            const dataURL = activeObj.toDataURL({ format: 'png', multiplier: 2 });
            setCustomAssets(prev => [...prev, dataURL]);
            toast.success("Saved to assets");
        }
    };

    const handleDeleteAsset = (index: number) => {
        setCustomAssets(prev => prev.filter((_, i) => i !== index));
        toast.info("Asset removed");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !fabricCanvas.current) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const data = f.target?.result;
            (fabric as any).FabricImage.fromURL(data as string).then((img: any) => {
                img.set({
                    _layerId: Math.random()
                });
                img.scaleToWidth(300);
                fabricCanvas.current?.add(img);
                fabricCanvas.current?.centerObject(img);
                fabricCanvas.current?.requestRenderAll();
                saveHistory();
                toast.success("Image added to canvas");
            });
        };
        reader.readAsDataURL(file);
    };

    const handleBringToFront = () => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject();
        if (activeObj) {
            fabricCanvas.current.bringObjectToFront(activeObj);
            fabricCanvas.current.requestRenderAll();
            saveHistory();
            toast.success("Brought to front");
        }
    };

    const handleSendToBack = () => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject();
        if (activeObj) {
            fabricCanvas.current.sendObjectToBack(activeObj);
            fabricCanvas.current.requestRenderAll();
            saveHistory();
            toast.success("Sent to back");
        }
    };

    const handleBringForward = () => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject();
        if (activeObj) {
            fabricCanvas.current.bringObjectForward(activeObj);
            fabricCanvas.current.requestRenderAll();
            saveHistory();
            toast.success("Brought forward");
        }
    };

    const handleSendBackward = () => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject();
        if (activeObj) {
            fabricCanvas.current.sendObjectBackwards(activeObj);
            fabricCanvas.current.requestRenderAll();
            saveHistory();
            toast.success("Sent backward");
        }
    };

    const handleDuplicate = () => {
        if (!fabricCanvas.current) return;
        const activeObj = fabricCanvas.current.getActiveObject();
        if (activeObj) {
            activeObj.clone().then((cloned: any) => {
                fabricCanvas.current?.discardActiveObject();
                cloned.set({
                    left: cloned.left + 20,
                    top: cloned.top + 20,
                    evented: true,
                });
                if (cloned.type === 'activeSelection') {
                    cloned.canvas = fabricCanvas.current;
                    cloned.forEachObject((obj: any) => {
                        fabricCanvas.current?.add(obj);
                    });
                    cloned.setCoords();
                } else {
                    fabricCanvas.current?.add(cloned);
                }
                cloned._layerId = Math.random();
                fabricCanvas.current?.setActiveObject(cloned);
                fabricCanvas.current?.requestRenderAll();
                saveHistory();
                toast.success("Duplicated object");
            });
        }
    };

    const handleExport = (format: 'png' | 'jpg', upscale = false) => {
        if (!fabricCanvas.current) return;
        const canvas = fabricCanvas.current;
        const objects = canvas.getObjects();
        if (objects.length === 0) {
            toast.error("Nothing to export");
            return;
        }
        const activeSelection = new (fabric as any).ActiveSelection(objects, { canvas });
        const bounds = activeSelection.getBoundingRect();
        activeSelection.destroy();
        const multiplier = upscale ? 4 : 2;
        const dataURL = canvas.toDataURL({
            format: format === 'png' ? 'png' : 'jpeg',
            quality: 1,
            multiplier: multiplier,
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            enableRetinaScaling: false
        });
        const link = document.createElement('a');
        link.download = `architect-export-${upscale ? 'upscaled' : 'standard'}.${format}`;
        link.href = dataURL;
        link.click();
        toast.success(`Exported as ${format.toUpperCase()}`);
    };

    const deleteSelectedObject = () => {
        const activeObjects = fabricCanvas.current?.getActiveObjects();
        if (activeObjects?.length) {
            activeObjects.forEach((obj: any) => fabricCanvas.current?.remove(obj));
            fabricCanvas.current?.discardActiveObject();
            fabricCanvas.current?.requestRenderAll();
            saveHistory();
            toast.success("Deleted selected object(s)");
        }
    };

    const updateActiveObject = (props: any) => {
        const activeObj = fabricCanvas.current?.getActiveObject();
        if (activeObj) {
            activeObj.set(props);
            fabricCanvas.current?.requestRenderAll();
            saveHistory();
            setSelectedObjectProps((prev: any) => ({ ...prev, ...props }));
        }
    };

    const applyFilter = (type: string, value: number) => {
        const activeObj = fabricCanvas.current?.getActiveObject() as any;
        if (!activeObj || activeObj.type !== 'image') return;

        if (!activeObj.filters) activeObj.filters = [];

        let filter;
        switch (type) {
            case 'brightness':
                filter = new (fabric as any).filters.Brightness({ brightness: value });
                break;
            case 'contrast':
                filter = new (fabric as any).filters.Contrast({ contrast: value });
                break;
            case 'saturation':
                filter = new (fabric as any).filters.Saturation({ saturation: value });
                break;
        }

        if (filter) {
            const existingIndex = activeObj.filters.findIndex((f: any) => f.type.toLowerCase() === type.toLowerCase());
            if (existingIndex > -1) activeObj.filters.splice(existingIndex, 1);

            activeObj.filters.push(filter);
            activeObj.applyFilters();
            fabricCanvas.current?.renderAll();
            saveHistory();
            setSelectedObjectProps((prev: any) => ({ ...prev, [type]: value }));
        }
    };


    const toggleLayerVisibility = (id: any) => {
        const obj = fabricCanvas.current?.getObjects().find((o: any) => o._layerId === id);
        if (obj) {
            obj.set({ visible: !obj.visible });
            fabricCanvas.current?.requestRenderAll();
            syncLayers();
        }
    };

    const toggleLayerLock = (id: any) => {
        const obj = fabricCanvas.current?.getObjects().find((o: any) => o._layerId === id);
        if (obj) {
            obj.set({ selectable: !obj.selectable, evented: !obj.selectable, locked: !obj.selectable });
            fabricCanvas.current?.requestRenderAll();
            syncLayers();
        }
    };

    const handleLayerDelete = (id: any) => {
        const obj = fabricCanvas.current?.getObjects().find((o: any) => o._layerId === id);
        if (obj) {
            fabricCanvas.current?.remove(obj);
            fabricCanvas.current?.requestRenderAll();
            saveHistory();
            syncLayers();
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
            (activeObj as any).set({ globalCompositeOperation: cssToFabric[mode] || 'source-over' });
            fabricCanvas.current?.requestRenderAll();
            saveHistory();
        }
    };

    const handleRemoveBackground = async () => {
        const activeObj = fabricCanvas.current?.getActiveObject();
        if (!activeObj || activeObj.type !== 'image') {
            toast.error("Select an image to remove background");
            return;
        }

        const toastId = toast.loading("Removing background...");
        try {
            const imgElement = (activeObj as any).getElement();
            const blob = await removeBackground(imgElement);
            const url = URL.createObjectURL(blob);

            (fabric as any).FabricImage.fromURL(url).then((newImg: any) => {
                newImg.set({
                    left: activeObj.left,
                    top: activeObj.top,
                    scaleX: activeObj.scaleX,
                    scaleY: activeObj.scaleY,
                    angle: activeObj.angle,
                    _layerId: Math.random()
                });
                fabricCanvas.current?.remove(activeObj);
                fabricCanvas.current?.add(newImg);
                fabricCanvas.current?.setActiveObject(newImg);
                fabricCanvas.current?.requestRenderAll();
                saveHistory();
                toast.dismiss(toastId);
                toast.success("Background removed!");
            });
        } catch (error) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Failed to remove background");
        }
    };

    const handleCrop = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        const activeObj = canvas.getActiveObject() as any;
        if (!activeObj || activeObj.type !== 'image') {
            toast.error("Select an image to crop");
            return;
        }
        if (activeObj.clipPath) {
            activeObj.set({ clipPath: null });
            canvas.requestRenderAll();
            toast.success("Crop removed");
        } else {
            const clipRect = new (fabric as any).Rect({
                width: activeObj.width / 2,
                height: activeObj.height / 2,
                top: -activeObj.height / 4,
                left: -activeObj.width / 4,
                absolutePositioned: false
            });
            activeObj.set({ clipPath: clipRect });
            canvas.requestRenderAll();
            toast.success("Crop applied");
        }
    };

    const handleAddAIImage = (url: string) => {
        if (!fabricCanvas.current) return;
        (fabric as any).FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img: any) => {
            const targetWidth = dimensions.width * 0.5;
            if (img.width > targetWidth) img.scaleToWidth(targetWidth);
            img.set({ _layerId: Math.random() });
            fabricCanvas.current?.add(img);
            fabricCanvas.current?.centerObject(img);
            fabricCanvas.current?.requestRenderAll();
            saveHistory();
            toast.success("AI Image added");
        });
    };

    const handleResize = (preset: { label: string, w: number, h: number }) => {
        if (!fabricCanvas.current) return;
        const oldW = dimensions.width;
        const oldH = dimensions.height;
        const newW = preset.w;
        const newH = preset.h;
        const scaleX = newW / oldW;
        const scaleY = newH / oldH;
        const scaleFactor = Math.min(scaleX, scaleY);
        setDimensions({ width: newW, height: newH });
        const canvas = fabricCanvas.current;
        canvas.setDimensions({ width: newW, height: newH });
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
        canvas.requestRenderAll();
        saveHistory();
        setShowMagicSwitch(false);
        toast.success(`Resized to ${preset.label}`);
    }

    const handleGenerativeFill = () => {
        toast.promise(new Promise(r => setTimeout(r, 1500)), {
            loading: 'Generating fill...',
            success: 'Generative fill applied!',
            error: 'AI failed'
        });
        setShowGenFill(false);
        setGenPrompt('');
    };

    const handleTextToVector = () => {
        toast.info("Text to Vector feature coming soon");
    };

    const handleDataToViz = () => {
        toast.info("Data to Viz feature coming soon");
    };


    if (view === 'editor') {
        function setShowMagicSwitch(arg0: boolean): void {
            throw new Error('Function not implemented.')
        }

        return (
            <div className="fixed inset-0 bg-[#1e1e1e] text-[#b4b4b4] flex flex-col font-sans select-none overflow-hidden">
                <TopBar
                    view={view}
                    zoomLevel={zoomLevel}
                    onZoomChange={setZoomLevel}
                    layers={layers}
                    selectedLayerId={selectedLayerId}
                    onViewChange={setView}
                    onExport={handleExport}
                    onAddImage={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => handleImageUpload(e);
                        input.click();
                    }}
                    onMagicSwitch={() => setShowMagicSwitch(true)}
                    onSelectAll={handleSelectAll}
                    onDeselect={handleDeselect}
                    onGroup={handleGroup}
                    onUngroup={handleUngroup}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                    onAddText={handleAddText}
                    onToggleLayerPanel={() => {
                        setActivePanel('properties')
                        setIsRightPanelOpen(true)
                    }}
                    onToggleAssetsPanel={() => {
                        setActivePanel('assets')
                        setIsRightPanelOpen(true)
                    }}
                    onUndo={undo}
                    onRedo={redo}
                    isMobile={isMobile}
                />

                <SidebarProvider className="flex-1 min-h-0 overflow-hidden" defaultOpen={!isMobile}>
                    {!isMobile && (
                        <Toolbar
                            activeTool={activeTool}
                            setActiveTool={setActiveTool}
                            showTemplates={showTemplates}
                            onToggleTemplates={() => setShowTemplates(!showTemplates)}
                        />
                    )}

                    {activePanel === 'assets' && (
                        <SidebarInset className="w-80 border-r border-black/40 flex-none bg-[#2d2d2d] z-20">
                            <div className="p-4">
                                <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-zinc-500">Assets</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {customAssets.map((asset, i) => (
                                        <div key={i} className="group relative aspect-square bg-black/20 rounded border border-white/5 overflow-hidden hover:border-blue-500/50 transition-colors">
                                            <img src={asset} className="w-full h-full object-contain" alt="" />
                                            <button onClick={() => handleDeleteAsset(i)} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} className="text-white" /></button>
                                            <button
                                                onClick={() => {
                                                    (fabric as any).FabricImage.fromURL(asset).then((img: any) => {
                                                        img.scaleToWidth(150);
                                                        fabricCanvas.current?.add(img);
                                                        fabricCanvas.current?.centerObject(img);
                                                        fabricCanvas.current?.requestRenderAll();
                                                        saveHistory();
                                                    });
                                                }}
                                                className="absolute inset-x-0 bottom-0 py-1 bg-blue-600/80 text-[8px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity uppercase"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SidebarInset>
                    )}

                    <TemplateSidebar
                        isOpen={showTemplates}
                        onClose={() => setShowTemplates(false)}
                        onSelectTemplate={(template: any) => {
                            setDimensions({ width: template.width, height: template.height });
                            if (fabricCanvas.current) {
                                fabricCanvas.current.setDimensions({ width: template.width, height: template.height });
                            }
                            toast.success(`Template applied: ${template.name}`);
                        }}
                        fabricCanvasRef={fabricCanvas}
                    />

                    <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] overflow-hidden">
                        <div className="flex-1 flex min-h-0 overflow-hidden relative">
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                                <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-[#1e1e1e] px-4 transition-all ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 relative z-20">
                                    <div className="flex items-center gap-2">
                                        <SidebarTrigger className="-ml-1" />
                                        <Separator className="mr-2 h-4" />
                                        <Breadcrumb>
                                            <BreadcrumbList>
                                                <BreadcrumbItem className="hidden md:block">
                                                    <BreadcrumbLink href="#">Project</BreadcrumbLink>
                                                </BreadcrumbItem>
                                                <BreadcrumbSeparator className="hidden md:block" />
                                                <BreadcrumbItem>
                                                    <Input
                                                        value={projectTitle}
                                                        onChange={(e) => setProjectTitle(e.target.value)}
                                                        className="h-6 bg-transparent border-none text-white focus:ring-0 px-0 w-auto min-w-[100px] font-bold"
                                                    />
                                                </BreadcrumbItem>
                                            </BreadcrumbList>
                                        </Breadcrumb>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                                        <div className="text-xs text-zinc-500 font-mono">
                                            {dimensions.width} x {dimensions.height}
                                        </div>
                                    </div>
                                    {activeTool === 'select' && (
                                        <div className="ml-auto flex items-center gap-4 text-xs font-medium text-zinc-400">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="w-3 h-3 bg-zinc-800 border-none rounded" checked readOnly />
                                                <span>Auto-Select</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="w-3 h-3 bg-zinc-800 border-none rounded" />
                                                <span>Show Transform Controls</span>
                                            </label>
                                        </div>
                                    )}
                                </header>

                                <div className="h-10 bg-[#252525] border-b border-black/40 flex items-center justify-between px-4 shrink-0 overflow-x-auto no-scrollbar">
                                    <div className="flex items-center gap-1 min-w-fit">
                                        <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/5 mr-2">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => handleZoom('out')}><Minus size={14} /></Button>
                                            <div className="w-[1px] h-3 bg-white/10 mx-1" />
                                            <span className="text-[10px] font-mono w-10 text-center text-zinc-300 font-bold">{Math.round(zoomLevel)}%</span>
                                            <div className="w-[1px] h-3 bg-white/10 mx-1" />
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => handleZoom('in')}><Plus size={14} /></Button>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg" onClick={() => handleZoom('fit')} title="Zoom to Fit"><Monitor size={14} /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg" onClick={() => handleZoom('100')} title="Actual Size (100%)"><Square size={14} /></Button>
                                        </div>
                                        <div className="w-[1px] h-4 bg-white/5 mx-2 hidden sm:block" />
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setView('blank-setup')} className="h-7 text-[10px] text-zinc-400 hover:text-white px-2 rounded-md hover:bg-white/5 flex items-center gap-1">
                                                <Layout size={12} />
                                                <span>Resize Canvas</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-fit">
                                        {isSelectionActive && (
                                            <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded-lg p-0.5 px-2 animate-in fade-in">
                                                <Sparkles size={12} className="text-blue-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Object Active</span>
                                            </div>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                                            className={cn(
                                                "h-8 text-[10px] uppercase font-black tracking-widest px-3 rounded-lg flex items-center gap-2",
                                                isRightPanelOpen ? "bg-blue-600/10 text-blue-400" : "text-zinc-400 hover:bg-white/5"
                                            )}
                                        >
                                            <LayersIcon size={14} />
                                            <span className="hidden sm:inline">Inspect</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto bg-[#1a1a1a] custom-scrollbar selection:bg-none relative h-full">
                                    <div className="min-h-full min-w-full inline-flex items-center justify-center p-20">
                                        <CustomContextMenu
                                            onBringToFront={handleBringToFront}
                                            onSendToBack={handleSendToBack}
                                            onBringForward={handleBringForward}
                                            onSendBackward={handleSendBackward}
                                            onDuplicate={handleDuplicate}
                                            onDelete={deleteSelectedObject}
                                            onLock={handleLock}
                                            onUnlock={handleUnlock}
                                            isLocked={selectedObjectProps.isLocked || false}
                                            zIndex={selectedObjectProps.zIndex || 0}
                                            onZIndexChange={handleZIndexChange}
                                            onRemoveBackground={handleRemoveBackground}
                                            onSaveToAssets={handleSaveToAssets}
                                            onCopy={() => {
                                                const activeObj = fabricCanvas.current?.getActiveObject();
                                                if (activeObj) {
                                                    activeObj.clone().then((cloned: any) => {
                                                        (window as any)._clipboard = cloned;
                                                    });
                                                    toast.success("Copied to clipboard");
                                                }
                                            }}
                                            onPaste={() => {
                                                if ((window as any)._clipboard) {
                                                    (window as any)._clipboard.clone().then((clonedObj: any) => {
                                                        fabricCanvas.current?.discardActiveObject();
                                                        clonedObj.set({
                                                            left: clonedObj.left + 10,
                                                            top: clonedObj.top + 10,
                                                            evented: true,
                                                            _layerId: Math.random()
                                                        });
                                                        if (clonedObj.type === 'activeSelection') {
                                                            clonedObj.canvas = fabricCanvas.current;
                                                            clonedObj.forEachObject((obj: any) => {
                                                                fabricCanvas.current?.add(obj);
                                                            });
                                                            clonedObj.setCoords();
                                                        } else {
                                                            fabricCanvas.current?.add(clonedObj);
                                                        }
                                                        fabricCanvas.current?.setActiveObject(clonedObj);
                                                        fabricCanvas.current?.requestRenderAll();
                                                        toast.success("Pasted");
                                                    });
                                                }
                                            }}
                                            onGroup={handleGroup}
                                            onUngroup={handleUngroup}
                                        >
                                            <div className="shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-black/50 bg-white">
                                                <canvas ref={canvasRef} />
                                            </div>
                                        </CustomContextMenu>
                                    </div>
                                </div>
                            </div>

                            {!isMobile && isRightPanelOpen && (
                                <div onMouseDown={startResizing} className="w-1 bg-black/50 border-l border-white/5 hover:bg-transparent hover:border-blue-500 cursor-col-resize transition-colors z-30" />
                            )}

                            {isRightPanelOpen && (
                                <div style={{ width: isMobile ? '100%' : rightPanelWidth }} className={cn("h-full bg-[#2d2d2d] shrink-0 z-40 transition-all", isMobile && "fixed inset-0 pt-8")}>
                                    {isMobile && <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white z-50 h-8 w-8 bg-black/20 rounded-full" onClick={() => setIsRightPanelOpen(false)}><X className="rotate-45" size={20} /></Button>}
                                    <RightPanel
                                        activePanel={activePanel}
                                        setActivePanel={setActivePanel}
                                        selectedObjectProps={selectedObjectProps}
                                        updateActiveObject={updateActiveObject}
                                        applyFilter={applyFilter}
                                        fabricCanvasRef={fabricCanvas}
                                        handleClippingMask={handleClippingMask}
                                        layers={layers}
                                        selectedLayerId={selectedLayerId}
                                        onLayerSelect={(id) => {
                                            const obj = fabricCanvas.current?.getObjects().find((o: any) => o._layerId === id);
                                            if (obj) {
                                                fabricCanvas.current?.setActiveObject(obj);
                                                fabricCanvas.current?.requestRenderAll();
                                                setSelectedLayerId(id);
                                            }
                                        }}
                                        onLayerToggle={toggleLayerVisibility}
                                        onLayerLock={toggleLayerLock}
                                        onLayerDelete={handleLayerDelete}
                                        onBlendModeChange={handleBlendModeChange}
                                        onAddAIImage={handleAddAIImage}
                                        customAssets={customAssets}
                                        onDeleteAsset={handleDeleteAsset}
                                        isSelectionActive={isSelectionActive}
                                        onTextToVector={handleTextToVector}
                                        onDataToViz={handleDataToViz}
                                        isMobile={isMobile}
                                    />
                                </div>
                            )}
                        </div>
                    </SidebarInset>
                </SidebarProvider>

                <MagicSwitch isOpen={showMagicSwitch} onClose={() => setShowMagicSwitch(false)} onResize={handleResize} />
            </div>
        )
    }

    // Default Gateway View
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-8 selection:bg-blue-500/30">
            <GatewayModal
                view={view}
                setView={setView}
                dimensions={dimensions}
                setDimensions={setDimensions}
                handleFileUpload={handleFileUpload}
                fileInputRef={fileInputRef}
                recentProject={recentProject}
                onLoadRecent={loadRecentProject}
            />
        </div>
    )
}

