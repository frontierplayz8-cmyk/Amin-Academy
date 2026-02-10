"use client"

import React from 'react'
import { Search, LayoutTemplate, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { motion } from 'framer-motion'
import * as fabric from 'fabric'

interface TemplateSidebarProps {
    isOpen: boolean
    onClose: () => void
    onSelectTemplate: (template: any) => void
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>
}

const MOCK_TEMPLATES = [
    { id: 1, name: 'Business Card', thumbnail: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=400&h=250&fit=crop', width: 1050, height: 600 },
    { id: 2, name: 'Instagram Story', thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=711&fit=crop', width: 1080, height: 1920 },
    { id: 3, name: 'YouTube Thumbnail', thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e443d1f0?w=400&h=225&fit=crop', width: 1280, height: 720 },
    { id: 4, name: 'Modern Poster', thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=565&fit=crop', width: 1587, height: 2245 },
    { id: 5, name: 'LinkedIn Header', thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=133&fit=crop', width: 1584, height: 396 },
    { id: 6, name: 'Facebook Post', thumbnail: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&h=300&fit=crop', width: 1200, height: 630 },
]

export function TemplateSidebar({ isOpen, onClose, onSelectTemplate, fabricCanvasRef }: TemplateSidebarProps) {
    if (!isOpen) return null

    const handleApplyTemplate = (template: any) => {
        if (!fabricCanvasRef.current) return

        // This is a simplified implementation - in reality, it would load a JSON layout
        onSelectTemplate(template);

            // Mocking template application by adding a background image
            (fabric as any).FabricImage.fromURL(template.thumbnail).then((img: any) => {
                img.scaleToWidth(fabricCanvasRef.current!.width!);
                fabricCanvasRef.current?.add(img);
                fabricCanvasRef.current?.sendObjectToBack(img);
                fabricCanvasRef.current?.renderAll();
            });
    }

    return (
        <Sidebar side="left" collapsible="none" className="border-r border-black/30 bg-[#2d2d2d] w-64 flex flex-col shadow-2xl relative z-40">
            <SidebarHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <LayoutTemplate size={16} className="text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Templates</span>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </SidebarHeader>

            <SidebarContent className="flex-1 overflow-hidden p-0">
                <div className="p-4 bg-[#2d2d2d]">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" size={14} />
                        <Input
                            placeholder="Search templates..."
                            className="bg-black/20 border-white/5 pl-9 text-xs focus:ring-blue-500/20 rounded-xl"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-4 pb-4 h-[calc(100vh-140px)]">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            {MOCK_TEMPLATES.map((template) => (
                                <motion.div
                                    key={template.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleApplyTemplate(template)}
                                    className="group cursor-pointer rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all bg-black/20"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={template.thumbnail}
                                            alt={template.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Use Template</span>
                                        </div>
                                    </div>
                                    <div className="p-2.5">
                                        <div className="text-[11px] font-bold text-zinc-300 group-hover:text-white truncate">{template.name}</div>
                                        <div className="text-[9px] text-zinc-600 font-mono mt-0.5">{template.width}x{template.height}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </SidebarContent>
        </Sidebar>
    )
}
