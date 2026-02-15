"use client"

import React, { useState } from 'react'
import { Sparkles, Loader2, Wand2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AISectionPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    section: any;
    onGenerate: (data: any, action: 'ADD_CONTENT' | 'REPLACE_CONTENT' | 'IMPROVE_CONTENT') => void;
    context: string;
}

export function AISectionPromptModal({ isOpen, onClose, section, onGenerate, context }: AISectionPromptModalProps) {
    const [prompt, setPrompt] = useState('')
    const [quantity, setQuantity] = useState(3)
    const [isLoading, setIsLoading] = useState(false)
    const [action, setAction] = useState<'ADD_CONTENT' | 'REPLACE_CONTENT' | 'IMPROVE_CONTENT'>('IMPROVE_CONTENT')

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt first")
            return
        }

        setIsLoading(true)
        const toastId = toast.loading("AI is crafting your exam content...")

        try {
            const res = await fetch('/api/ai/architect/section-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionType: section.type,
                    action,
                    prompt,
                    context,
                    currentContent: section.content,
                    quantity
                })
            })

            const result = await res.json()

            if (result.success) {
                onGenerate(result.data, action)
                toast.success("Content generated successfully!", { id: toastId })
                onClose()
                setPrompt('')
            } else {
                toast.error(result.message || "AI failed to generate content", { id: toastId })
            }
        } catch (error) {
            toast.error("AI Service Offline", { id: toastId })
        } finally {
            setIsLoading(false)
        }
    }

    if (!section) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#0d0d0d] border-white/10 text-zinc-300">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Sparkles size={18} />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-widest text-white">
                            AI Magic Prompt
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-500 text-xs uppercase tracking-wider">
                        Generation for: <span className="text-indigo-400 font-bold">{section.title}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">What should AI do?</Label>
                        <Textarea
                            placeholder="e.g., Add 3 more MCQs about photosynthesis with Urdu translations..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="bg-black/40 border-white/5 focus:border-indigo-500/50 min-h-[120px] text-sm resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Operation</Label>
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                                {[
                                    { id: 'ADD_CONTENT', label: 'Add' },
                                    { id: 'REPLACE_CONTENT', label: 'Replace' },
                                    { id: 'IMPROVE_CONTENT', label: 'Improve' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setAction(opt.id as any)}
                                        className={cn(
                                            "flex-1 px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all",
                                            action === opt.id
                                                ? (opt.id === 'IMPROVE_CONTENT' ? "bg-emerald-600 text-white" : "bg-indigo-500 text-white")
                                                : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quantity</Label>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                className="bg-black/40 border-white/5 focus:border-indigo-500/50 h-9"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-zinc-500 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-widest px-8 shadow-xl shadow-indigo-500/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Casting...
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
