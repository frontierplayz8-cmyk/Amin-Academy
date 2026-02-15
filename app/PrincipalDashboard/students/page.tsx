"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
    Plus,
    Filter,
    ChevronLeft,
    ChevronRight,
    Mail,
    Download,
    X,
    Phone,
    User as UserIcon,
    Star,
    Clock,
    Camera,
    Droplets,
    Edit3,
    ShieldAlert,
    ExternalLink,
    UploadCloud,
    FileText,
    Search,
    RefreshCcw,
    CheckCircle2,
    MessageCircle,
    MoreHorizontal,
    CreditCard,
    UsersIcon,
    Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuthenticatedFetch } from '@/lib/useAuthenticatedFetch'
import { Card, CardContent } from '@/components/ui/card'

export default function StudentRoster() {
    const [search, setSearch] = useState('')
    const [gradeFilter, setGradeFilter] = useState('All')
    const [selected, setSelected] = useState<string[]>([])
    const [detailStudent, setDetailStudent] = useState<any | null>(null)
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDeployOpen, setIsDeployOpen] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { authFetch, user: authUser, loading: authLoading } = useAuthenticatedFetch()
    const { profile } = useAuth()
    const router = useRouter()
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!url) return reject(new Error("No URL provided"));
            if (url.startsWith('data:')) return resolve(url);

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL("image/png"));
                    } else {
                        reject(new Error("Canvas context null"));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error(`Failed to load: ${url}`));
            img.src = url;
        });
    };

    // Form State for Deploy
    const [formData, setFormData] = useState({
        name: '',
        rollNumber: '',
        email: '',
        grade: '',
        section: 'A',
        fatherName: '',
        contactNumber: '',
        bloodGroup: '',
        imageUrl: '',
        feeStatus: 'Pending',
        feeAmount: 5500,
        performance: 3
    })

    const fetchStudents = async () => {
        try {
            setLoading(true)
            const res = await authFetch('/api/admin/students')
            const data = await res.json()
            if (data.success) {
                setStudents(data.students || [])
            } else {
                toast.error(data.message || "Failed to load students")
            }
        } catch (error) {
            console.error("Fetch Error:", error)
            toast.error("Network error: Failed to sync with matrix")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            if (authUser && (profile?.ranks === 'Principal' || profile?.ranks === 'Teacher')) {
                fetchStudents()
            } else if (!authUser) {
                router.push('/login')
            }
        }
    }, [authLoading, authUser, profile])

    const filteredStudents = useMemo(() => {
        if (!students) return []
        return students.filter(s => {
            const name = s.name?.toLowerCase() || ''
            const roll = s.rollNumber?.toLowerCase() || ''
            const query = search.toLowerCase().trim()

            const matchesSearch = name.includes(query) || roll.includes(query)
            const matchesGrade = gradeFilter === 'All' || s.grade === gradeFilter

            return matchesSearch && matchesGrade
        })
    }, [search, gradeFilter, students])

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault()
        const loadingToast = toast.loading("Deploying identity to cloud...")
        try {
            const res = await authFetch('/api/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Student deployed to Server", { id: loadingToast })
                setIsDeployOpen(false)
                resetForm()
                fetchStudents()
            } else {
                toast.error(data.message, { id: loadingToast })
            }
        } catch (error) {
            toast.error("Deployment failed check network connection", { id: loadingToast })
        }
    }

    const handleQuickUpdate = async (studentId: string, updates: any) => {
        try {
            const res = await authFetch('/api/admin/students', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, updates })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s))
                if (detailStudent?.id === studentId) {
                    setDetailStudent({ ...detailStudent, ...updates })
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Communication failure with student node")
        }
    }

    const handleDelete = async (studentId: string) => {
        const loadingToast = toast.loading("Deleting student ...")
        try {
            const res = await authFetch(`/api/admin/students?studentId=${studentId}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message, { id: loadingToast })
                setDetailStudent(null)
                fetchStudents()
                setIsDeleteConfirmOpen(false)
            } else {
                toast.error(data.message, { id: loadingToast })
            }
        } catch (error) {
            toast.error("Purge failed. Matrix connection interrupted.", { id: loadingToast })
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit for original file
                toast.error("Image too large (Max 5MB)")
                return
            }

            if (!file.type.startsWith('image/')) {
                toast.error("Please select an image file")
                return
            }

            toast.loading("Compressing image...", { id: 'img-load' })

            // Create an image element to compress
            const img = new Image()
            img.onload = () => {
                // Create canvas for compression
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                // Calculate new dimensions (max 400x400 while maintaining aspect ratio)
                const maxSize = 400
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width
                        width = maxSize
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height
                        height = maxSize
                    }
                }

                canvas.width = width
                canvas.height = height

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height)

                // Convert to base64 with compression (0.7 = 70% quality)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)

                // Check if still too large (Firestore limit is ~1MB)
                if (compressedDataUrl.length > 900000) { // ~900KB to be safe
                    toast.error("Image still too large after compression. Try a smaller image.", { id: 'img-load' })
                    return
                }

                setFormData({ ...formData, imageUrl: compressedDataUrl })
                toast.success("Profile image compressed and ready", { id: 'img-load' })
            }

            img.onerror = () => {
                toast.error("Failed to load image", { id: 'img-load' })
            }

            // Read file as data URL to load into image
            const reader = new FileReader()
            reader.onload = (e) => {
                img.src = e.target?.result as string
            }
            reader.readAsDataURL(file)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            rollNumber: '',
            email: '',
            grade: '',
            section: 'A',
            fatherName: '',
            contactNumber: '',
            bloodGroup: '',
            imageUrl: '',
            feeStatus: 'Pending',
            feeAmount: 5500,
            performance: 3
        })
    }

    const generateAIRemarks = async (student: any) => {
        try {
            setIsGeneratingAI(true)
            const res = await authFetch('/api/ai/report-remarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: student.name,
                    grade: student.grade,
                    performance: student.performance,
                    subjects: student.academicData?.marks || {}
                })
            })
            const data = await res.json()
            if (data.success) {
                handleQuickUpdate(student.id, {
                    academicData: {
                        ...(student.academicData || {}),
                        remarks: data.remarks
                    }
                })
                toast.success("AI Remarks Generated")
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Failed to connect to AI Mind")
        } finally {
            setIsGeneratingAI(false)
        }
    }

    const toggleSelect = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleAll = () => {
        if (selected.length === filteredStudents.length) setSelected([])
        else setSelected(filteredStudents.map(s => s.id))
    }

    const handleContact = (student: any, mode: 'tel' | 'wa' = 'tel') => {
        let rawNumber = student.contactNumber.replace(/\D/g, '')

        if (mode === 'wa') {
            if (rawNumber.startsWith('0')) {
                rawNumber = '92' + rawNumber.substring(1)
            }
            else if (rawNumber.length === 10 && rawNumber.startsWith('3')) {
                rawNumber = '92' + rawNumber
            }
            window.open(`https://wa.me/${rawNumber}`, '_blank')
        } else {
            window.location.href = `tel:${student.contactNumber}`
        }
    }

    const generatePDF = async (student: any) => {
        try {
            setIsExporting(true)
            const doc = new jsPDF();
            // ... (keeping PDF generation logic as is, it's specific)
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;

            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.5);
            doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

            // Add Header Logo
            try {
                const logoBase64 = await loadImageAsBase64('/academy-logo.png');
                doc.addImage(logoBase64, "PNG", margin, 18, 12, 12);
            } catch (e) {
                console.error("Failed to add logo to PDF", e);
                doc.setFillColor(16, 185, 129);
                doc.circle(margin + 5, 25, 4, 'F');
            }

            doc.setTextColor(20, 20, 20);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("AMIN ACADEMY", margin + 15, 28);

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(16, 185, 129);
            doc.text("EXCELLENCE IN DIGITAL EDUCATION", margin + 15, 33);
            doc.setFontSize(20);
            doc.setTextColor(200, 200, 200);
            doc.setFont("helvetica", "bold");
            doc.text("REPORT CARD", pageWidth - margin, 28, { align: "right" });

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`SESSION 2026-27 | TERM 1`, pageWidth - margin, 34, { align: "right" });
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.5);
            doc.line(margin, 40, pageWidth - margin, 40);

            const infoStartY = 55;
            if (student.imageUrl) {
                try {
                    const studentBase64 = await loadImageAsBase64(student.imageUrl);
                    // Use PNG as canvas returns PNG
                    doc.addImage(studentBase64, "PNG", margin, infoStartY, 30, 30);
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(margin, infoStartY, 30, 30, 2, 2);
                } catch (e) {
                    console.error("Failed to add student photo to PDF:", e);
                    doc.setFillColor(245, 245, 245);
                    doc.roundedRect(margin, infoStartY, 30, 30, 2, 2, 'F');
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("PHOTO", margin + 15, infoStartY + 18, { align: "center" });
                }
            } else {
                doc.setFillColor(245, 245, 245);
                doc.roundedRect(margin, infoStartY, 30, 30, 2, 2, 'F');
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text("PHOTO", margin + 15, infoStartY + 18, { align: "center" });
            }

            const col1X = margin + 40;
            const col2X = margin + 110;
            const lineHeight = 8;

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
            doc.text("STUDENT IDENTITY", col1X, infoStartY + 5);
            doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
            doc.text(student.name.toUpperCase(), col1X, infoStartY + 10);

            doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
            doc.text("ROLL NUMBER", col2X, infoStartY + 5);
            doc.setFont("helvetica", "bold"); doc.setTextColor(16, 185, 129);
            doc.text(student.rollNumber, col2X, infoStartY + 10);

            doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
            doc.text("ACADEMIC SECTOR", col1X, infoStartY + 20);
            doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
            doc.text(`${student.grade} - SECTION ${student.section}`, col1X, infoStartY + 25);

            doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
            doc.text("GUARDIAN", col2X, infoStartY + 20);
            doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
            doc.text(student.fatherName, col2X, infoStartY + 25);

            const tableY = 100;
            doc.setFontSize(11);
            doc.setTextColor(20, 20, 20);
            doc.setFont("helvetica", "bold");
            doc.text("ACADEMIC PERFORMANCE SUMMARY", margin, tableY - 5);
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(1);
            doc.line(margin, tableY - 2, margin + 60, tableY - 2);

            const perfData = [
                ["Performance Rank", `${student.performance}/5.0`, "EXCELLENT"],
                ["Attendance Record", `${student.attendance || '94'}%`, "CONSISTENT"],
                ["Financial Status", student.feeStatus.toUpperCase(), student.feeStatus === 'Paid' ? "CLEARED" : "OUTSTANDING"],
                ["Discipline Score", "A+", "EXEMPLARY"],
                ["Overall Projection", "SATISFACTORY", "PROMOTED"]
            ];

            let currentY = tableY;

            autoTable(doc, {
                startY: currentY,
                head: [['METRIC', 'VALUE', 'REMARKS']],
                body: perfData,
                theme: 'striped',
                headStyles: {
                    fillColor: [16, 185, 129],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'left'
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                    textColor: [60, 60, 60],
                    valign: 'middle'
                },
                alternateRowStyles: {
                    fillColor: [245, 250, 248]
                },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    2: { fontStyle: 'italic', textColor: [100, 100, 100] }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY;

            // Subject Marks Table
            const marksData = Object.entries(student.academicData?.marks || {}).map(([sub, mark]) => {
                const m = parseInt(mark as string) || 0;
                let grade = 'F';
                if (m >= 80) grade = 'A+';
                else if (m >= 70) grade = 'A';
                else if (m >= 60) grade = 'B';
                else if (m >= 50) grade = 'C';
                else if (m >= 40) grade = 'D';

                return [sub.toUpperCase(), `${m}/100`, grade, m >= 40 ? "PASSED" : "FAILED"];
            });

            if (marksData.length > 0) {
                const totalMarks = Object.values(student.academicData?.marks || {}).reduce((acc: number, cur: any) => acc + (parseInt(cur) || 0), 0);
                const avgPercentage = (totalMarks / (marksData.length * 100)) * 100;

                const footerRow = [
                    { content: 'TOTAL AGGREGATE', colSpan: 1, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                    { content: `${totalMarks}/${marksData.length * 100}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                    { content: `${avgPercentage.toFixed(1)}%`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                    { content: avgPercentage >= 40 ? 'QUALIFIED' : 'RETAINED', styles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: avgPercentage >= 40 ? [16, 185, 129] : [225, 29, 72] } }
                ];

                autoTable(doc, {
                    startY: currentY + 15,
                    head: [['SUBJECT', 'OBTAINED', 'GRADE', 'STATUS']],
                    body: [...marksData, footerRow] as any,
                    theme: 'grid',
                    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: { 0: { fontStyle: 'bold' } }
                });

                currentY = (doc as any).lastAutoTable.finalY;
            }

            // AI Counselor Remarks
            if (student.academicData?.remarks) {
                const remarksY = currentY + 15;
                doc.setFontSize(10);
                doc.setTextColor(16, 185, 129);
                doc.setFont("helvetica", "bold");
                doc.text("AI COUNSELOR QUALITATIVE ANALYSIS", margin, remarksY);

                doc.setDrawColor(230, 230, 230);
                doc.setFillColor(252, 252, 252);
                doc.roundedRect(margin, remarksY + 3, pageWidth - (margin * 2), 20, 3, 3, 'FD');

                doc.setFontSize(9);
                doc.setTextColor(60, 60, 60);
                doc.setFont("helvetica", "italic");
                const splitRemarks = doc.splitTextToSize(student.academicData.remarks, pageWidth - (margin * 2) - 10);
                doc.text(splitRemarks, margin + 5, remarksY + 10);
            }

            const sigY = pageHeight - 45;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, sigY, margin + 60, sigY);
            doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY);

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "bold");
            doc.text("CLASS TEACHER", margin, sigY + 5);
            doc.text("PRINCIPAL SIGNATURE & STAMP", pageWidth - margin, sigY + 5, { align: "right" });

            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text("This report is system generated and securely verified by Amin Academy Oversight.", pageWidth / 2, pageHeight - 15, { align: "center" });
            doc.save(`Amin_Academy_Report_${student.rollNumber}.pdf`);
            toast.success("Premium Report Exported");
        } catch (err: any) {
            console.error("PDF GENERATION ERROR:", err);
            toast.error(`Report failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsExporting(false)
        }
    }


    const handleBulkExport = async () => {
        if (selected.length === 0) {
            toast.error("No students selected")
            return
        }

        const loadingToast = toast.loading(`Generating ${selected.length} reports...`)
        try {
            for (const id of selected) {
                const student = students.find(s => s.id === id)
                if (student) await generatePDF(student)
            }
            toast.success("Bulk Export Complete", { id: loadingToast })
        } catch (error) {
            toast.error("Bulk synthesis failed", { id: loadingToast })
        }
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex mt-10 flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                        <UserIcon className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Identify Matrix</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        Student <span className="text-emerald-500 not-italic">ROSTER</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        Performance Oversight & Identity Management
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full justify-evenly">
                {/* Search */}
                <div className="relative w-full group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                        placeholder="Search identities..."
                        className="pl-10 h-14 bg-zinc-900/30 border-white/5 focus:border-emerald-500/50 focus-visible:ring-emerald-500/20 rounded-2xl placeholder:text-zinc-700 font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Grade Filter */}
                <Select value={gradeFilter} onValueChange={(val) => val && setGradeFilter(val)}>
                    <SelectTrigger className="w-[160px] bg-zinc-900/30 border-white/5 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-zinc-400 focus:ring-emerald-500/20">
                        <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-white/5 rounded-2xl">
                        <SelectItem value="All" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">All Grades</SelectItem>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(g => (
                            <SelectItem key={g} value={g.toString()} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">{`Grade ${g}`}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchStudents}
                    className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-emerald-500 transition-all"
                    title="Sync Matrix"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                </Button>

                {/* Add Student Dialog */}
                <Dialog open={isDeployOpen} onOpenChange={(val) => { setIsDeployOpen(val); if (!val) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="h-14 px-8 bg-white text-black hover:bg-emerald-500 hover:text-black font-black uppercase italic tracking-widest rounded-2xl">
                            <Plus className="mr-2 h-4 w-4" /> Deploy Student
                        </Button>
                    </DialogTrigger>
                    <DialogContent
                        className="max-w-2xl bg-zinc-950 border-white/5 text-zinc-100 rounded-[2.5rem] p-8"
                        onInteractOutside={(e) => {
                            // Prevent dialog from closing when clicking on Select dropdowns
                            const target = e.target as HTMLElement;
                            if (target.closest('[data-slot="select-content"]') || target.closest('[role="listbox"]')) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Identity Registration</DialogTitle>
                            <DialogDescription className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-2">
                                Injecting new node into the student performance matrix.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDeploy} className="space-y-2 mt-6">
                            {/* Image Upload */}
                            <div className="flex items-center justify-around">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-32 h-32 rounded-4xl bg-zinc-900/50 border-2 border-dashed border-white/5 hover:border-emerald-500/50 flex items-center justify-center cursor-pointer overflow-hidden relative group transition-all"
                                >
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Camera className="text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                                            <span className="text-[8px] font-black tracking-widest text-zinc-700 uppercase">Digitize</span>
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </div>
                                <div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Student Name</Label>
                                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-12 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Roll Number</Label>
                                        <Input required value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} className="h-12 bg-zinc-900/30 border-white/5 rounded-xl font-mono text-emerald-500 focus:border-emerald-500/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Guardian Name</Label>
                                    <Input required value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} className="h-12 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contact Number</Label>
                                    <Input required value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} className="h-12 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fee Amount (PKR)</Label>
                                    <Input type="number" required value={formData.feeAmount} onChange={e => setFormData({ ...formData, feeAmount: parseInt(e.target.value) || 0 })} className="h-12 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</Label>
                                    <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-12 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Grade</Label>
                                    <select
                                        required
                                        value={formData.grade}
                                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                        className="h-12 w-full bg-zinc-900/30 border border-white/5 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 text-zinc-100 px-3 outline-none transition-all"
                                    >
                                        <option value="" disabled>Select Grade</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                            <option key={g} value={g.toString()} className="bg-zinc-900">{`Grade ${g}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Section Node</Label>
                                    <select
                                        required
                                        value={formData.section}
                                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                        className="h-12 w-full bg-zinc-900/30 border border-white/5 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 text-zinc-100 px-3 outline-none transition-all"
                                    >
                                        <option value="A" className="bg-zinc-900">Section A</option>
                                        <option value="B" className="bg-zinc-900">Section B</option>
                                        <option value="C" className="bg-zinc-900">Section C</option>
                                    </select>
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsDeployOpen(false)} className="rounded-xl uppercase font-black tracking-widest text-[10px] hover:bg-white/5">Abort</Button>
                                <Button type="submit" className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs rounded-xl">Authorize & Deploy</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isDeleteConfirmOpen ? <><div>
                <Dialog>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Student</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this student?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} className="rounded-xl uppercase font-black tracking-widest text-[10px] hover:bg-white/5">Abort</Button>
                            <Button type="submit" className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs rounded-xl">Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div><Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                    <DialogContent className="max-w-md bg-zinc-950 border border-red-500/20 text-zinc-100 rounded-4xl p-8">
                        <DialogHeader className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                                <ShieldAlert className="w-8 h-8 text-red-500" />
                            </div>
                            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-red-500">
                                Confirm Deletion
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-2">
                                This action will permanently delist the student node from the central matrix. This cannot be undone.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-3 mt-8">
                            <Button
                                variant="destructive"
                                onClick={() => studentToDelete && handleDelete(studentToDelete)}
                                className="h-14 bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                Delete Student
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="h-12 text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl"
                            >
                                Cancel
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog></> : null}

            {/* 2. BULK ACTIONS & DATA TABLE */}
            <Card className="bg-[#080808]/50 border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col flex-1">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                className="border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black rounded-md"
                                checked={selected.length === filteredStudents.length && filteredStudents.length > 0}
                                onCheckedChange={toggleAll}
                            />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">{selected.length} Nodes Locked</span>
                        </div>
                        {selected.length > 0 && (
                            <div className="flex gap-2 animate-in slide-in-from-left duration-300">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleBulkExport}
                                    className="h-9 px-4 rounded-xl border-white/5 bg-zinc-900/50 text-[10px] uppercase font-black tracking-widest hover:bg-emerald-500 hover:text-black"
                                >
                                    <Download className="mr-2 h-3 w-3" /> Export Ledger
                                </Button>
                                <Button size="sm" variant="outline" className="h-9 px-4 rounded-xl border-white/5 bg-zinc-900/50 text-[10px] uppercase font-black tracking-widest hover:bg-emerald-500 hover:text-black">
                                    <Mail className="mr-2 h-3 w-3" /> Broadcast
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent text-[10px] uppercase font-black tracking-widest bg-white/2">
                                <TableHead className="w-12 pl-6"></TableHead>
                                <TableHead className="py-6">Node Identity</TableHead>
                                <TableHead className="hidden sm:table-cell">Roll Number</TableHead>
                                <TableHead className="hidden md:table-cell">Sector</TableHead>
                                <TableHead className="text-center">Fee protocol</TableHead>
                                <TableHead className="text-right hidden sm:table-cell pr-8">Performance Rank</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-emerald-500/50">
                                            <RefreshCcw className="h-8 w-8 animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Accessing Matrix...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-3 text-zinc-700">
                                            <ShieldAlert size={40} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Zero identities found in specified sector</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStudents.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        className="border-white/5 hover:bg-white/2 cursor-pointer group transition-all duration-300"
                                        onClick={() => setDetailStudent(student)}
                                    >
                                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                className="border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black rounded-md"
                                                checked={selected.includes(student.id)}
                                                onCheckedChange={() => toggleSelect(student.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-white/5 bg-zinc-950 rounded-xl">
                                                    <AvatarImage src={student.imageUrl} alt={student.name} className="object-cover" />
                                                    <AvatarFallback className="bg-emerald-500/10 text-emerald-500 font-black text-xs">
                                                        {student.name?.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-black uppercase italic tracking-tight text-sm group-hover:text-emerald-500 transition-colors">
                                                        {student.name}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                        {student.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell font-mono text-xs text-zinc-400">
                                            #{student.rollNumber}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className="bg-white/5 border-white/5 rounded-lg font-black text-[9px] uppercase tracking-tighter">
                                                Grade {student.grade}-{student.section}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${student.feeStatus === 'Paid' ? 'text-emerald-500' : 'text-rose-500'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${student.feeStatus === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {student.feeStatus}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right hidden sm:table-cell pr-8">
                                            <div className="flex items-center justify-end gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={10}
                                                        className={i < (student.performance || 0) ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-800'}
                                                    />
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Sector Depth: <span className="text-zinc-200">{filteredStudents.length} Active</span></p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/5 border border-white/5 rounded-xl hover:bg-emerald-500 hover:text-black transition-all">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/5 border border-white/5 rounded-xl hover:bg-emerald-500 hover:text-black transition-all">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Slide-over Panel (Sheet) */}
            <Sheet open={!!detailStudent} onOpenChange={(open) => {
                if (!open) {
                    setDetailStudent(null)
                    setIsEditMode(false)
                    setEditData(null)
                }
            }}>
                <SheetContent className="w-full sm:max-w-md bg-zinc-950 border-white/5 text-zinc-100 p-0 overflow-y-auto">
                    {detailStudent && (
                        <div className="flex flex-col h-full">
                            <div className="h-32 bg-linear-to-br from-emerald-500 to-emerald-900 relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setDetailStudent(null)
                                        setIsEditMode(false)
                                        setEditData(null)
                                    }}
                                    className="absolute top-4 right-4 text-white hover:bg-black/20"
                                >
                                    <X size={20} />
                                </Button>
                                {!isEditMode && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setIsEditMode(true)
                                            setEditData({ ...detailStudent })
                                        }}
                                        className="absolute top-4 right-16 text-white hover:bg-black/20"
                                    >
                                        <Edit3 size={20} />
                                    </Button>
                                )}
                            </div>

                            <div className="px-6 -mt-12 pb-10 flex-1">
                                <Avatar className="h-24 w-24 border-4 border-zinc-950 rounded-3xl mb-4 bg-zinc-900 shadow-2xl">
                                    <AvatarImage src={detailStudent.imageUrl} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-black">ST</AvatarFallback>
                                </Avatar>

                                {isEditMode ? (
                                    <>
                                        {/* Edit Mode */}
                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Student Name</Label>
                                                <Input
                                                    value={editData.name}
                                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                                    className="mt-2 h-10 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Roll Number</Label>
                                                <Input
                                                    value={editData.rollNumber}
                                                    onChange={e => setEditData({ ...editData, rollNumber: e.target.value })}
                                                    className="mt-2 h-10 bg-zinc-900/30 border-white/5 rounded-xl font-mono text-emerald-500 focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Grade</Label>
                                                    <select
                                                        value={editData.grade}
                                                        onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                                                        className="mt-2 h-10 w-full bg-zinc-900/30 border border-white/5 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 text-zinc-100 px-3 outline-none"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                                            <option key={g} value={g.toString()} className="bg-zinc-900">{`Grade ${g}`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Section</Label>
                                                    <select
                                                        value={editData.section}
                                                        onChange={(e) => setEditData({ ...editData, section: e.target.value })}
                                                        className="mt-2 h-10 w-full bg-zinc-900/30 border border-white/5 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 text-zinc-100 px-3 outline-none"
                                                    >
                                                        <option value="A" className="bg-zinc-900">Section A</option>
                                                        <option value="B" className="bg-zinc-900">Section B</option>
                                                        <option value="C" className="bg-zinc-900">Section C</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Guardian Name</Label>
                                                <Input
                                                    value={editData.fatherName}
                                                    onChange={e => setEditData({ ...editData, fatherName: e.target.value })}
                                                    className="mt-2 h-10 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contact Number</Label>
                                                <Input
                                                    value={editData.contactNumber}
                                                    onChange={e => setEditData({ ...editData, contactNumber: e.target.value })}
                                                    className="mt-2 h-10 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</Label>
                                                <Input
                                                    type="email"
                                                    value={editData.email}
                                                    onChange={e => setEditData({ ...editData, email: e.target.value })}
                                                    className="mt-2 h-10 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Blood Group</Label>
                                                <Input
                                                    value={editData.bloodGroup || ''}
                                                    onChange={e => setEditData({ ...editData, bloodGroup: e.target.value })}
                                                    placeholder="e.g., A+, B-, O+"
                                                    className="mt-2 h-10 bg-zinc-900/30 border-white/5 rounded-xl focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Performance Rating (1-5)</Label>
                                                <div className="flex gap-2 mt-2">
                                                    {[1, 2, 3, 4, 5].map(rating => (
                                                        <button
                                                            key={rating}
                                                            onClick={() => setEditData({ ...editData, performance: rating })}
                                                            className={`flex-1 h-10 rounded-xl font-black text-xs transition-all ${editData.performance === rating
                                                                ? 'bg-emerald-500 text-black'
                                                                : 'bg-zinc-900/30 border border-white/5 text-zinc-400 hover:bg-white/5'
                                                                }`}
                                                        >
                                                            {rating}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fee Status</Label>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => setEditData({ ...editData, feeStatus: 'Paid' })}
                                                        className={`flex-1 h-10 rounded-xl font-black text-xs transition-all ${editData.feeStatus === 'Paid'
                                                            ? 'bg-emerald-500 text-black'
                                                            : 'bg-zinc-900/30 border border-white/5 text-zinc-400 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        Paid
                                                    </button>
                                                    <button
                                                        onClick={() => setEditData({ ...editData, feeStatus: 'Pending' })}
                                                        className={`flex-1 h-10 rounded-xl font-black text-xs transition-all ${editData.feeStatus === 'Pending'
                                                            ? 'bg-rose-500 text-white'
                                                            : 'bg-zinc-900/30 border border-white/5 text-zinc-400 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        Pending
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-8">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsEditMode(false)
                                                    setEditData(null)
                                                }}
                                                className="bg-zinc-900/50 border-white/5 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest rounded-xl"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    handleQuickUpdate(detailStudent.id, editData)
                                                    setIsEditMode(false)
                                                    setEditData(null)
                                                }}
                                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl"
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* View Mode */}
                                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">{detailStudent.name}</h2>
                                        <p className="text-emerald-500 font-mono text-sm uppercase tracking-widest mb-6">ID: {detailStudent.rollNumber}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-8">
                                            <Button onClick={() => handleContact(detailStudent, 'wa')} className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase text-[10px] tracking-widest rounded-xl">
                                                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                            </Button>
                                            <Button
                                                onClick={() => generatePDF(detailStudent)}
                                                disabled={isExporting}
                                                className="bg-white text-black hover:bg-emerald-500 font-black uppercase text-[10px] tracking-widest rounded-xl"
                                            >
                                                {isExporting ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                                {isExporting ? 'Exporting...' : 'Export Report'}
                                            </Button>
                                        </div>

                                        <div className="space-y-6">
                                            <section>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Academic Data</h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={isGeneratingAI}
                                                        onClick={() => generateAIRemarks(detailStudent)}
                                                        className="h-8 text-[9px] uppercase font-black bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg px-3"
                                                    >
                                                        {isGeneratingAI ? <RefreshCcw className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                                        {detailStudent.academicData?.remarks ? 'Regenerate Remarks' : 'AI Analysis'}
                                                    </Button>
                                                </div>

                                                {detailStudent.academicData?.remarks && (
                                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-4">
                                                        <p className="text-xs text-zinc-300 italic leading-relaxed">
                                                            "{detailStudent.academicData.remarks}"
                                                        </p>
                                                        <p className="text-[8px] uppercase font-black text-emerald-500/50 mt-2 tracking-widest">
                                                            — AI Counselor Insight
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    {['English', 'Urdu', 'Math', 'Science'].map(subject => (
                                                        <div key={subject} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
                                                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{subject}</span>
                                                            <div className="flex items-center justify-between">
                                                                <input
                                                                    type="number"
                                                                    max="100"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    value={detailStudent.academicData?.marks?.[subject] || ''}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        handleQuickUpdate(detailStudent.id, {
                                                                            academicData: {
                                                                                ...(detailStudent.academicData || {}),
                                                                                marks: {
                                                                                    ...(detailStudent.academicData?.marks || {}),
                                                                                    [subject]: val
                                                                                }
                                                                            }
                                                                        })
                                                                    }}
                                                                    className="bg-transparent text-lg font-black text-emerald-500 w-16 outline-none"
                                                                />
                                                                <span className="text-[10px] font-bold text-zinc-700">/ 100</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                            <section>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Student Enrollment</h3>
                                                <div className="grid gap-4 bg-white/2 p-4 rounded-2xl border border-white/5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Grade & Section</span>
                                                        <span className="font-black text-xs uppercase italic">Grade {detailStudent.grade}-{detailStudent.section}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Performance</span>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={12}
                                                                    className={i < (detailStudent.performance || 0) ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-800'}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Fee Status</span>
                                                        <Badge className={detailStudent.feeStatus === 'Paid' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}>
                                                            {detailStudent.feeStatus}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Guardian Information</h3>
                                                <div className="grid gap-3">
                                                    <div className="flex items-center gap-3 text-zinc-300">
                                                        <Mail size={16} className="text-emerald-500" />
                                                        <span className="text-xs font-bold">{detailStudent.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-zinc-300">
                                                        <UsersIcon size={16} className="text-emerald-500" />
                                                        <span className="text-xs font-bold">{detailStudent.fatherName} (Guardian)</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-zinc-300">
                                                        <Phone size={16} className="text-emerald-500" />
                                                        <span className="text-xs font-bold">{detailStudent.contactNumber}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-zinc-300">
                                                        <Droplets size={16} className="text-rose-500" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Blood Group: {detailStudent.bloodGroup || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </>
                                )}

                                <div className="mt-10 pt-6 border-t border-white/5">
                                    <Button
                                        variant="destructive"
                                        className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] italic py-6"
                                        onClick={() => {
                                            setStudentToDelete(detailStudent.id);
                                            setIsDeleteConfirmOpen(true);
                                        }}
                                    >
                                        <ShieldAlert className="mr-2 h-4 w-4" /> Delete Student
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
