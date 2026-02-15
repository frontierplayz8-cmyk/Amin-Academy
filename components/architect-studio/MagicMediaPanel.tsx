import React, { useState } from 'react';
import { Wand2, Image as ImageIcon, Loader2, Sparkles, RefreshCw, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MagicMediaPanelProps {
    onAddImage: (url: string) => void;
}

export function MagicMediaPanel({ onAddImage }: MagicMediaPanelProps) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedStyle, setSelectedStyle] = useState('Nano Banana'); // Default to requested style
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isPosterMode, setIsPosterMode] = useState(false);

    const styles = [
        { id: 'Nano Banana', name: 'Nano Banana (Hyper Real)', icon: <Sparkles size={14} className="text-yellow-400" /> },
        { id: 'Photo', name: 'Photography', icon: <ImageIcon size={14} /> },
        { id: 'Dreamy', name: 'Dreamy', icon: <Wand2 size={14} /> },
        { id: 'Anime', name: 'Anime', icon: <Sparkles size={14} /> },
        { id: '3D Model', name: '3D Model', icon: <Layout size={14} /> },
        { id: 'Minimalist', name: 'Minimalist', icon: <Layout size={14} /> },
    ];

    const ratios = [
        { id: '1:1', name: 'Square' },
        { id: '16:9', name: 'Landscape' },
        { id: '9:16', name: 'Portrait' },
    ];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a description for your image");
            return;
        }

        setIsGenerating(true);
        setGeneratedImages([]); // Clear previous results

        try {
            const response = await fetch('/api/ai/magic-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text_prompt: prompt,
                    style: selectedStyle,
                    aspect_ratio: aspectRatio,
                    reference_image: referenceImage,
                    is_poster_mode: isPosterMode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Generation failed');
            }

            if (data.success && data.images) {
                setGeneratedImages(data.images);

                if (data.warning) {
                    toast.warning("Generated in Demo Mode", {
                        description: data.warning
                    });
                } else {
                    toast.success("Magic Media generated successfully!");
                }
            } else {
                // Fallback if API returns success but no images (rare)
                toast.error("No images returned from generator");
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#2d2d2d] text-white">
            <div className="p-4 space-y-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-tr from-purple-500 to-blue-500 p-1.5 rounded-lg">
                        <Wand2 size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Magic Media</h3>
                        <p className="text-[10px] text-zinc-400">Turn text into images with AI</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Describe your image</label>
                    <Textarea
                        placeholder="A futuristic city with flying cars..."
                        className="bg-black/20 border-white/10 text-xs min-h-[60px] resize-none focus:ring-purple-500/50"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                {/* Poster Mode Toggle */}
                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                        <Layout size={14} className="text-pink-400" />
                        <span className="text-xs font-medium">Poster Mode</span>
                    </div>
                    <button
                        onClick={() => setIsPosterMode(!isPosterMode)}
                        className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            isPosterMode ? "bg-pink-500" : "bg-zinc-600"
                        )}
                    >
                        <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            isPosterMode ? "left-4.5" : "left-0.5"
                        )} />
                    </button>
                </div>

                {/* Reference Image Upload */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Reference Image (Optional)</label>
                    <div className="relative group">
                        {referenceImage ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                                <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setReferenceImage(null)}
                                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-500/80 transition-colors"
                                >
                                    <RefreshCw size={12} className="rotate-45" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500/30 hover:bg-white/5 transition-all">
                                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                    <ImageIcon className="w-5 h-5 mb-1 text-zinc-400" />
                                    <p className="text-[10px] text-zinc-500">Click to upload reference</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Style</label>
                    <div className="grid grid-cols-2 gap-2">
                        {styles.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border text-xs transition-all text-left",
                                    selectedStyle === style.id
                                        ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
                                        : "bg-white/5 border-transparent hover:bg-white/10 text-zinc-300"
                                )}
                            >
                                {style.icon}
                                <span className="truncate">{style.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Aspect Ratio</label>
                    <div className="flex gap-2">
                        {ratios.map(ratio => (
                            <button
                                key={ratio.id}
                                onClick={() => setAspectRatio(ratio.id)}
                                className={cn(
                                    "flex-1 py-1.5 rounded text-[10px] border transition-all",
                                    aspectRatio === ratio.id
                                        ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
                                        : "bg-white/5 border-transparent hover:bg-white/10 text-zinc-300"
                                )}
                            >
                                {ratio.name}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-10 shadow-lg shadow-purple-900/20"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Dreaming...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} className="mr-2" />
                            Generate Image
                        </>
                    )}
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-2 gap-3">
                    <AnimatePresence>
                        {generatedImages.map((src, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-purple-500/50 transition-all shadow-lg"
                                onClick={() => onAddImage(src)}
                            >
                                <img src={src} alt="Generated" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-medium text-white bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                                        Click to Add
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {generatedImages.length === 0 && !isGenerating && (
                        <div className="col-span-2 flex flex-col items-center justify-center py-10 opacity-30 text-center">
                            <ImageIcon size={48} className="mb-2" />
                            <p className="text-xs">Your creations will appear here</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
