"use client"

import React, { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, User, MessageSquare } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface TranscriptViewerProps {
    messages: Message[]
    isOpen: boolean
}

export default function TranscriptViewer({ messages, isOpen }: TranscriptViewerProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            const scrollContainer = scrollRef.current;
            // Use a slight delay to ensure content is rendered
            setTimeout(() => {
                scrollContainer.scroll({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [messages, isOpen])

    if (!isOpen) return null

    return (
        <div className="absolute inset-0 z-40 bg-[#080808]/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 flex flex-col pointer-events-auto">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <MessageSquare size={16} className="text-zinc-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">Neural Transcript</h3>
                        <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest leading-none">Real-time session logging</p>
                    </div>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth"
                ref={scrollRef}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 #09090b' }}
            >
                <div className="space-y-3 max-w-2xl mx-auto pb-10">
                    {messages.map((msg, i) => (
                        <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className={cn(
                                "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                                msg.role === 'user'
                                    ? "bg-zinc-900/30 border-emerald-500/10 hover:border-emerald-500/20"
                                    : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                            )}>
                                {/* Segment Content */}
                                <div className="p-4 md:p-5 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Badge className={cn(
                                                    "text-[8px] uppercase tracking-widest font-black px-1.5 py-0 h-4 min-h-0",
                                                    msg.role === 'user'
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        : "bg-white/5 text-zinc-500 border-white/10"
                                                )}>
                                                    {msg.role === 'user' ? "STUDENT" : "NEURAL"}
                                                </Badge>
                                                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <p className={cn(
                                                "text-sm md:text-base leading-snug font-medium break-words",
                                                msg.role === 'user' ? "text-emerald-50/80" : "text-zinc-200"
                                            )}>
                                                {msg.content}
                                            </p>
                                        </div>

                                        {/* Minimal Symbol */}
                                        <div className="shrink-0 opacity-30 group-hover:opacity-100 transition-opacity">
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                    </div>

                                    {/* Compact Player UI */}
                                    {msg.role === 'assistant' && (
                                        <div className="pt-2 border-t border-white/5 mt-2 flex items-center gap-3">
                                            <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden relative">
                                                <div className="absolute inset-y-0 left-0 w-1/4 bg-emerald-500/40" />
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-6 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[9px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-all">
                                                Play Segment
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Decorative Gradient Overlay */}
                                <div className={cn(
                                    "absolute inset-0 pointer-events-none transition-opacity duration-300",
                                    msg.role === 'user' ? "bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100" : "bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100"
                                )} />
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 pt-20">
                            <div className="w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                                <Bot size={32} className="text-zinc-600" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 leading-loose">
                                Waiting for neural initialization...<br />
                                Transcripts will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
