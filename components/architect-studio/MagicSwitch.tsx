"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MagicSwitchProps {
    isOpen: boolean
    onClose: () => void
    onResize: (preset: { label: string, w: number, h: number }) => void
}

const PRESETS = [
    { label: 'Instagram Story', w: 1080, h: 1920, icon: '📱' },
    { label: 'LinkedIn Post', w: 1200, h: 627, icon: '💼' },
    { label: 'Twitter Header', w: 1500, h: 500, icon: '🐦' },
    { label: 'YouTube Thumbnail', w: 1280, h: 720, icon: '▶️' },
    { label: 'A4 Document', w: 2480, h: 3508, icon: '📄' },
    { label: 'Facebook Cover', w: 820, h: 312, icon: 'fb' },
]

export function MagicSwitch({ isOpen, onClose, onResize }: MagicSwitchProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1e1e1e] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <Sparkles size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Magic Switch</h2>
                                <p className="text-zinc-500 text-sm">Instantly reflow your design to any format.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {PRESETS.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => onResize(preset)}
                                    className="group p-4 bg-black/20 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/50 rounded-2xl text-left transition-all relative overflow-hidden"
                                >
                                    <div className="text-2xl mb-2">{preset.icon}</div>
                                    <div className="text-sm font-bold text-zinc-300 group-hover:text-white mb-1">{preset.label}</div>
                                    <div className="text-[10px] font-mono text-zinc-600">{preset.w}x{preset.h}</div>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={onClose} variant="ghost" className="text-zinc-500 hover:text-white">Cancel</Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
