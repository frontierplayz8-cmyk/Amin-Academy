"use client"

import { useState, useEffect } from 'react'
import { Search, PlayCircle, BookOpen, Clock, RefreshCw, X, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuthenticatedFetch } from '@/lib/useAuthenticatedFetch'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}

export default function LecturesPage() {
    const { authFetch } = useAuthenticatedFetch()
    const { profile } = useAuth()
    const [lectures, setLectures] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('All Subjects')
    const [selectedTopic, setSelectedTopic] = useState('All Topics')

    const userRank = profile?.ranks || 'Student'
    const isPrincipal = userRank === 'Principal'

    // Video Modal State
    const [selectedVideo, setSelectedVideo] = useState<{ url: string, title: string } | null>(null)

    // Derived lists for filters
    const subjects = ['All Subjects', ...Array.from(new Set(lectures.map(l => l.subject)))]
    const topics = ['All Topics', ...Array.from(new Set(lectures.filter(l => selectedSubject === 'All Subjects' || l.subject === selectedSubject).map(l => l.topic)))]

    const fetchLectures = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (selectedSubject !== 'All Subjects') params.append('subject', selectedSubject)
            if (selectedTopic !== 'All Topics') params.append('topic', selectedTopic)

            const res = await fetch(`/api/lectures?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setLectures(data.lectures)
            }
        } catch (error) {
            console.error('Failed to fetch lectures', error)
        } finally {
            setLoading(false)
        }
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLectures()
        }, 500)
        return () => clearTimeout(timer)
    }, [search, selectedSubject, selectedTopic])

    // Handle video click
    const handleLectureClick = (url: string, title: string) => {
        const ytId = getYouTubeId(url)
        if (ytId) {
            setSelectedVideo({ url: ytId, title })
        } else {
            // Fallback for non-YouTube links
            window.open(url, '_blank')
        }
    }

    const handleDelete = async (lectureId: string) => {
        if (!confirm("Are you sure you want to permanently delete this lecture?")) return

        const loadingToast = toast.loading("Purging content node...")
        try {
            const res = await authFetch(`/api/lectures?id=${lectureId}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Lecture deleted successfully", { id: loadingToast })
                fetchLectures()
            } else {
                toast.error(data.error || "Failed to delete lecture", { id: loadingToast })
            }
        } catch (error) {
            toast.error("Operation failed. Neural link unstable.", { id: loadingToast })
        }
    }

    return (
        <><div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                {/* Header Section */}
                <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Library
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
                        Available <br /> <span className="text-transparent bg-clip-text bg-linear-to-br from-emerald-400 to-cyan-600">Lectures</span>
                    </h1>

                    <p className="text-zinc-500 max-w-lg mx-auto text-lg font-medium">
                        Access premium educational content curated by expert faculty.
                    </p>
                </div>

                {/* Search & Filter Bar */}
                <div className="sticky top-20 z-40 bg-[#050505]/80 backdrop-blur-xl p-4 border border-white/5 rounded-3xl mb-12 shadow-2xl animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-emerald-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title, topic..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-zinc-900/50 rounded-xl border border-white/5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-hidden transition-all text-sm font-medium placeholder:text-zinc-600" />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="h-12 px-4 bg-zinc-900/50 rounded-xl border border-white/5 text-sm font-bold text-zinc-400 focus:text-white outline-hidden hover:bg-zinc-800 transition-colors cursor-pointer appearance-none min-w-[140px]"
                            >
                                {subjects.map(s => <option key={s || 'all-subjects'} value={s}>{s}</option>)}
                            </select>

                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="h-12 px-4 bg-zinc-900/50 rounded-xl border border-white/5 text-sm font-bold text-zinc-400 focus:text-white outline-hidden hover:bg-zinc-800 transition-colors cursor-pointer appearance-none min-w-[140px]"
                            >
                                {topics.map(t => <option key={t || 'all-topics'} value={t}>{t}</option>)}
                            </select>

                            <button
                                onClick={fetchLectures}
                                className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-500 transition-all"
                            >
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                {loading && lectures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-xs uppercase font-black tracking-widest text-zinc-600 animate-pulse">Syncing Neural Database...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lectures.map((lecture, idx) => (
                            <div
                                key={lecture.id || lecture._id || idx}
                                className="group relative bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/30 hover:bg-zinc-900/50 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video bg-black relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-shadow">
                                    {lecture.thumbnailUrl ? (
                                        <img src={lecture.thumbnailUrl} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-zinc-900 to-black flex items-center justify-center">
                                            <PlayCircle size={48} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                                        <button
                                            onClick={() => handleLectureClick(lecture.videoUrl, lecture.title)}
                                            className="px-6 py-2 bg-white text-black rounded-full font-bold uppercase text-xs tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-emerald-500 hover:text-white flex items-center gap-2"
                                        >
                                            <PlayCircle size={14} /> Watch Now
                                        </button>
                                    </div>
                                    <div className="absolute top-4 left-4 inline-flex px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                                        <span className="text-[10px] font-black uppercase text-white tracking-wider">{lecture.subject}</span>
                                    </div>

                                    {/* Principal Delete Operation */}
                                    {isPrincipal && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(lecture.id || lecture._id);
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/30 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Lecture"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                                            <BookOpen size={12} /> {lecture.grade}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                                            <Clock size={12} /> {new Date(lecture.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                                        {lecture.title}
                                    </h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                                        {lecture.description || `Interactive lecture session on ${lecture.topic} covering key concepts and exam preparation strategies.`}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                                                {lecture.uploadedBy?.[0] || 'T'}
                                            </div>
                                            <span className="text-xs font-medium text-zinc-500">{lecture.uploadedBy}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 bg-emerald-500/5 px-2 py-1 rounded-md">
                                            {lecture.topic}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && lectures.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-zinc-600 text-sm font-medium uppercase tracking-widest">No lectures found matching criteria</p>
                    </div>
                )}
            </main>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 flex justify-between items-center border-b border-white/5 bg-black/20">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 line-clamp-1">{selectedVideo.title}</h3>
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="aspect-video w-full bg-black">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${selectedVideo.url}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div><Footer /></>
    )
}
