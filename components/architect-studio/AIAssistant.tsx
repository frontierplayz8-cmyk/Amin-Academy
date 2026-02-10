"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Wand2, LayoutTemplate, Move, Scissors, Download, Maximize2, Sparkles, Command as CommandIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AIAssistantProps {
    isOpen: boolean
    onClose: () => void
    onCommand: (command: string, params?: any) => void
}

export function AIAssistant({ isOpen, onClose, onCommand }: AIAssistantProps) {
    const [inputValue, setInputValue] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)

    const commands = [
        { id: 'ai-generate', label: 'Generative Fill', desc: 'Intelligently fill selected area', icon: Wand2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { id: 'ai-upscale', label: 'AI Upscale (4x)', desc: 'Enhance quality using deep learning', icon: Maximize2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { id: 'tool-move', label: 'Move Tool', desc: 'Switch to selection tool', icon: Move, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
        { id: 'tool-lasso', label: 'Lasso Tool', desc: 'Switch to freehand select', icon: Scissors, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
        { id: 'open-templates', label: 'Browse Templates', desc: 'Open template library', icon: LayoutTemplate, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'export-png', label: 'Download as PNG', desc: 'Export high-res image', icon: Download, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ]

    const filteredCommands = commands.filter(c =>
        c.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        c.desc.toLowerCase().includes(inputValue.toLowerCase())
    )

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                if (isOpen) onClose()
                else onCommand('open')
            }
            if (isOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1))
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSelectedIndex(prev => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1))
                }
                if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filteredCommands[selectedIndex]) {
                        onCommand(filteredCommands[selectedIndex].id)
                    }
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, onCommand, filteredCommands, selectedIndex])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 bg-[#1e1e1e] border-white/10 max-w-2xl overflow-hidden shadow-2xl rounded-2xl">
                <div className="flex flex-col w-full">
                    <div className="flex items-center border-b border-white/5 px-4 h-14 bg-black/20">
                        <CommandIcon className="mr-3 h-5 w-5 text-blue-500" />
                        <Input
                            autoFocus
                            placeholder="Type a command or ask AI..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="h-10 bg-transparent border-none text-white text-sm focus-visible:ring-0 placeholder:text-zinc-600 px-0"
                        />
                        <div className="flex items-center gap-1 ml-auto">
                            <span className="text-[10px] py-1 px-1.5 bg-white/5 rounded border border-white/10 text-zinc-500 font-mono">ESC</span>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar bg-[#1e1e1e]">
                        {filteredCommands.length === 0 ? (
                            <div className="p-12 text-center">
                                <Sparkles className="mx-auto h-8 w-8 text-zinc-800 mb-4" />
                                <p className="text-zinc-500 text-sm">No results found for "{inputValue}"</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredCommands.map((cmd, index) => (
                                    <div
                                        key={cmd.id}
                                        onClick={() => onCommand(cmd.id)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                                            selectedIndex === index ? "bg-white/10 translate-x-1" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg", cmd.bg, cmd.color)}>
                                            <cmd.icon size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-white uppercase tracking-wider">{cmd.label}</div>
                                            <div className="text-[10px] text-zinc-500">{cmd.desc}</div>
                                        </div>
                                        {selectedIndex === index && (
                                            <div className="text-[10px] text-zinc-600 font-mono">ENTER</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 px-1.5 bg-white/5 rounded border border-white/10 text-[9px] text-zinc-500 font-mono">↑↓</div>
                                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Navigate</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 px-1.5 bg-white/5 rounded border border-white/10 text-[9px] text-zinc-500 font-mono">↩</div>
                                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Select</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Wand2 size={12} className="text-blue-500" />
                            <span className="text-[9px] text-blue-500/70 uppercase font-bold tracking-widest animate-pulse">AI Powered</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
