import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

type CitationStyle = 'APA' | 'MLA' | 'Chicago'

export function CitationManager() {
    const [style, setStyle] = useState<CitationStyle>('APA')
    const [author, setAuthor] = useState('')
    const [title, setTitle] = useState('')
    const [year, setYear] = useState('')
    const [source, setSource] = useState('')
    const [url, setUrl] = useState('')
    const [citation, setCitation] = useState('')
    const [copied, setCopied] = useState(false)

    const generateCitation = () => {
        let result = ''
        const authors = author.split(',').map(a => a.trim())
        const authorText = authors.length > 2 ? `${authors[0]} et al.` : author

        switch (style) {
            case 'APA':
                // Author, A. A. (Year). Title of work. Source. URL
                result = `${author}. (${year}). ${title}. ${source}. ${url}`
                break
            case 'MLA':
                // Author. "Title of Source." Title of Container, Other Contributors, Version, Number, Publisher, Publication Date, Location.
                result = `${author}. "${title}." ${source}, ${year}, ${url}.`
                break
            case 'Chicago':
                // Author. "Title." Source Year. URL.
                result = `${author}. "${title}." ${source} (${year}). ${url}.`
                break
        }
        setCitation(result)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(citation)
        setCopied(true)
        toast.success("Citation copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-4 text-zinc-300">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-2">Citation Generator</h3>

            <div className="space-y-3">
                <div>
                    <Label className="text-xs">Citation Style</Label>
                    <Select value={style} onValueChange={(v: string | null) => { if (v) setStyle(v as CitationStyle) }}>
                        <SelectTrigger className="mt-1 bg-black/20 border-white/10 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="APA">APA 7</SelectItem>
                            <SelectItem value="MLA">MLA 9</SelectItem>
                            <SelectItem value="Chicago">Chicago 17</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-xs">Author</Label>
                        <Input
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Smith, John"
                            className="mt-1 bg-black/20 border-white/10 h-8 text-xs"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Year</Label>
                        <Input
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="2024"
                            className="mt-1 bg-black/20 border-white/10 h-8 text-xs"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Article or Book Title"
                        className="mt-1 bg-black/20 border-white/10 h-8 text-xs"
                    />
                </div>

                <div>
                    <Label className="text-xs">Source / Publisher</Label>
                    <Input
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="Journal Name or Publisher"
                        className="mt-1 bg-black/20 border-white/10 h-8 text-xs"
                    />
                </div>

                <div>
                    <Label className="text-xs">URL (Optional)</Label>
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-1 bg-black/20 border-white/10 h-8 text-xs"
                    />
                </div>

                <Button
                    onClick={generateCitation}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold h-8 text-xs uppercase tracking-wider"
                >
                    Generate Citation
                </Button>
            </div>

            {citation && (
                <div className="mt-4 p-3 bg-black/40 rounded-lg border border-white/5 relative group">
                    <p className="text-xs font-mono pr-6 break-words">{citation}</p>
                    <button
                        onClick={copyToClipboard}
                        className="absolute top-2 right-2 text-zinc-500 hover:text-emerald-500 transition-colors"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>
            )}
        </div>
    )
}
