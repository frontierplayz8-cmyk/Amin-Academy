"use client"

import React, { useRef } from 'react'
import {
    ImageIcon, Upload, ArrowRight, Plus, Wand2, Monitor, LayoutTemplate, ImagePlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GatewayModalProps {
    view: 'choice' | 'blank-setup' | 'editor'
    setView: (view: 'choice' | 'blank-setup' | 'editor') => void
    dimensions: { width: number, height: number }
    setDimensions: (dims: { width: number, height: number }) => void
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
    recentProject?: any
    onLoadRecent?: () => void
}

export function GatewayModal({
    view,
    setView,
    dimensions,
    setDimensions,
    handleFileUpload,
    fileInputRef,
    recentProject,
    onLoadRecent
}: GatewayModalProps) {

    return (
        <AnimatePresence mode="wait">
            {view === 'choice' && (
                <motion.div
                    key="choice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-6xl flex flex-col items-center gap-6"
                >
                    {/* RECENT PROJECT CARD */}
                    {recentProject && (
                        <motion.button
                            layoutId="recent-project"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onLoadRecent}
                            className="w-full max-w-4xl h-32 relative overflow-hidden rounded-[2rem] bg-zinc-900/80 border border-white/10 p-6 flex items-center gap-6 text-left transition-all hover:bg-zinc-900 hover:border-orange-500/50 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)] z-20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="h-20 w-32 bg-black/50 rounded-xl border border-white/5 overflow-hidden flex-shrink-0">
                                {recentProject.preview ? (
                                    <img src={recentProject.preview} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                        <ImageIcon size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold uppercase text-orange-400 flex items-center gap-1">
                                        <Wand2 size={10} />
                                        Resume
                                    </div>
                                    <span className="text-zinc-500 text-xs">
                                        Last edited: {new Date(recentProject.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Unsaved Project</h3>
                                <p className="text-zinc-400 text-sm">Continue where you left off</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <ArrowRight size={20} />
                            </div>
                        </motion.button>
                    )}

                    {/* 1. Upload Card */}
                    <motion.div
                        className="w-full flex flex-col items-center justify-center text-center space-y-16 py-12"
                    >
                        {/* Hero Section */}
                        <div className="space-y-6 max-w-2xl relative">
                            {/* Abstract Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full -z-10" />

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-4"
                            >
                                <SparklesIcon className="w-3 h-3" />
                                <span>Professional Suite v2.0</span>
                            </motion.div>

                            <h1 className="text-7xl font-black tracking-tighter text-white">
                                Image Architect <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 animate-gradient-x">
                                    Studio
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-xl leading-relaxed max-w-lg mx-auto font-medium">
                                The next generation of creative tools. Edit, design, and generate with AI-powered precision.
                            </p>
                        </div>

                        {/* Action Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-8">
                            {/* 1. Upload Card */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative overflow-hidden rounded-[2rem] bg-zinc-900/50 border border-white/10 p-8 text-left transition-all hover:bg-zinc-900 hover:border-blue-500/50 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-6 p-4 w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                        <Upload strokeWidth={1.5} size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Upload File</h3>
                                    <p className="text-zinc-500 text-sm font-medium">Start from an existing image. Supports PNG, JPG, and WebP.</p>

                                    <div className="mt-auto pt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                        <span>Select File</span>
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </motion.button>

                            {/* 2. Blank Canvas Card */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setView('blank-setup')}
                                className="group relative overflow-hidden rounded-[2rem] bg-zinc-900/50 border border-white/10 p-8 text-left transition-all hover:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-6 p-4 w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                        <LayoutTemplate strokeWidth={1.5} size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Blank Canvas</h3>
                                    <p className="text-zinc-500 text-sm font-medium">Create a new project with custom dimensions and presets.</p>

                                    <div className="mt-auto pt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                        <span>Start Fresh</span>
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </motion.button>

                            {/* 3. AI Start Card (Coming Soon) */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative overflow-hidden rounded-[2rem] bg-zinc-900/30 border border-white/5 p-8 text-left transition-all hover:bg-zinc-900/50 hover:border-purple-500/30 cursor-not-allowed opacity-75 grayscale hover:grayscale-0"
                            >
                                <div className="absolute top-4 right-4 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Coming Soon
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-6 p-4 w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                                        <Wand2 strokeWidth={1.5} size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">AI Generation</h3>
                                    <p className="text-zinc-500 text-sm font-medium">Describe your vision and let AI create the base layer for you.</p>

                                    <div className="mt-auto pt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                        <span>Join Waitlist</span>
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </motion.button>
                        </div>

                        <div className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em] pt-12">
                            Powered by Bolt Velocity Engine
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {view === 'blank-setup' && (
                <motion.div
                    key="blank-setup"
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    className="max-w-2xl w-full bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-12 space-y-10 shadow-2xl relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="space-y-2 relative z-10">
                        <button
                            onClick={() => setView('choice')}
                            className="absolute -top-2 -left-2 p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                        >
                            <ArrowRight className="rotate-180" size={20} />
                        </button>
                        <div className="pl-10">
                            <h2 className="text-4xl font-black tracking-tight text-white">Canvas Setup</h2>
                            <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em] mt-2">Define your workspace properties</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Width <span className="text-zinc-700">(PX)</span></Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <span className="text-zinc-600 font-bold text-xs">W</span>
                                </div>
                                <Input
                                    type="number"
                                    value={dimensions.width}
                                    onChange={(e) => setDimensions({ ...dimensions, width: parseInt(e.target.value) })}
                                    className="h-16 pl-12 bg-zinc-900/50 border-white/10 text-2xl font-black rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Height <span className="text-zinc-700">(PX)</span></Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <span className="text-zinc-600 font-bold text-xs">H</span>
                                </div>
                                <Input
                                    type="number"
                                    value={dimensions.height}
                                    onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) })}
                                    className="h-16 pl-12 bg-zinc-900/50 border-white/10 text-2xl font-black rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Quick Presets</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {[
                                { label: 'FHD', sub: '1080p', w: 1920, h: 1080 },
                                { label: '4K', sub: 'UHD', w: 3840, h: 2160 },
                                { label: 'Square', sub: '1:1', w: 1080, h: 1080 },
                                { label: 'Story', sub: '9:16', w: 1080, h: 1920 },
                                { label: 'A4', sub: 'Print', w: 2480, h: 3508 },
                            ].map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => setDimensions({ width: preset.w, height: preset.h })}
                                    className="h-auto py-3 bg-zinc-900 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group"
                                >
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white">{preset.label}</span>
                                    <span className="text-[9px] font-mono text-zinc-600 group-hover:text-emerald-400">{preset.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 relative z-10">
                        <Button
                            onClick={() => setView('editor')}
                            className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Create Workspace
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M9 3v4" />
            <path d="M3 5h4" />
            <path d="M3 9h4" />
        </svg>
    )
}
