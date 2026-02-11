"use client"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
// Dynamic Imports
import dynamic from 'next/dynamic'
const ExamGeneratorModal = dynamic(() => import('@/components/ExamGeneratorModal'), { ssr: false })
const ManualPaperUploadModal = dynamic(() => import('@/components/ManualPaperUploadModal'), { ssr: false })

import {
    Shield,
    FileText,
    Clock,
    CreditCard,
    Search,
    Upload,
    SearchX,
    RefreshCw,
    Trash2,
    Eye,
    Zap,
    Users,
    Activity,
    Database,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    XCircle,
    Banknote,
    Lock,
    Brain,
    Timer,
    FileDown,
    MessageSquare,
    Loader2,
    Download
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, where, writeBatch, doc } from "firebase/firestore"
import { useVirtualizer } from '@tanstack/react-virtual'
import SystemHealth from "@/components/dashboard/SystemHealth"

export default function RecordsManagement() {
    const router = useRouter()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('vault')
    const [vaultSearch, setVaultSearch] = useState('')
    const [gradeFilter, setGradeFilter] = useState('All')
    const [yearFilter, setYearFilter] = useState('All')
    const [tagFilter, setTagFilter] = useState('All')

    const [vaultData, setVaultData] = useState<any[]>([])
    const [staffData, setStaffData] = useState<any[]>([])

    const [loading, setLoading] = useState(true)
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [reuseConfig, setReuseConfig] = useState<any>(null)

    const handleReusePaper = (config: any) => {
        if (!config) {
            toast.error("No configuration found for this paper")
            return
        }
        setReuseConfig(config)
        setIsGeneratorOpen(true)
    }



    // Real-time Data Listeners
    useEffect(() => {
        if (!user) return

        setLoading(true)
        const unsubscribes: (() => void)[] = []

        // 1. Vault Data Listener (Real-time)
        const examsQuery = query(collection(db, 'examPapers'), orderBy('createdAt', 'desc'))
        unsubscribes.push(onSnapshot(examsQuery, (snapshot) => {
            const papers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                grade: doc.data().grade?.includes('Grade') ? doc.data().grade.split(' ')[0] : doc.data().grade,
                date: doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleDateString() : 'N/A',
                year: doc.data().createdAt ? new Date(doc.data().createdAt).getFullYear().toString() : 'N/A',
                data: doc.data().content
            }))
            setVaultData(papers)
        }))

        // 2. Staff & Attendance Listener
        // Note: For complex aggregation like "attendance percentage", cloud functions are better.
        // Here we simulate real-time by listening to 'users' and fetching attendance history on change.
        // Ideally, 'attendance' would be a separate listener, but we'll fetch for now to keep it simple or listen to a 'stats' collection.
        // For this refactor, let's keep the fetch logic for heavy calculation but trigger it on mount.
        // To make it truly real-time updates for status:
        const usersQuery = query(collection(db, 'users'), where('ranks', '==', 'Teacher'))
        unsubscribes.push(onSnapshot(usersQuery, async (snapshot) => {
            // We still need the history fetch for calculations, but we can verify user existence here.
            // For the sake of the prompt "Real-Time Architecture", let's re-fetch the history API
            // when the user list changes to get fresh stats.
            try {
                const token = await user.getIdToken()
                const historyRes = await fetch('/api/admin/attendance/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const historyData = await historyRes.json()

                if (historyData.success) {
                    const mappedStaff = historyData.staffStats.map((s: any) => {
                        const baseSalary = s.salary || 0
                        // Fix: Calculate daily wage for deduction instead of fixed 1500
                        const dailyWage = baseSalary > 0 ? Math.round(baseSalary / 30) : 1500
                        const deductions = s.absentCount * dailyWage
                        const netPayable = Math.max(0, baseSalary - deductions)

                        // Fix: Active days should be total relevant days (Present + Absent). Ignore 'None' (holidays/unmarked).
                        // If days are 0, avoid division by zero.
                        const activeDays = (s.presentCount + s.absentCount) || 1
                        const attendanceRate = Math.round((s.presentCount / activeDays) * 100)

                        const todayRecord = s.history[s.history.length - 1]
                        const todayStatus = todayRecord.status === 'None' ? 'Off-Duty' : todayRecord.status

                        return {
                            id: s.teacherId,
                            name: s.username,
                            designation: s.designation,
                            attendance: attendanceRate,
                            todayStatus: todayStatus,
                            history: s.history,
                            baseSalary,
                            deductions,
                            netPayable,
                            status: s.id ? 'Paid' : 'Pending', // Mock status check
                            image: `https://avatar.iran.liara.run/public/boy?username=${s.username}`
                        }
                    })
                    setStaffData(mappedStaff)
                }
            } catch (e) { console.error("Realtime fetch error", e) }
        }))

        setLoading(false)

        return () => unsubscribes.forEach(unsub => unsub())
    }, [user])






    const handleDeletePaper = async (id: string) => {
        try {
            const token = await user?.getIdToken()
            const res = await fetch(`/api/admin/exams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Paper deleted from database")
            } else {
                toast.error(data.message)
            }
        } catch (e) {
            toast.error("Delete failed")
        }
    }

    const filteredVault = useMemo(() => {
        return vaultData.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
                doc.subject.toLowerCase().includes(vaultSearch.toLowerCase()) ||
                (doc.tags && doc.tags.some((tag: string) => tag.toLowerCase().includes(vaultSearch.toLowerCase())))
            const matchesGrade = gradeFilter === 'All' || doc.grade.includes(gradeFilter)
            const matchesYear = yearFilter === 'All' || doc.year === yearFilter
            const matchesTag = tagFilter === 'All' || (doc.tags && doc.tags.includes(tagFilter))
            return matchesSearch && matchesGrade && matchesYear && matchesTag
        })
    }, [vaultSearch, gradeFilter, yearFilter, tagFilter, vaultData])

    const uniqueTags = useMemo(() => {
        const allTags = vaultData.flatMap((doc: any) => doc.tags || [])
        return [...new Set(allTags)]
    }, [vaultData])

    const handleViewPaper = (doc: any) => {
        // localStorage.setItem('lastGeneratedPaper', JSON.stringify(doc.data))
        router.push(`/paper-editor?id=${doc.id}`)
    }

    // Metrics
    const metrics = [
        { label: "Vault Indices", value: vaultData.length, trend: "+12%", icon: Database, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Avg Attendance", value: `${Math.round(staffData.reduce((acc, s) => acc + s.attendance, 0) / (staffData.length || 1))}%`, trend: "Stable", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Pending Payroll", value: `PKR ${(staffData.reduce((acc, p) => acc + p.netPayable, 0) / 1000).toFixed(1)}K`, trend: "Next: 1st", icon: Banknote, color: "text-amber-500", bg: "bg-amber-500/10" }
    ]



    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto w-full">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "DataCatalog",
                        "name": "Academic Records Vault",
                        "description": "Secure repository for institutional examination papers and staff records.",
                        "dataset": vaultData.map(d => ({
                            "@type": "Dataset",
                            "name": d.title,
                            "description": d.subject
                        }))
                    })
                }}
            />

            {/* Header Section */}
            <div className="flex flex-col gap-8 lg:items-center lg:justify-between w-full">
                <div className="space-y-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Institutional Oversight</span>
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            Academic <span className="text-emerald-500 not-italic">RECORDS</span>
                        </h1>
                        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2 max-w-lg leading-relaxed">
                            <Lock size={12} className="text-emerald-500/50" />
                            Centrally managed secure registry for examination vault, faculty payroll, and attendance analytics.
                        </p>
                    </div>
                </div>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto self-center">
                    {metrics.map((m, i) => (
                        <div key={i} className="p-5 rounded-[2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-md lg:min-w-[180px] group hover:border-emerald-500/20 transition-all duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-xl", m.bg, m.color)}>
                                    <m.icon size={20} />
                                </div>
                                <div className="px-2 py-1 rounded-lg bg-white/5 text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                                    {m.trend}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">{m.label}</p>
                                <p className="text-2xl font-black italic text-white tracking-tighter">{m.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <SystemHealth />

            <Tabs defaultValue="vault" className="w-full flex flex-col" onValueChange={setActiveTab}>
                <div className="flex flex-col lg:items-center justify-between gap-6 mb-12 bg-white/[0.02] p-4 rounded-[2.5rem] border border-white/5">
                    <TabsList className="bg-[#080808]/50 border border-white/5 p-1.5 rounded-2xl backdrop-blur-md h-auto shrink-0 flex items-center">
                        <TabsTrigger value="vault" className="rounded-xl px-8 py-3.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all gap-2 h-full flex items-center">
                            <FileText size={14} /> Paper Vault
                        </TabsTrigger>
                        <TabsTrigger value="staff" className="rounded-xl px-8 py-3.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 h-full flex items-center">
                            <Clock size={14} /> Attendance
                        </TabsTrigger>
                        <TabsTrigger value="payroll" className="rounded-xl px-8 py-3.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 h-full flex items-center">
                            <CreditCard size={14} /> Payroll
                        </TabsTrigger>

                    </TabsList>

                    <div className="flex flex-col items-center gap-3 w-full">
                        {activeTab === 'vault' && (
                            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-right-4 duration-500 h-full">
                                <div className="relative group flex-1 md:w-64">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Search records..."
                                        className="pl-10 h-14 bg-zinc-950/50 border-white/5 focus:border-emerald-500/50 focus-visible:ring-emerald-500/20 rounded-2xl placeholder:text-zinc-700 font-medium text-xs transition-all"
                                        value={vaultSearch}
                                        onChange={(e) => setVaultSearch(e.target.value)}
                                    />
                                </div>
                                <Select value={gradeFilter} onValueChange={(val) => val && setGradeFilter(val)}>
                                    <SelectTrigger className="w-[120px] h-14 bg-zinc-950/50 border-white/5 rounded-2xl font-black uppercase tracking-widest text-[9px] text-zinc-400">
                                        <SelectValue placeholder="GRADE" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-white/5 rounded-xl">
                                        <SelectItem value="All" className="rounded-lg font-black uppercase tracking-widest text-[9px]">All Grades</SelectItem>
                                        {[9, 10, 11, 12].map(g => (
                                            <SelectItem key={g} value={g.toString()} className="rounded-lg font-black uppercase tracking-widest text-[9px]">{`Class ${g}`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={tagFilter} onValueChange={(val) => val && setTagFilter(val)}>
                                    <SelectTrigger className="w-[140px] h-14 bg-zinc-950/50 border-white/5 rounded-2xl font-black uppercase tracking-widest text-[9px] text-zinc-400">
                                        <SelectValue placeholder="TAG" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-white/5 rounded-xl">
                                        <SelectItem value="All" className="rounded-lg font-black uppercase tracking-widest text-[9px]">All Tags</SelectItem>
                                        {uniqueTags.map(tag => (
                                            <SelectItem key={tag} value={tag} className="rounded-lg font-black uppercase tracking-widest text-[9px]">{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => setIsUploadOpen(true)}
                                    className="h-14 px-8 bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/10 shrink-0"
                                >
                                    <Upload size={16} className="mr-2" /> Upload
                                </Button>
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div className="h-14"></div> // Spacer to keep layout consistent
                        )}


                    </div>
                </div>

                <TabsContent value="vault" className="outline-none w-full flex flex-col">
                    {loading ? (
                        <PaperSkeleton />
                    ) : filteredVault.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-8 bg-zinc-900/10 rounded-[4rem] border-2 border-dashed border-white/5">
                            <SearchX size={48} className="text-zinc-800" />
                            <div className="text-center space-y-2">
                                <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em]">Zero Results Identified</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {filteredVault.map(doc => (
                                <DocumentCard
                                    key={doc.id}
                                    doc={doc}
                                    onView={handleViewPaper}
                                    onDelete={handleDeletePaper}
                                    onReuse={() => handleReusePaper(doc.config)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="staff" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
                    <StaffTable staffData={staffData} />
                </TabsContent>

                <TabsContent value="payroll" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
                    <Card className="bg-[#080808]/50 border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-zinc-950/40">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Staff Members</TableHead>
                                        <TableHead className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Base Allocation</TableHead>
                                        <TableHead className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Net Disbursement</TableHead>
                                        <TableHead className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffData.map(staff => (
                                        <TableRow key={staff.id} className="border-white/5 hover:bg-white/[0.02] transition-colors duration-500">
                                            <TableCell className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-sm font-black italic text-zinc-600 uppercase shadow-inner">
                                                        {staff.name.charAt(0)}
                                                    </div>
                                                    <span className="text-base font-black italic text-zinc-200 uppercase tracking-tighter">{staff.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10 py-8 font-mono text-zinc-500 text-xs tracking-tight">PKR {staff.baseSalary.toLocaleString()}</TableCell>
                                            <TableCell className="px-10 py-8 font-mono text-emerald-400 font-black text-lg tracking-tighter">PKR {staff.netPayable.toLocaleString()}</TableCell>
                                            <TableCell className="px-10 py-8 text-center">
                                                <Badge variant="outline" className="bg-zinc-900 border-white/5 text-zinc-500">{staff.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>


            </Tabs>

            <ExamGeneratorModal
                isOpen={isGeneratorOpen}
                setIsOpen={setIsGeneratorOpen}
                initialConfig={reuseConfig}
            />

            <ManualPaperUploadModal
                isOpen={isUploadOpen}
                setIsOpen={setIsUploadOpen}
                onSuccess={() => { }} // Firestore listener handles update
            />
        </div>
    )
}

// ----------------------
// Sub-Components
// ----------------------

function PaperSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
                <Card key={i} className="h-[500px] bg-zinc-900/20 border-white/5 rounded-[3.5rem] animate-pulse" />
            ))}
        </div>
    )
}

function AttendanceHeatmap({ history }: any) {
    if (!history) return null;
    return (
        <div className="flex gap-1">
            {history.slice(-10).map((h: any, i: number) => (
                <div key={i} className={cn("w-2 h-8 rounded-full",
                    h.status === 'Present' ? "bg-emerald-500" :
                        h.status === 'Absent' ? "bg-red-500" : "bg-zinc-800"
                )} title={h.date} />
            ))}
        </div>
    )
}


function DocumentCard({ doc, onView, onDelete, onReuse }: { doc: any, onView: (doc: any) => void, onDelete: (id: string) => void, onReuse: (config: any) => void }) {
    const handleDownload = () => {
        if (doc.fileUrls && doc.fileUrls.length > 0) {
            // Download all files
            doc.fileUrls.forEach((url: string, idx: number) => {
                const link = document.createElement('a')
                link.href = url
                link.download = `${doc.title}_${idx + 1}`
                link.target = '_blank'
                link.click()
            })
            toast.success(`Downloading ${doc.fileUrls.length} file(s)`)
        } else {
            toast.info('No files available for download')
        }
    }

    const handlePrimaryAction = () => {
        if (doc.fileUrls && doc.fileUrls.length > 0) {
            window.open(doc.fileUrls[0], '_blank')
        } else {
            onView(doc)
        }
    }

    return (
        <Card className="bg-[#080808]/40 border-white/5 p-8 rounded-[2.5rem] hover:border-emerald-500/20 transition-all duration-700 group relative overflow-hidden flex flex-col h-[400px] backdrop-blur-md shadow-2xl">
            {/* Background Aesthetic */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/[0.02] blur-[100px] rounded-full group-hover:bg-emerald-500/[0.05] transition-all duration-700 pointer-events-none" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] w-fit shadow-xl">
                            CLASS {doc.grade}
                        </Badge>
                        {doc.fileType === 'pdf' && (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-2 py-1 rounded-md text-[8px] font-black uppercase">PDF</Badge>
                        )}
                        {doc.fileType === 'image' && (
                            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-2 py-1 rounded-md text-[8px] font-black uppercase">IMG</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">
                        <Calendar size={12} className="text-zinc-800" />
                        {doc.year} Term
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {doc.config && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onReuse(doc.config)}
                            className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-600 hover:text-emerald-500 hover:border-emerald-500/30 transition-all duration-500 shadow-xl"
                            title="Re-materialize Logic"
                        >
                            <RefreshCw size={16} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(doc.id)}
                        className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-600 hover:text-red-500 hover:border-red-500/30 transition-all duration-500 shadow-xl"
                        title="Purge Record"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-black text-white leading-[1.1] group-hover:text-emerald-400 transition-all duration-500 uppercase italic tracking-tighter line-clamp-2">
                    {doc.title}
                </h3>

                <div className="space-y-3">
                    <Separator className="bg-white/5" />
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-700 shrink-0 shadow-inner group-hover:text-emerald-500/50 transition-colors duration-500">
                            <Database size={18} />
                        </div>
                        <div className="pt-0.5 flex-1">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] leading-none mb-1.5">Subject Classification</p>
                            <p className="text-[10px] font-black text-zinc-300 uppercase italic tracking-tight">{doc.subject}</p>
                        </div>
                    </div>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {doc.tags.slice(0, 3).map((tag: string, idx: number) => (
                                <Badge key={idx} className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">
                                    {tag}
                                </Badge>
                            ))}
                            {doc.tags.length > 3 && (
                                <Badge className="bg-zinc-900 border-white/5 text-zinc-600 px-2 py-0.5 rounded-md text-[8px] font-black">+{doc.tags.length - 3}</Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 mt-4">
                <Button
                    onClick={handlePrimaryAction}
                    className="flex-1 h-12 bg-white text-black hover:bg-emerald-500 hover:text-black font-black uppercase italic tracking-[0.15em] rounded-xl transition-all duration-500 shadow-2xl group/btn text-[10px]"
                >
                    <Eye size={16} className="mr-2 group-hover/btn:scale-110 transition-transform" />
                    {doc.fileUrls?.length > 0 ? "View File" : "Open Vault"}
                </Button>
                <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 bg-zinc-950 border-white/5 hover:border-emerald-500/20 text-zinc-700 hover:text-emerald-500 rounded-xl transition-all duration-500 shadow-xl"
                    title={doc.fileUrls?.length > 0 ? `Download ${doc.fileUrls.length} file(s)` : 'No files'}
                >
                    <Download size={18} />
                </Button>
            </div>
        </Card>
    )
}

function StaffTable({ staffData }: { staffData: any[] }) {
    const parentRef = useRef<HTMLDivElement>(null)

    const rowVirtualizer = useVirtualizer({
        count: staffData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140, // Estimated row height
        overscan: 5,
    })

    return (
        <Card className="bg-[#080808]/50 border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Header stays static */}
            <div className="grid grid-cols-5 bg-zinc-950/40 p-6 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hidden md:grid">
                <div>Faculty Node</div>
                <div className="text-center">Efficiency Score</div>
                <div>Attendance Sequence</div>
                <div className="text-center">Clearance Status</div>
                <div className="text-right">Action</div>
            </div>

            <div
                ref={parentRef}
                className="h-[600px] overflow-auto relative"
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const staff = staffData[virtualRow.index]
                        return (
                            <div
                                key={virtualRow.key}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                className="border-b border-white/5 hover:bg-emerald-500/[0.03] transition-all duration-500 p-6 md:p-0 flex flex-col md:grid md:grid-cols-5 items-center gap-4"
                            >
                                {/* Mobile View: Data Cards */}
                                <div className="md:col-span-1 w-full flex items-center gap-5 md:pl-10">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-zinc-900 border border-white/5 overflow-hidden p-0.5 shadow-2xl">
                                            <img src={staff.image} alt={staff.name} className="w-full h-full object-cover rounded-[1.3rem]" />
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#050505]",
                                            staff.todayStatus === 'Present' ? "bg-emerald-500" : "bg-zinc-800"
                                        )} />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-white italic tracking-tighter uppercase">{staff.name}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1 italic">{staff.designation}</p>
                                    </div>
                                </div>

                                <div className="md:col-span-1 w-full flex justify-center">
                                    <div className="flex flex-col gap-2 text-center items-center">
                                        <span className={cn(
                                            "text-2xl font-black italic tracking-tighter leading-none transition-colors duration-500",
                                            staff.attendance >= 90 ? "text-emerald-500" : staff.attendance >= 75 ? "text-amber-500" : "text-red-500"
                                        )}>{staff.attendance}%</span>
                                    </div>
                                </div>

                                <div className="md:col-span-1 w-full">
                                    <AttendanceHeatmap history={staff.history} />
                                </div>

                                <div className="md:col-span-1 w-full flex justify-center">
                                    <div className={cn(
                                        "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 shadow-xl",
                                        staff.todayStatus === 'Present' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            staff.todayStatus === 'Absent' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                "bg-zinc-900/50 text-zinc-600 border-white/5"
                                    )}>
                                        {staff.todayStatus}
                                    </div>
                                </div>

                                <div className="md:col-span-1 w-full flex justify-end md:pr-10">
                                    <Button variant="ghost" size="icon">
                                        <ArrowUpRight size={20} />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </Card>
    )
}
