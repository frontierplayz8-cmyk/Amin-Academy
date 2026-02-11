"use client"

import React, { useState, useEffect } from "react"
import {
    BookOpen,
    Plus,
    Trash2,
    Save,
    ChevronRight,
    Layers,
    AlertCircle,
    RotateCcw,
    Search,
    BookMarked,
    Edit2,
    Check,
    X as CloseIcon
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useAuthenticatedFetch } from "@/lib/useAuthenticatedFetch"
import { toast } from "sonner"
import { GRADES, STREAMS } from "@/app/lib/curriculum-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function CurriculumManagementPage() {
    const { profile, loading: authLoading } = useAuth()
    const { authFetch } = useAuthenticatedFetch()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [curriculumData, setCurriculumData] = useState<any>({})

    // Selection state
    const [selectedGrade, setSelectedGrade] = useState(GRADES[0])
    const [selectedSubject, setSelectedSubject] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [newChapter, setNewChapter] = useState("")
    const [editingChapterIdx, setEditingChapterIdx] = useState<number | null>(null)
    const [editingValue, setEditingValue] = useState("")

    useEffect(() => {
        fetchCurriculum()
    }, [])

    useEffect(() => {
        if (curriculumData[selectedGrade]) {
            const subjects = Object.keys(curriculumData[selectedGrade])
            if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
                setSelectedSubject(subjects[0])
            }
        }
    }, [selectedGrade, curriculumData])

    const fetchCurriculum = async () => {
        setLoading(true)
        try {
            const res = await authFetch("/api/admin/curriculum")
            if (res.ok) {
                const data = await res.json()
                setCurriculumData(data)
            } else {
                toast.error("Failed to load curriculum data")
            }
        } catch (error) {
            console.error(error)
            toast.error("Network error")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await authFetch("/api/admin/curriculum", {
                method: "POST",
                body: JSON.stringify(curriculumData)
            })
            if (res.ok) {
                toast.success("Curriculum updated successfully")
            } else {
                toast.error("Security check failed or server error")
            }
        } catch (error) {
            toast.error("Failed to sync with cloud")
        } finally {
            setSaving(false)
        }
    }

    const addChapter = () => {
        if (!newChapter.trim()) return
        if (!selectedGrade || !selectedSubject) return

        const currentChapters = curriculumData[selectedGrade][selectedSubject] || []
        if (currentChapters.includes(newChapter.trim())) {
            toast.error("Chapter already exists")
            return
        }

        const newData = { ...curriculumData }
        newData[selectedGrade][selectedSubject] = [...currentChapters, newChapter.trim()]
        setCurriculumData(newData)
        setNewChapter("")
        toast.info("Chapter added to local draft")
    }

    const removeChapter = (chapter: string) => {
        const newData = { ...curriculumData }
        newData[selectedGrade][selectedSubject] = newData[selectedGrade][selectedSubject].filter((c: string) => c !== chapter)
        setCurriculumData(newData)
    }

    const startEditing = (chapter: string, idx: number) => {
        setEditingChapterIdx(idx)
        setEditingValue(chapter)
    }

    const cancelEditing = () => {
        setEditingChapterIdx(null)
        setEditingValue("")
    }

    const saveEdit = (idx: number) => {
        if (!editingValue.trim()) return
        const newData = { ...curriculumData }
        const chapters = [...newData[selectedGrade][selectedSubject]]
        chapters[idx] = editingValue.trim()
        newData[selectedGrade][selectedSubject] = chapters
        setCurriculumData(newData)
        setEditingChapterIdx(null)
        setEditingValue("")
        toast.info("Chapter updated in local draft")
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Matrix...</p>
                </div>
            </div>
        )
    }

    if (profile?.ranks !== "Principal") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-3xl max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-white mb-2">ACCESS DENIED</h2>
                    <p className="text-zinc-400 text-sm">Only the Principal can reconfigure the academic curriculum matrix.</p>
                </div>
            </div>
        )
    }

    const currentSubjects = curriculumData[selectedGrade] ? Object.keys(curriculumData[selectedGrade]) : []
    const currentChapters = (selectedGrade && selectedSubject && curriculumData[selectedGrade])
        ? (curriculumData[selectedGrade][selectedSubject] || [])
        : []

    const filteredChapters = currentChapters.filter((c: string) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between text-white">
                <div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                        <BookMarked size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Academic Core</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">
                        Curriculum <span className="text-emerald-500">Architect</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2 font-medium">Reconfigure chapters and topics across all grades</p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchCurriculum}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6"
                    >
                        <RotateCcw className="mr-2 w-4 h-4" />
                        Reset
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-xl px-8 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                        ) : (
                            <Save className="mr-2 w-4 h-4" />
                        )}
                        Sync to Cloud
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
                {/* Navigation Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Grade Selection */}
                    <div className="bg-zinc-950/50 border border-white/5 rounded-3xl p-6 space-y-4 flex-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Academic Grade</Label>
                        <div className="flex flex-wrap gap-2">
                            {GRADES.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedGrade(g)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        selectedGrade === g
                                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            : "bg-white/2 border-white/5 text-zinc-600 hover:text-white"
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Subjects</Label>
                            <ScrollArea className="h-[250px] pr-4">
                                <div className="space-y-2">
                                    {currentSubjects.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedSubject(s)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                                                selectedSubject === s
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                    : "bg-white/2 border-white/5 text-zinc-500 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Layers size={16} className={selectedSubject === s ? "text-emerald-500" : "text-zinc-600"} />
                                                <span className="font-bold text-sm tracking-tight">{s}</span>
                                            </div>
                                            <ChevronRight size={14} className={cn("transition-transform", selectedSubject === s ? "translate-x-1" : "group-hover:translate-x-1")} />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                {/* Editor Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-zinc-950/50 border border-white/5 rounded-3xl p-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white italic">
                                    {selectedSubject || "Select a Subject"}
                                </h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">
                                    {selectedGrade} Unit Management
                                </p>
                            </div>

                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                                <Input
                                    placeholder="Filter units..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/2 border-white/5 rounded-xl pl-10 text-xs font-bold text-white focus:border-emerald-500/50"
                                />
                            </div>
                        </div>

                        {/* Add New Chapter */}
                        <div className="flex gap-3 mb-6">
                            <Input
                                placeholder="Enter unit name (e.g. Chapter 1: Basic Logic)..."
                                value={newChapter}
                                onChange={(e) => setNewChapter(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addChapter()}
                                className="bg-white/2 border-white/5 rounded-2xl h-14 px-6 text-sm font-bold text-white focus:border-emerald-500/50"
                            />
                            <Button
                                onClick={addChapter}
                                className="bg-white text-black hover:bg-white/90 font-black rounded-2xl h-14 px-8"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="ml-2">Add</span>
                            </Button>
                        </div>

                        {/* Chapter List */}
                        <ScrollArea className="flex-1 pr-4">
                            <div className="grid grid-cols-1 gap-3">
                                {filteredChapters.length > 0 ? (
                                    filteredChapters.map((chapter: string) => {
                                        const originalIdx = currentChapters.indexOf(chapter)
                                        const isEditing = editingChapterIdx === originalIdx

                                        return (
                                            <div
                                                key={chapter}
                                                className={cn(
                                                    "flex items-center justify-between p-5 bg-white/2 border border-white/5 rounded-2xl group transition-all",
                                                    isEditing ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-emerald-500/20 hover:bg-emerald-500/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/5 shrink-0">
                                                        #{originalIdx + 1}
                                                    </div>
                                                    {isEditing ? (
                                                        <Input
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(originalIdx)}
                                                            className="bg-zinc-900/50 border-emerald-500/30 text-sm font-bold h-10 px-4 focus:ring-1 ring-emerald-500"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold text-zinc-200">{chapter}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 ml-4">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => saveEdit(originalIdx)}
                                                                className="p-3 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors"
                                                            >
                                                                <Check size={18} />
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="p-3 text-zinc-500 hover:bg-white/5 rounded-xl transition-colors"
                                                            >
                                                                <CloseIcon size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => startEditing(chapter, originalIdx)}
                                                                className="p-3 text-zinc-600 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => removeChapter(chapter)}
                                                                className="p-3 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white/1 border border-dashed border-white/5 rounded-3xl">
                                        <BookOpen className="w-12 h-12 text-zinc-800 mb-4" />
                                        <p className="text-zinc-600 font-bold text-xs uppercase tracking-widest text-center">
                                            {searchQuery ? "No matching units found" : "No curriculum units projected for this subject"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-zinc-600">Total Units Programmed</span>
                            <span className="bg-zinc-900 px-3 py-1 rounded-full text-zinc-400 border border-white/5">
                                {currentChapters.length} Chapters
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
