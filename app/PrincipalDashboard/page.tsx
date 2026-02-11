"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    ShieldCheck,
    Search,
    Activity,
    ClipboardCheck,
    Check,
    X,
    Clock,
    Video,
    MoreHorizontal,
    GraduationCap,
    School,
    CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { ChartBarInteractive } from '@/components/ChartBarInteractive'
import TeacherPromotionModal from '@/components/TeacherPromotionModal'
import LectureUploadModal from '@/components/LectureUploadModal'
import { useAuthenticatedFetch } from '@/lib/useAuthenticatedFetch'
import { useAuth } from '@/context/AuthContext'

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'

const PrincipalDashboard = () => {
    const router = useRouter()
    const { authFetch, user: authUser } = useAuthenticatedFetch()
    const { loading: authLoading, profile } = useAuth()
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [paperCount, setPaperCount] = useState(0)
    const [students, setStudents] = useState<any[]>([])
    const [pendingAttendance, setPendingAttendance] = useState<any[]>([])

    // Promotion Modal State
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false)
    const [userToPromote, setUserToPromote] = useState<{ id: string, name: string } | null>(null)

    // AI Call Modal State
    const [isLectureModalOpen, setIsLectureModalOpen] = useState(false)

    const fetchData = async () => {
        try {
            // Check auth
            const authRes = await authFetch('/api/auth/isLoggedin')
            const authData = await authRes.json()

            if (!authData.success || authData.userRank !== 'Principal') {
                router.push('/dashboard')
                return
            }
            setCurrentUser(authData.user)

            // Fetch all users
            const usersRes = await authFetch('/api/admin/users')
            const usersData = await usersRes.json()
            if (usersData.success) {
                setUsers(usersData.users)
            }

            // Fetch pending attendance
            const attendanceRes = await authFetch('/api/teacher/attendance')
            const attendanceData = await attendanceRes.json()
            if (attendanceData.success) {
                setPendingAttendance(attendanceData.pending || [])
            }


            // Fetch students for pending tasks
            const studentsRes = await authFetch('/api/admin/students')
            const studentsData = await studentsRes.json()
            if (studentsData.success) {
                setStudents(studentsData.students || [])
            }

            // Load paper count from history
            const history = localStorage.getItem('examPaperHistory')
            if (history) {
                const parsed = JSON.parse(history)
                setPaperCount(parsed.length)
            }
        } catch (error) {
            console.error("Dashboard Fetch Error:", error)
            toast.error("Failed to load administration data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            if (authUser) {
                fetchData()
            } else {
                router.push('/login')
            }
        }
    }, [authLoading, authUser])

    const handlePromote = async (userId: string, newRank: string, username?: string) => {
        if (!userId || !newRank) return // Safety check

        if (newRank === 'Teacher') {
            setUserToPromote({ id: userId, name: username || 'User' })
            setIsPromoModalOpen(true)
            return
        }

        const tid = toast.loading(`Upgrading clearing for ${username || 'identity'}...`)
        try {
            const res = await authFetch('/api/admin/promote', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newRank })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message, { id: tid })
                setUsers(users.map(u => u.id === userId ? { ...u, ranks: newRank } : u))
            } else {
                toast.error(data.message, { id: tid })
            }
        } catch (error) {
            toast.error("Promotion failed", { id: tid })
        }
    }

    const finalizeTeacherPromotion = async (details: { salary: number, designation: string, joiningDate: string }) => {
        if (!userToPromote || !userToPromote.id) {
            toast.error("Protocol context missing")
            return
        }

        const tid = toast.loading("Finalizing faculty authorization...")
        try {
            const res = await authFetch('/api/admin/promote', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userToPromote.id,
                    newRank: 'Teacher',
                    ...details
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`Success: ${userToPromote.name} is now an Authorized Teacher`, { id: tid })
                setUsers(users.map(u => u.id === userToPromote.id ? { ...u, ranks: 'Teacher' } : u))
            } else {
                toast.error(data.message, { id: tid })
            }
        } catch (error) {
            toast.error("Promotion failed", { id: tid })
        } finally {
            setUserToPromote(null)
            setIsPromoModalOpen(false)
        }
    }

    const handleVerifyAttendance = async (attendanceId: string, status: 'Present' | 'Absent') => {
        const toastId = toast.loading(`Synchronizing ${status} status...`)
        try {
            const res = await authFetch('/api/admin/attendance/verify', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendanceId, status })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`Protocol Confirmed: Teacher marked as ${status}`, { id: toastId })
                setPendingAttendance(prev => prev.filter(a => a.id !== attendanceId))
            } else {
                toast.error(data.message, { id: toastId })
            }
        } catch (error) {
            toast.error("Oversight network failed to sync", { id: toastId })
        }
    }

    const handleUserAction = async (userId: string, action: 'ban' | 'unban', username: string) => {
        const tid = toast.loading(`Executing ${action} protocol on ${username}...`)
        try {
            const res = await authFetch('/api/admin/user-action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message, { id: tid })
                setUsers(users.map(u => u.id === userId ? { ...u, status: action === 'ban' ? 'banned' : 'active' } : u))
            } else {
                toast.error(data.message, { id: tid })
            }
        } catch (error) {
            toast.error(`Action ${action} failed`, { id: tid })
        }
    }

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`CRITICAL PROTOCOL: Are you sure you want to permanently purge ${username} from the system? This action is irreversible.`)) return

        const tid = toast.loading(`Purging ${username} from records...`)
        try {
            const res = await authFetch(`/api/admin/user-action?userId=${userId}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message, { id: tid })
                setUsers(users.filter(u => u.id !== userId))
            } else {
                toast.error(data.message, { id: tid })
            }
        } catch (error) {
            toast.error("Purge protocol failed", { id: tid })
        }
    }

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="text-amber-500 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Overview...</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto w-full">
            {/* Header Section: Centered & Sophisticated */}
            <div className="flex flex-col gap-8 lg:items-center lg:justify-between w-full">
                <div className="space-y-4 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Institutional Oversight</span>
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            Oversight <span className="text-emerald-500 not-italic">COMMAND</span>
                        </h1>
                        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2 max-w-xl leading-relaxed">
                            Amin Academy Framework v2.0 | Welcome, <span className="text-zinc-200">{currentUser?.username}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Security Awareness Card for Principal */}
                    <div className={cn(
                        "h-14 px-6 rounded-2xl flex items-center gap-4 border transition-all duration-500 cursor-pointer group",
                        profile?.twoFactorEnabled
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse hover:bg-amber-500/20"
                    )} onClick={() => router.push('/profile')}>
                        <ShieldCheck size={20} className={profile?.twoFactorEnabled ? "text-emerald-500" : "text-amber-500"} />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Admin Security</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter mt-1 opacity-70 italic">
                                {profile?.twoFactorEnabled ? "Dual-Layer Active" : "Action Required: Enable 2FA"}
                            </span>
                        </div>
                    </div>

                    <div className="relative group w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                        <Input
                            placeholder="Scan identities..."
                            className="pl-10 h-14 bg-zinc-950/50 border-white/5 focus:border-emerald-500/50 focus-visible:ring-emerald-500/20 rounded-2xl placeholder:text-zinc-700 font-medium text-xs transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setIsLectureModalOpen(true)}
                        className="h-14 px-8 bg-white text-black hover:bg-emerald-500 hover:text-black font-black uppercase italic tracking-widest rounded-2xl transition-all shadow-lg w-full sm:w-auto"
                    >
                        <Video size={16} className="mr-2" /> Upload Lecture
                    </Button>
                </div>
            </div>

            {/* Core Statistics Bento: High Fidelity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { title: "Active Students", value: students.length, icon: GraduationCap, color: "text-emerald-500", label: "Registered Learners", trend: "Live" },
                    { title: "Evaluated Papers", value: paperCount, icon: School, color: "text-blue-500", label: "Exam Cycles", trend: "+12%" },
                    { title: "Faculty Size", value: users.filter(u => u.ranks === 'Teacher').length, icon: ShieldCheck, color: "text-emerald-500", label: "Neural Instructors", trend: "Stable" },
                    { title: "Pending Dues", value: students.filter(s => s.feeStatus === 'Pending').length, icon: CreditCard, color: "text-red-500", label: "Financial Syncs", trend: "Review" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-[#080808]/50 border-white/5 backdrop-blur-md rounded-[2rem] hover:border-emerald-500/20 transition-all duration-500 group overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-2xl bg-white/[0.03] ${stat.color}`}>
                                    <stat.icon size={22} />
                                </div>
                                <div className="px-2 py-1 rounded-lg bg-white/5 text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">{stat.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black italic text-white tracking-tighter tabular-nums">{stat.value}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">{stat.label}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* ACTIVE OVERSIGHT: Faculty Attendance */}
            {pendingAttendance.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <ClipboardCheck className="text-emerald-500" size={16} />
                        </div>
                        <h2 className="text-xl font-black uppercase italic tracking-tight text-zinc-100">Faculty Pulse Check</h2>
                        <Badge variant="outline" className="border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest">{pendingAttendance.length} Awaiting Sync</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingAttendance.map((record) => (
                            <Card key={record.id} className="bg-zinc-900/10 border-white/5 backdrop-blur-sm overflow-hidden rounded-[2.5rem]">
                                <CardHeader className="p-6 pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="font-mono text-[10px] text-emerald-500/80 uppercase font-black tracking-widest">{record.date}</p>
                                            <CardTitle className="text-xl font-black uppercase italic text-zinc-100">{record.teacherName}</CardTitle>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400">
                                            <Clock size={18} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-6">
                                    <div className="flex items-center gap-2 p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Self-Report:</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-none text-[9px] font-black tracking-widest h-auto py-0.5">PRESENT</Badge>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleVerifyAttendance(record.id, 'Present')}
                                            className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs rounded-xl"
                                        >
                                            <Check className="mr-2 h-4 w-4" /> Sync Signal
                                        </Button>
                                        <Button
                                            onClick={() => handleVerifyAttendance(record.id, 'Absent')}
                                            variant="ghost"
                                            className="h-12 w-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Neural Analytics View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-[#080808]/50 border-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Efficacy Metrics</CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Platform-wide neural activity</p>
                        </div>
                        <Activity className="text-emerald-500/50" size={24} />
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <ChartBarInteractive />
                    </CardContent>
                </Card>

                {/* Identity Ledger Summary (Compact) */}
                <Card className="bg-[#080808]/50 border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black uppercase italic tracking-tight">Identity Register</CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Active system occupants</p>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <Table className="border-collapse">
                            <TableBody>
                                {filteredUsers.slice(0, 5).map((user) => (
                                    <TableRow key={user.id} className="border-white/2 hover:bg-white/2 transition-colors">
                                        <TableCell className="py-4 pl-8">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-white/5">
                                                    <AvatarFallback className="bg-zinc-900 text-zinc-500 font-black text-xs">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="grid gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold tracking-tight leading-none">{user.username}</p>
                                                        {user.status === 'banned' && (
                                                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[8px] font-black uppercase py-0 px-1 italic">Banned</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{user.ranks}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 pr-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/5">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-950 border-white/5 rounded-2xl p-2 min-w-[200px]">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-3 py-2">Identity Protocol</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                                    {user.ranks !== 'Student' && (
                                                        <DropdownMenuItem onClick={() => handlePromote(user.id, 'Student')} className="rounded-xl focus:bg-red-500/10 focus:text-red-500 font-bold px-3 py-2 text-xs">
                                                            Demote to Learner
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.ranks !== 'Teacher' && (
                                                        <DropdownMenuItem onClick={() => handlePromote(user.id, 'Teacher', user.username)} className="rounded-xl focus:bg-emerald-500 focus:text-black font-bold px-3 py-2 text-xs">
                                                            Promote to Faculty
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.ranks !== 'Principal' && (
                                                        <DropdownMenuItem onClick={() => handlePromote(user.id, 'Principal')} className="rounded-xl focus:bg-emerald-500 focus:text-black font-bold px-3 py-2 text-xs">
                                                            Grant Admin Authority
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                                    {user.status === 'banned' ? (
                                                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'unban', user.username)} className="rounded-xl focus:bg-emerald-500 focus:text-black font-bold px-3 py-2 text-xs">
                                                            Unban Identity
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'ban', user.username)} className="rounded-xl focus:bg-amber-500/10 focus:text-amber-500 font-bold px-3 py-2 text-xs">
                                                            Ban Identity
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDeleteUser(user.id, user.username)} className="rounded-xl focus:bg-red-500 focus:text-white font-bold px-3 py-2 text-xs">
                                                        Purge from System
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <div className="p-6 border-t border-white/2 bg-white/2">
                        <Button
                            variant="ghost"
                            className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-emerald-500 hover:bg-transparent"
                            onClick={() => { /* Possible route to full list if exists */ }}
                        >
                            Access Full Identity Ledger
                        </Button>
                    </div>
                </Card>
            </div>

            <TeacherPromotionModal
                isOpen={isPromoModalOpen}
                setIsOpen={setIsPromoModalOpen}
                onPromote={finalizeTeacherPromotion}
                userName={userToPromote?.name || ''}
            />

            <LectureUploadModal
                isOpen={isLectureModalOpen}
                onClose={() => setIsLectureModalOpen(false)}
                userName={currentUser?.username || "Principal"}
            />
        </div>
    )
}

export default PrincipalDashboard
