"use client";

import React, { useState } from 'react';
import {
    BookOpen,
    FileText,
    Search,
    Trash2,
    FileDown,
    Loader2,
    Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { searchPastPapersAction, deletePastPaperAction } from '@/app/actions/past-paper-actions';
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const UploadPaperModal = dynamic(() => import('./UploadPaperModal'), {
    loading: () => <div className="sr-only">Loading Modal...</div>,
    ssr: false
});

const BOARDS = [
    "BISE Lahore", "BISE Gujranwala", "BISE Rawalpindi",
    "BISE Faisalabad", "BISE Multan", "BISE Sargodha",
    "BISE Bahawalpur", "BISE DG Khan", "BISE Sahiwal"
];

const CLASSES = ["9th", "10th", "11th", "12th"];
const SESSIONS = ["Annual", "Supplementary"];
const YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const GET_SUBJECTS = (cls: string) => {
    return ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "English", "Urdu", "Islamiat", "Pak Studies"];
};

export default function PastPapers() {
    const router = useRouter();
    const { profile } = useAuth();
    const [isSearching, setIsSearching] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const canManage = profile?.ranks === 'Principal' || profile?.ranks === 'Teacher';

    const [config, setConfig] = useState({
        board: 'BISE Lahore',
        grade: '10th',
        subject: 'Physics',
        year: '2024',
        session: 'Annual',
        group: 'Group 1',
    });

    const openUploadModal = () => {
        setShowUploadModal(true);
    };

    const handleSearch = async () => {
        setIsSearching(true);
        const tid = toast.loading("Searching archive...");
        try {
            const res = await searchPastPapersAction({
                board: config.board,
                grade: config.grade,
                subject: config.subject,
                year: config.year
            });

            if (res.success) {
                setSearchResults(res.papers || []);
                if (res.papers?.length === 0) {
                    toast.info("No papers found for these filters.", { id: tid });
                } else {
                    toast.success(`Found ${res.papers.length} papers.`, { id: tid });
                }
            } else {
                toast.error(res.error || "Search failed", { id: tid });
            }
        } catch (error) {
            toast.error("Network error during search", { id: tid });
        } finally {
            setIsSearching(false);
        }
    };




    const handleDelete = async (paperId: string) => {
        if (!confirm("Are you sure you want to delete this paper and its PDF? This cannot be undone.")) return;

        setIsDeleting(paperId);
        const tid = toast.loading("Nuclear Deletion in Progress...");

        try {
            const res = await deletePastPaperAction(paperId);
            if (res.success) {
                toast.success("Record and file purged successfully", { id: tid });
                setSearchResults(prev => prev.filter(p => p.id !== paperId));
            } else {
                toast.error(res.error || "Purge failed", { id: tid });
            }
        } catch (error) {
            console.error("Deletion System Error:", error);
            toast.error("System error during deletion", { id: tid });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#050505] text-zinc-100 font-sans overflow-x-hidden">
            <div className="flex flex-col p-6 lg:p-12 max-w-[1400px] mx-auto w-full">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <BookOpen size={28} className="text-emerald-500" />
                            <h1 className="text-3xl font-bold tracking-tight text-white uppercase">Past Papers Archive</h1>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">Manage and access digital examination records.</p>
                    </div>

                    {canManage && (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/PrincipalDashboard/ai-logs/view-paper')}
                                className="border-white/10 hover:bg-zinc-800 text-zinc-300 font-bold h-12 px-6 rounded-xl"
                            >
                                View Last Generated
                            </Button>
                            <Button
                                onClick={openUploadModal}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-xl"
                            >
                                <Plus size={20} className="mr-2" />
                                Upload Paper
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Filter Sidebar */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Filters</h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="board-select" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block ml-1">Board</label>
                                    <select
                                        id="board-select"
                                        value={config.board}
                                        onChange={(e) => setConfig({ ...config, board: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                                    >
                                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block ml-1">Grade</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CLASSES.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setConfig({ ...config, grade: c })}
                                                className={cn(
                                                    "py-3 rounded-xl text-xs font-bold uppercase",
                                                    config.grade === c
                                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
                                                )}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="year-select" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block ml-1">Year</label>
                                    <select
                                        id="year-select"
                                        value={config.year}
                                        onChange={(e) => setConfig({ ...config, year: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                                    >
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject-select" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block ml-1">Subject</label>
                                    <select
                                        id="subject-select"
                                        value={config.subject}
                                        onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                                    >
                                        {GET_SUBJECTS(config.grade).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <Button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-12 rounded-xl mt-4"
                                >
                                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : "Apply Filters"}
                                </Button>
                            </div>
                        </div>


                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-9">
                        {searchResults.length === 0 ? (
                            <div className="h-full min-h-[400px] border border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center p-12">
                                <Search size={48} className="text-zinc-800 mb-6" />
                                <h3 className="text-xl font-bold text-zinc-300">No papers found</h3>
                                <p className="text-zinc-600 max-w-sm mt-2">Adjust your filters or upload a new paper to start building your archive.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                {searchResults.map((paper) => (
                                    <div key={paper.id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-zinc-800 rounded-xl">
                                                    <FileText size={20} className="text-emerald-500" />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] items-center font-bold px-3 py-1 bg-zinc-800 rounded-full text-zinc-400 uppercase tracking-widest">
                                                    {paper.board}
                                                </span>
                                                <div className="text-lg font-bold text-white mt-1">
                                                    {paper.year} • {paper.session}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-xl font-bold text-white group-hover:text-emerald-500">
                                                {paper.subject}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-zinc-500">Class {paper.grade}</span>
                                                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                                <span className="text-xs font-medium text-zinc-500">{paper.group}</span>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "grid gap-3",
                                            canManage ? "grid-cols-2" : "grid-cols-1"
                                        )}>
                                            <a
                                                href={paper.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`View ${paper.subject} PDF`}
                                                className={cn(
                                                    buttonVariants({ variant: "outline" }),
                                                    "border-white/10 hover:bg-zinc-800 text-xs font-bold h-11 rounded-xl cursor-pointer flex items-center justify-center w-full"
                                                )}
                                            >
                                                <FileDown size={14} className="mr-2" />
                                                View {paper.subject} PDF
                                            </a>
                                            {canManage && (
                                                <button
                                                    aria-label="Delete Record"
                                                    onClick={() => handleDelete(paper.id)}
                                                    disabled={isDeleting === paper.id}
                                                    className="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-lg flex items-center justify-center transition-colors border border-white/5"
                                                >
                                                    {isDeleting === paper.id ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Trash2 size={16} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Modal - Higher Z-Index and Better Alignment */}
                <UploadPaperModal
                    show={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        handleSearch();
                    }}
                    initialConfig={config}
                    boards={BOARDS}
                    classes={CLASSES}
                    years={YEARS}
                    sessions={SESSIONS}
                    getSubjects={GET_SUBJECTS}
                />
            </div>
        </div>
    );
}