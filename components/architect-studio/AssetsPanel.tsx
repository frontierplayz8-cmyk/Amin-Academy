import React, { useState } from 'react'
import { Search, Plus, Trash2, Upload, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const ASSETS = {
    academy: [
        { id: 1, url: 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png', label: 'Graduation Cap' },
        { id: 2, url: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png', label: 'Book' },
        { id: 3, url: 'https://cdn-icons-png.flaticon.com/512/2641/2641473.png', label: 'Certificate' },
        { id: 4, url: 'https://cdn-icons-png.flaticon.com/512/3074/3074068.png', label: 'School' },
        { id: 5, url: 'https://cdn-icons-png.flaticon.com/512/2451/2451548.png', label: 'Teacher' },
        { id: 6, url: 'https://cdn-icons-png.flaticon.com/512/1081/1081025.png', label: 'Student' },
    ],
    icons: [
        { id: 7, url: 'https://cdn-icons-png.flaticon.com/512/732/732200.png', label: 'Email' },
        { id: 8, url: 'https://cdn-icons-png.flaticon.com/512/724/724664.png', label: 'Phone' },
        { id: 9, url: 'https://cdn-icons-png.flaticon.com/512/447/447031.png', label: 'Location' },
        { id: 10, url: 'https://cdn-icons-png.flaticon.com/512/633/633633.png', label: 'Facebook' },
        { id: 11, url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', label: 'Twitter' },
        { id: 12, url: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png', label: 'Instagram' },
    ],
    logos: [
        { id: 13, url: 'https://cdn-icons-png.flaticon.com/512/5969/5969116.png', label: 'Badge 1' },
        { id: 14, url: 'https://cdn-icons-png.flaticon.com/512/1170/1170576.png', label: 'Badge 2' },
        { id: 15, url: 'https://cdn-icons-png.flaticon.com/512/4128/4128362.png', label: 'Shield' },
    ]
}

interface AssetsPanelProps {
    onAddImage: (url: string) => void
    customAssets: any[]
    onDeleteAsset: (id: number) => void
}

export function AssetsPanel({ onAddImage, customAssets = [], onDeleteAsset }: AssetsPanelProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredAssets = (category: string) => {
        return (ASSETS as any)[category].filter((asset: any) =>
            asset.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }

    const filteredCustomAssets = customAssets.filter((asset: any) =>
        asset.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (f) => {
                onAddImage(f.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#2d2d2d] text-white">
            <div className="p-4 border-b border-black/40 space-y-3">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 bg-black/20 border-white/5 h-9 text-xs focus:ring-blue-500/20"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="w-full h-8 text-xs bg-white/5 border-white/5 hover:bg-white/10"
                        onClick={() => document.getElementById('asset-upload')?.click()}
                    >
                        <Upload size={12} className="mr-2" /> Upload
                    </Button>
                    <input
                        id="asset-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>
            </div>

            <Tabs defaultValue="academy" className="flex-1 flex flex-col">
                <div className="px-4 pt-2">
                    <TabsList className="w-full bg-black/20 p-1 rounded-lg grid grid-cols-4">
                        <TabsTrigger value="academy" className="text-[9px] uppercase font-bold tracking-widest">Acad</TabsTrigger>
                        <TabsTrigger value="icons" className="text-[9px] uppercase font-bold tracking-widest">Icon</TabsTrigger>
                        <TabsTrigger value="logos" className="text-[9px] uppercase font-bold tracking-widest">Logo</TabsTrigger>
                        <TabsTrigger value="custom" className="text-[9px] uppercase font-bold tracking-widest text-emerald-400">Mine</TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <TabsContent value="custom" className="m-0 space-y-4 outline-none">
                        {filteredCustomAssets.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-xs">
                                <Star className="mx-auto mb-2 opacity-20" size={32} />
                                <p>No custom assets yet.</p>
                                <p className="opacity-50">Right click items to save them here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {filteredCustomAssets.map((asset) => (
                                    <div key={asset.id} className="relative group">
                                        <button
                                            onClick={() => onAddImage(asset.url)}
                                            className="w-full aspect-square bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500 hover:bg-white/10 transition-all p-2 flex flex-col items-center justify-center gap-2"
                                        >
                                            <img src={asset.url} alt={asset.label} className="w-12 h-12 object-contain" />
                                            <span className="text-[9px] uppercase font-bold text-zinc-500 group-hover:text-emerald-400 truncate w-full text-center">{asset.label}</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }}
                                            className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <Trash2 size={10} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {['academy', 'icons', 'logos'].map(cat => (
                        <TabsContent key={cat} value={cat} className="m-0 space-y-4 outline-none">
                            <div className="grid grid-cols-3 gap-2">
                                {filteredAssets(cat).map((asset: any) => (
                                    <button
                                        key={asset.id}
                                        onClick={() => onAddImage(asset.url)}
                                        className="aspect-square bg-white/5 rounded-xl border border-white/5 hover:border-blue-500 hover:bg-white/10 transition-all p-2 flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <img src={asset.url} alt={asset.label} className="w-8 h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                            {filteredAssets(cat).length === 0 && (
                                <p className="text-center text-zinc-500 text-xs py-4">No match found</p>
                            )}
                        </TabsContent>
                    ))}
                </ScrollArea>
            </Tabs>
        </div>
    )
}
