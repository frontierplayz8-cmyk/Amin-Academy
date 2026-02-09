"use client"

import React, { useState } from 'react'
import { X, Upload, CheckCircle2, Video, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getSubjectsForGrade, getChaptersForSubject } from '@/app/lib/curriculum-data'

import { useAuthenticatedFetch } from '@/lib/useAuthenticatedFetch'

interface LectureUploadModalProps {
    isOpen: boolean
    onClose: () => void
    userName: string // To track who uploaded it
}

export default function LectureUploadModal({ isOpen, onClose, userName }: LectureUploadModalProps) {
    const { authFetch } = useAuthenticatedFetch()
    const [loading, setLoading] = useState(false)
    const [grade, setGrade] = useState('10th Grade')
    const [subject, setSubject] = useState('')
    const [topic, setTopic] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [thumbnailUrl, setThumbnailUrl] = useState('')

    // Auto-populate subjects based on grade
    const subjects = React.useMemo(() => getSubjectsForGrade(grade), [grade])
    React.useEffect(() => {
        if (subjects.length > 0 && !subjects.includes(subject)) {
            setSubject(subjects[0])
        }
    }, [subjects])

    // Auto-populate topics
    const chapters = React.useMemo(() => getChaptersForSubject(grade, subject), [grade, subject])
    React.useEffect(() => {
        if (chapters.length > 0) {
            setTopic(chapters[0])
        } else {
            setTopic('') // Allow custom entry if no chapters found
        }
    }, [chapters])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await authFetch('/api/lectures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    subject,
                    grade,
                    topic,
                    videoUrl,
                    thumbnailUrl,
                    uploadedBy: userName
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success('Lecture uploaded successfully!')
                onClose()
                setTitle('')
                setDescription('')
                setVideoUrl('')
                setThumbnailUrl('')
            } else {
                toast.error(data.error || 'Failed to upload lecture')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Network error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Upload Lecture</h2>
                        <p className="text-xs text-zinc-500 font-medium">Add content to the Student Library</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Grade & Subject */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Grade Level</label>
                                <select
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:ring-1 focus:ring-emerald-500"
                                >
                                    {['9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Subject</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:ring-1 focus:ring-emerald-500"
                                >
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Topic */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Topic / Chapter</label>
                            {chapters.length > 0 ? (
                                <select
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm font-medium text-white focus:ring-1 focus:ring-emerald-500"
                                >
                                    {chapters.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Enter topic name"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm font-medium text-white focus:ring-1 focus:ring-emerald-500"
                                    required
                                />
                            )}
                        </div>

                        {/* Title & Desc */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Lecture Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Introduction to Cellular Respiration"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-base font-bold text-white placeholder:font-normal"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Description</label>
                            <textarea
                                placeholder="Brief summary of the lecture..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-white min-h-[100px]"
                            />
                        </div>

                        {/* Media Links */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1 flex items-center gap-2">
                                    <Video size={12} /> Video URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://youtube.com/..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-emerald-400 font-mono"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1 flex items-center gap-2">
                                    <ImageIcon size={12} /> Thumbnail URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://imgur.com/..."
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-400 font-mono"
                                />
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                Publish Lecture
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
