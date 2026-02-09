"use client"

import { useState } from "react"
import { X, Upload, Shield, FileText, Image as ImageIcon, File, Tag } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { useUploadThing } from "@/lib/uploadthing"

interface ManualPaperUploadModalProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    onSuccess: () => void
}

const AVAILABLE_TAGS = [
    "Notes",
    "Guess Papers",
    "Past Papers",
    "Practice Tests",
    "Worksheets",
    "Study Material",
    "Revision Notes"
]

export default function ManualPaperUploadModal({ isOpen, setIsOpen, onSuccess }: ManualPaperUploadModalProps) {
    const { startUpload, isUploading } = useUploadThing("vaultUploader")
    const [files, setFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({
        title: "",
        subject: "",
        grade: "Class 10",
        tags: [] as string[]
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            const validFiles = selectedFiles.filter(file => {
                const isValid = file.type === 'application/pdf' || file.type.startsWith('image/')
                if (!isValid) {
                    toast.error(`${file.name} is not a valid file type`)
                }
                return isValid
            })
            setFiles(validFiles)
        }
    }

    const toggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (files.length === 0) {
            toast.error("Please select at least one file to upload")
            return
        }

        if (formData.tags.length === 0) {
            toast.error("Please select at least one tag")
            return
        }

        const toastId = toast.loading("Uploading files to secure vault...")

        try {
            const uploadRes = await startUpload(files)

            if (!uploadRes) {
                throw new Error("Upload failed")
            }

            const fileUrls = uploadRes.map((res: { url: string }) => res.url)
            const fileType = files[0].type === 'application/pdf' ? 'pdf' : 'image'

            // Save metadata to Firestore
            await addDoc(collection(db, 'examPapers'), {
                title: formData.title,
                subject: formData.subject,
                grade: formData.grade,
                tags: formData.tags,
                fileType,
                fileUrls,
                isManualUpload: true,
                uploadedBy: 'Principal', // You can get this from auth context
                createdAt: new Date().toISOString()
            })

            toast.success(`${files.length} file(s) uploaded successfully`, { id: toastId })
            setIsOpen(false)
            setFormData({ title: "", subject: "", grade: "Class 10", tags: [] })
            setFiles([])
            onSuccess()
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error("Failed to upload files: " + error.message, { id: toastId })
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-white/5 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="p-8 border-b border-white/5 relative bg-white/2 sticky top-0 z-10 backdrop-blur-xl">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Upload <span className="text-emerald-500">Documents</span></h2>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                                <Shield size={12} className="text-emerald-500" />
                                PDF & Images Supported
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Upload Files</label>
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                accept=".pdf,image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="w-full bg-zinc-900 border-2 border-dashed border-white/10 rounded-2xl py-8 px-6 text-xs font-bold text-zinc-500 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col items-center gap-3 group"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <File size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-black uppercase tracking-wider">Click to upload files</p>
                                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">PDF or Images (JPG, PNG)</p>
                                </div>
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Selected Files ({files.length}):</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 rounded-xl p-3">
                                            {file.type === 'application/pdf' ? (
                                                <FileText size={16} className="text-red-500" />
                                            ) : (
                                                <ImageIcon size={16} className="text-blue-500" />
                                            )}
                                            <span className="text-xs text-zinc-400 flex-1 truncate">{file.name}</span>
                                            <span className="text-[10px] text-zinc-600">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Document Title</label>
                        <div className="relative group">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-500" size={16} />
                            <input
                                required
                                type="text"
                                placeholder="e.g. Mid-Term Biology Notes"
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Subject & Grade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Subject</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Biology"
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Class</label>
                            <select
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                    <option key={g} value={`Class ${g}`}>{`Class ${g}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1 flex items-center gap-2">
                            <Tag size={12} className="text-emerald-500" />
                            Select Tags (Required)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.tags.includes(tag)
                                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                        : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-emerald-500/30'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 bg-zinc-900 border border-white/5 text-zinc-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isUploading}
                            type="submit"
                            className="flex-2 bg-emerald-600 hover:bg-emerald-500 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isUploading ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Shield size={16} />
                                    Upload to Vault
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
