"use client"

import React from 'react'
import {
    Undo2, Redo2, Image as ImageIcon, Sparkles, Download, Save,
    Monitor, Square, Plus, LogOut, Layers, Type, MousePointer2, Filter, Layout
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'

interface TopBarProps {
    view?: 'choice' | 'blank-setup' | 'editor'
    zoomLevel: number
    onZoomChange: (zoom: number) => void
    layers?: any[]
    selectedLayerId?: number | null
    onViewChange: (view: 'choice' | 'blank-setup' | 'editor') => void
    onExport: (format: 'png' | 'jpg', upscale?: boolean) => void
    onMagicSwitch: () => void
    onAddImage: () => void
    // New Handlers
    onSelectAll?: () => void
    onDeselect?: () => void
    onGroup?: () => void
    onUngroup?: () => void
    onLock?: () => void
    onUnlock?: () => void
    onAddText?: (type: 'heading' | 'body') => void
    onToggleLayerPanel?: () => void
    onToggleAssetsPanel?: () => void
    onUndo?: () => void
    onRedo?: () => void
    isMobile?: boolean
}

export function TopBar({
    zoomLevel,
    layers,
    selectedLayerId,
    onViewChange,
    onExport,
    onMagicSwitch,
    onAddImage,
    onSelectAll,
    onDeselect,
    onGroup,
    onUngroup,
    onLock,
    onUnlock,
    onAddText,
    onToggleLayerPanel,
    onToggleAssetsPanel,
    onUndo,
    onRedo,
    isMobile
}: TopBarProps) {
    const router = useRouter()
    const { profile } = useAuth()

    const handleExit = () => {
        if (profile?.ranks === 'Principal') {
            router.push('/PrincipalDashboard')
        } else if (profile?.ranks === 'Teacher') {
            router.push('/TeacherDashboard')
        } else {
            router.back()
        }
    }

    return (
        <div className="h-8 bg-[#2d2d2d] mt-15 border-b border-black/30 flex items-center px-2 justify-between text-[11px] font-medium z-50 relative">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExit}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 px-3 h-8 rounded-lg mr-2"
                >
                    <LogOut size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Exit</span>
                </Button>

                <div className="w-[1px] h-4 bg-white/5" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddImage}
                    className="text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-2 px-3 h-8 rounded-lg"
                >
                    <Plus size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Image</span>
                </Button>

                <div className="w-[1px] h-4 bg-white/5" />
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center mr-2">
                    <ImageIcon size={14} className="text-white" />
                </div>

                {/* File Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-zinc-300 outline-none">
                        File
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#2d2d2d] border-black/50 text-zinc-300 w-56">
                        <DropdownMenuItem onClick={() => onViewChange('choice')} className="focus:bg-blue-600 focus:text-white">
                            New... <DropdownMenuShortcut>Ctrl+N</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={() => onExport('png')} className="focus:bg-blue-600 focus:text-white">
                            Export as PNG <DropdownMenuShortcut>2x</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('jpg')} className="focus:bg-blue-600 focus:text-white">
                            Export as JPG <DropdownMenuShortcut>2x</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('png', true)} className="focus:bg-purple-600 focus:text-white text-purple-400">
                            <Sparkles size={12} className="mr-2" /> Upscale & Export <DropdownMenuShortcut>4x</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={handleExit} className="focus:bg-red-600 focus:text-white text-red-400">
                            Close / Exit
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {!isMobile && (
                    <>
                        {/* Layer Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-zinc-300 outline-none">
                                Layer
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2d2d2d] border-black/50 text-zinc-300 w-56">
                                <DropdownMenuItem onClick={onGroup} className="focus:bg-blue-600 focus:text-white">
                                    Group Objects <DropdownMenuShortcut>Ctrl+G</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onUngroup} className="focus:bg-blue-600 focus:text-white">
                                    Ungroup Objects <DropdownMenuShortcut>Ctrl+Shift+G</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={onLock} className="focus:bg-blue-600 focus:text-white">
                                    Lock Layer <DropdownMenuShortcut>Ctrl+L</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onUnlock} className="focus:bg-blue-600 focus:text-white">
                                    Unlock Layer <DropdownMenuShortcut>Ctrl+Shift+L</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Type Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-zinc-300 outline-none">
                                Type
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2d2d2d] border-black/50 text-zinc-300 w-56">
                                <DropdownMenuItem onClick={() => onAddText?.('heading')} className="focus:bg-blue-600 focus:text-white">
                                    Add Heading
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddText?.('body')} className="focus:bg-blue-600 focus:text-white">
                                    Add Body Text
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Select Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-zinc-300 outline-none">
                                Select
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2d2d2d] border-black/50 text-zinc-300 w-56">
                                <DropdownMenuItem onClick={onSelectAll} className="focus:bg-blue-600 focus:text-white">
                                    Select All <DropdownMenuShortcut>Ctrl+A</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDeselect} className="focus:bg-blue-600 focus:text-white">
                                    Deselect <DropdownMenuShortcut>Esc</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Filter Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-zinc-300 outline-none">
                                Filter
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2d2d2d] border-black/50 text-zinc-300 w-56">
                                <DropdownMenuItem className="focus:bg-blue-600 focus:text-white opacity-50 cursor-not-allowed">
                                    Blur (Coming Soon)
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-blue-600 focus:text-white opacity-50 cursor-not-allowed">
                                    Sharpen (Coming Soon)
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-blue-600 focus:text-white opacity-50 cursor-not-allowed">
                                    Grayscale (Coming Soon)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Window Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-zinc-300 outline-none">
                                Window
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2d2d2d] border-black/50 text-zinc-300 w-56">
                                <DropdownMenuItem onClick={onToggleLayerPanel} className="focus:bg-blue-600 focus:text-white">
                                    <Layers size={12} className="mr-2" /> Properties & Layers
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onToggleAssetsPanel} className="focus:bg-blue-600 focus:text-white">
                                    <ImageIcon size={12} className="mr-2" /> Assets & Resources
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}

                {/* Help Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors text-zinc-300 outline-none">
                        Help
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#2d2d2d] border-black/50 text-zinc-300 w-56">
                        <DropdownMenuItem className="focus:bg-blue-600 focus:text-white">
                            Keyboard Shortcuts
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>

            <div className="flex items-center gap-4 px-4 text-zinc-500">
                {!isMobile && (
                    <div className="flex items-center gap-2">
                        <button onClick={onUndo} className="hover:text-white transition-colors" title="Undo (Ctrl+Z)"><Undo2 size={12} /></button>
                        <button onClick={onRedo} className="hover:text-white transition-colors" title="Redo (Ctrl+Y)"><Redo2 size={12} /></button>
                    </div>
                )}
                <span className="text-[10px] font-mono tracking-tighter text-blue-500 font-bold uppercase hidden sm:inline">Amin Academy v2.0</span>
            </div>
        </div>
    )
}
