"use client"

import React, { useState } from 'react'
import { BookOpen, Calculator, Loader2, Search, Split } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CitationManager } from './CitationManager'
import { MathRenderer } from './MathRenderer'

export function ScholarPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null

    return (
        <div className="w-[400px] border-l border-white/5 bg-[#0d0d0d] flex flex-col h-full absolute right-0 top-0 z-50 shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-500" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">Scholar Tools</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 hover:bg-white/10">
                    <Split size={14} />
                </Button>
            </div>

            <Tabs defaultValue="citation" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 bg-[#121212] border-b border-white/5 rounded-none h-10">
                    <TabsTrigger value="citation" className="text-xs">Citations</TabsTrigger>
                    <TabsTrigger value="math" className="text-xs">Formulae</TabsTrigger>
                </TabsList>

                <TabsContent value="citation" className="flex-1 overflow-y-auto p-4 m-0">
                    <CitationManager />

                    <div className="mt-8">
                        <h3 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Quick Research</h3>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 text-zinc-500" size={14} />
                            <Input placeholder="Search Scholar..." className="pl-8 bg-black/20 border-white/10 text-xs" />
                        </div>
                        <div className="mt-4 text-center text-zinc-600 text-xs py-8 border border-dashed border-white/5 rounded-xl">
                            Research browser integration coming soon
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="math" className="flex-1 overflow-y-auto p-4 m-0 space-y-4">
                    <div className="bg-[#121212] border border-white/10 rounded-xl p-4">
                        <Label className="text-xs text-zinc-400 mb-2 block">LaTeX Dictionary</Label>
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                            <div className="p-2 bg-black/20 rounded cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                                <MathRenderer equation="x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}" />
                                <div className="mt-1 text-[10px] text-zinc-500 font-mono">\frac...</div>
                            </div>
                            <div className="p-2 bg-black/20 rounded cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                                <MathRenderer equation="E = mc^2" />
                                <div className="mt-1 text-[10px] text-zinc-500 font-mono">E = mc^2</div>
                            </div>
                            <div className="p-2 bg-black/20 rounded cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                                <MathRenderer equation="\sum_{i=1}^n i" />
                                <div className="mt-1 text-[10px] text-zinc-500 font-mono">\sum</div>
                            </div>
                            <div className="p-2 bg-black/20 rounded cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                                <MathRenderer equation="\int_0^\infty f(x)dx" />
                                <div className="mt-1 text-[10px] text-zinc-500 font-mono">\int</div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
