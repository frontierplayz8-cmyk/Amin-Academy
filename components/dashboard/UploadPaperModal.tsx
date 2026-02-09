"use client";

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { UploadButton } from '@/lib/uploadthing';
import { uploadPastPaperAction } from '@/app/actions/past-paper-actions';

interface UploadPaperModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialConfig: any;
    boards: string[];
    classes: string[];
    years: string[];
    sessions: string[];
    getSubjects: (cls: string) => string[];
}

export default function UploadPaperModal({
    show,
    onClose,
    onSuccess,
    initialConfig,
    boards,
    classes,
    years,
    sessions,
    getSubjects
}: UploadPaperModalProps) {
    const [uploadConfig, setUploadConfig] = useState(initialConfig);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-8 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0c0c0d] border border-white/10 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="px-10 py-8 border-b border-white/5 flex justify-between items-start">
                    <div className="flex items-start gap-5">
                        <div className="p-3 bg-emerald-500/10 rounded-xl mt-1">
                            <Upload className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Upload Past Paper</h3>
                            <p className="text-sm font-medium text-zinc-500 mt-1">Complete metadata profile for manual archival ingestion.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white border border-white/5"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <form className="space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                            {/* Form Fields */}
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block ml-1">Examination Board</label>
                                    <select
                                        value={uploadConfig.board}
                                        onChange={(e) => setUploadConfig({ ...uploadConfig, board: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {boards.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block ml-1">Grade</label>
                                        <select
                                            value={uploadConfig.grade}
                                            onChange={(e) => setUploadConfig({ ...uploadConfig, grade: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block ml-1">Year</label>
                                        <select
                                            value={uploadConfig.year}
                                            onChange={(e) => setUploadConfig({ ...uploadConfig, year: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block ml-1">Subject</label>
                                    <select
                                        value={uploadConfig.subject}
                                        onChange={(e) => setUploadConfig({ ...uploadConfig, subject: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {getSubjects(uploadConfig.grade).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block ml-1">Session</label>
                                        <select
                                            value={uploadConfig.session}
                                            onChange={(e) => setUploadConfig({ ...uploadConfig, session: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block ml-1">Group</label>
                                        <select
                                            value={uploadConfig.group}
                                            onChange={(e) => setUploadConfig({ ...uploadConfig, group: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            {["Group 1", "Group 2"].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* File Dropzone */}
                            <div className="flex flex-col min-h-full items-center justify-center border-2 border-dashed border-white/10 rounded-[32px] p-10 bg-black/20 group">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-6">PDF Source Material</div>

                                <UploadButton
                                    endpoint="pastPaperUploader"
                                    onClientUploadComplete={async (res: any[]) => {
                                        if (res?.[0]) {
                                            const tid = toast.loading("Finalizing record...");
                                            const formData = new FormData();
                                            Object.entries(uploadConfig).forEach(([key, val]) => formData.append(key, val as string));

                                            const result = await uploadPastPaperAction(formData, res[0].url);
                                            if (result.success) {
                                                toast.success("Paper archived successfully", { id: tid });
                                                onSuccess();
                                            } else {
                                                toast.error(result.error || "Failed to save metadata", { id: tid });
                                            }
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        toast.error(`Error: ${error.message}`);
                                    }}
                                    appearance={{
                                        button: "bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] h-16 w-full rounded-2xl text-xs shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] border-none",
                                        allowedContent: "text-zinc-500 text-[10px] uppercase font-bold mt-2"
                                    }}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
