"use client"

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, Upload, Download, Plus,
    RefreshCw, Wand2, Image as ImageIcon,
    ChevronDown, Palette, Maximize
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PosterCanvas } from '@/components/PosterCanvas'

interface PosterGeneratorProps {
    onAddToWorkspace: (base64: string, prompt: string) => void
}

export function PosterGenerator({ onAddToWorkspace }: PosterGeneratorProps) {
    const [prompt, setPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [referenceImage, setReferenceImage] = useState<string | null>(null)
    const [style, setStyle] = useState('Illustration')
    const [palette, setPalette] = useState('Vibrant')
    const [aspectRatio, setAspectRatio] = useState('9:16 Portrait')
    const [isEditMode, setIsEditMode] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Canvas-compatible styles and palettes
    const styles = ['modern', 'classic', 'minimal', 'vibrant']
    const palettes = ['blue', 'green', 'purple', 'orange', 'red', 'teal']
    const ratios = ['1:1', '16:9', '9:16', '4:3']

    const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (f) => setReferenceImage(f.target?.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleCanvasGenerate = (imageData: string) => {
        setGeneratedImage(imageData)
        setIsGenerating(false)
        setIsEditMode(false)
        toast.success("Poster generated successfully!")
    }

    const generatePoster = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a description for your poster.")
            return
        }

        setIsGenerating(true)
        // Canvas generation happens automatically via PosterCanvas component
        // The component will call handleCanvasGenerate when done
    }

    return (
        <div className="w-full bg-[#2d2d2d] shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2 text-blue-400">
                    <Sparkles size={16} />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[#e1e1e1]">Create Your Academic Poster</h2>
                </div>
            </div>

            <div className="p-4 space-y-6">
                <section className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-zinc-500">Optional: Upload a Reference Image</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="h-28 border-2 border-dashed border-white/5 rounded-xl bg-black/10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/20 transition-all overflow-hidden p-4 text-center group"
                        >
                            {referenceImage ? (
                                <img src={referenceImage} alt="Ref" className="h-full w-full object-cover opacity-50" />
                            ) : (
                                <>
                                    <Upload size={20} className="text-zinc-600 mb-2 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-[10px] text-zinc-500 font-medium">Drop an image here or click to upload</span>
                                    <span className="text-[8px] text-zinc-600 mt-1">(e.g., logo, specific style reference)</span>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleReferenceUpload} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-zinc-500">Describe Your Poster Idea</label>
                        <Textarea
                            placeholder="e.g., 'A vibrant poster for a Physics Olympiad, showing a rocket launching with abstract formulas in the background.' OR 'A minimalist design for a biology seminar about genetics, with a double helix icon.'"
                            className="bg-black/20 border-white/5 text-xs min-h-[100px] resize-none focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[8px] uppercase font-black text-zinc-600">Style</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full h-9 bg-black/20 border-white/5 text-[10px] justify-between text-zinc-300">
                                        {style}
                                        <ChevronDown size={12} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#1e1e1e] border-white/10 w-[140px]">
                                    {styles.map(s => (
                                        <DropdownMenuItem key={s} onClick={() => setStyle(s)} className="text-[10px] text-zinc-400 hover:text-white">
                                            {s}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] uppercase font-black text-zinc-600">Color Palette</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full h-9 bg-black/20 border-white/5 text-[10px] justify-between text-zinc-300">
                                        {palette}
                                        <Palette size={12} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#1e1e1e] border-white/10 w-[140px]">
                                    {palettes.map(p => (
                                        <DropdownMenuItem key={p} onClick={() => setPalette(p)} className="text-[10px] text-zinc-400 hover:text-white">
                                            {p}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[8px] uppercase font-black text-zinc-600">Aspect Ratio</label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full h-9 bg-black/20 border-white/5 text-[10px] justify-between text-zinc-300">
                                    {aspectRatio}
                                    <Maximize size={12} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1e1e1e] border-white/10 w-[140px]">
                                {ratios.map(r => (
                                    <DropdownMenuItem key={r} onClick={() => setAspectRatio(r)} className="text-[10px] text-zinc-400 hover:text-white">
                                        {r}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button
                        onClick={generatePoster}
                        disabled={isGenerating}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-xl shadow-blue-500/10 transition-all border-none"
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-2">
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Generating...</span>
                            </div>
                        ) : (
                            <span>Generate Poster (Instant!)</span>
                        )}
                    </Button>

                    {/* Hidden Canvas component for generation */}
                    {isGenerating && (
                        <PosterCanvas
                            title={prompt}
                            content="Amin Academy - Excellence in Education"
                            style={style as any}
                            colorPalette={palette}
                            aspectRatio={aspectRatio as any}
                            onGenerate={handleCanvasGenerate}
                        />
                    )}
                </section>

                <Separator className="bg-white/5" />

                <section className="space-y-4 pb-8">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-black text-zinc-500">Generated Poster</label>
                        <div className="relative aspect-[9/14] w-full bg-black/40 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden group">
                            {generatedImage ? (
                                <>
                                    <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 flex-col gap-2">
                                        <Button
                                            className="w-full h-9 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold border-none"
                                            onClick={() => {
                                                setIsEditMode(true)
                                                toast.info("Iterative Edit Mode", { description: "Update your prompt to modify this image." })
                                            }}
                                        >
                                            <Wand2 size={14} className="mr-2" />
                                            Edit with new prompt
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                            <Button
                                                variant="secondary"
                                                className="h-9 bg-zinc-800 text-white hover:bg-zinc-700 text-[10px] font-bold border-none"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.download = 'academic-poster.png';
                                                    link.href = generatedImage;
                                                    link.click();
                                                    toast.success("Download started");
                                                }}
                                            >
                                                <Download size={14} className="mr-2" />
                                                Download
                                            </Button>
                                            <Button
                                                className="h-9 bg-emerald-600 text-white hover:bg-emerald-500 text-[10px] font-bold border-none"
                                                onClick={() => onAddToWorkspace(generatedImage, prompt)}
                                            >
                                                <Plus size={14} className="mr-2" />
                                                Add to Workspace
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-8 space-y-3">
                                    <ImageIcon size={48} className="mx-auto text-zinc-800" />
                                    <p className="text-[10px] text-zinc-600 font-medium italic">Your poster will appear here.</p>
                                </div>
                            )}

                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-4">
                                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Generating Poster...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
