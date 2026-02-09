"use client"
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import {
    User,
    BookOpen,
    Calendar,
    Activity,
    ShieldCheck,
    CreditCard,
    Clock,
    ArrowUpRight,
    LayoutDashboard,
    Settings,
    Bell,
    LogOut,
    Zap,
    Phone
} from 'lucide-react'
import { useAuthenticatedFetch } from '@/lib/useAuthenticatedFetch'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const Dashboard = () => {
    const router = useRouter()
    const { authFetch, user: authUser } = useAuthenticatedFetch()
    const { loading: authLoading } = useAuth()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)


    const fetchDashboardData = async () => {
        try {
            const res = await authFetch('/api/student/profile')
            const result = await res.json()

            if (res.status === 401) {
                router.push('/login')
                return
            }

            if (result.success) {
                setData(result)
            } else {
                setError(result.message || "Failed to load profile data")
            }
        } catch (error) {
            console.error("Dashboard Fetch Error:", error)
            setError("Connection error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            if (authUser) {
                fetchDashboardData()
            } else {
                router.push('/login')
            }
        }
    }, [authLoading, authUser])

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-white font-mono">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-emerald-500 animate-[loading_1.5s_ease-in-out_infinite]" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-500 font-bold animate-pulse">Initializing Terminal...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full bg-zinc-950 border-red-500/20">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut className="w-6 h-6 text-red-500" />
                        </div>
                        <CardTitle className="text-red-500">Access Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error.includes("User not found") || error.includes("profile") ? (
                            <div className="text-xs text-zinc-500 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                Your account is created but your student profile is missing.
                                Please contact support or re-register.
                            </div>
                        ) : null}
                        <Button
                            variant="outline"
                            onClick={() => router.push('/login')}
                            className="w-full bg-white text-black hover:bg-zinc-200 border-none"
                        >
                            Return to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!data?.user) return null

    const { user, profile } = data

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

                {/* Welcome Card - SPAN 2 */}
                <Card className="md:col-span-2 bg-zinc-900/30 border-white/5 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-12 bg-emerald-500/5 blur-3xl rounded-full" />
                    <CardHeader className="relative z-10 pb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2">
                                Security Status: Optimal
                            </Badge>
                        </div>
                        <CardTitle className="text-3xl md:text-4xl font-black uppercase italic leading-none">
                            Welcome back, <br />
                            <span className="text-emerald-500 truncate block mt-1">{user.username}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-0">
                        <p className="text-zinc-500 text-sm max-w-sm mb-8 leading-relaxed font-medium">
                            Your academic progress is at 84%. Complete Chapter 05 analysis to reach prime status.
                        </p>
                        <Button
                            onClick={() => router.push('/dashboard/ai-chat')}
                            className="w-fit bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all group"
                        >
                            Resume Learning <ArrowUpRight className="ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" size={14} />
                        </Button>
                    </CardContent>
                </Card>

                {/* Attendance Counter */}
                <Card className="bg-[#050505] border-white/5 flex flex-col items-center justify-center p-6 text-center group hover:border-blue-500/20 transition-all duration-500">
                    <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-900" />
                            <circle
                                cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray={283}
                                strokeDashoffset={283 * (1 - (profile?.attendance || 0) / 100)}
                                className="text-blue-500 transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl md:text-3xl font-black italic tabular-nums">{profile?.attendance || 0}%</span>
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Attendance</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-tighter">Consistency: <span className="text-blue-500">High</span></p>
                    </div>
                </Card>

                {/* Fee Status */}
                <Card className="bg-zinc-900/30 border-white/5 flex flex-col justify-between group hover:border-amber-500/20 transition-all duration-500">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                            <CreditCard size={24} />
                        </div>
                        <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-1",
                            profile?.feeStatus === 'Paid'
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                        )}>
                            {profile?.feeStatus === 'Paid' ? 'Settled' : 'Action Required'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Fee Protocol</p>
                        <h4 className="text-xl md:text-2xl font-black italic truncate">Rs. {profile?.feeAmount || 5500}</h4>
                        <p className="text-xs text-zinc-500 mt-2 font-medium">Due: 10th Feb 2026</p>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="md:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { label: 'Current Grade', value: profile?.grade || '10th', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        { label: 'User Rank', value: user.ranks, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'System Perf', value: 'Prime', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                        { label: 'Session Time', value: '42m', icon: Clock, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-zinc-900/20 border-white/5 hover:bg-white/5 transition-all group cursor-default">
                            <CardContent className="p-4 md:p-6 flex items-center gap-4">
                                <div className={cn("p-3 rounded-xl transition-all group-hover:scale-110", stat.bg, stat.color)}>
                                    <stat.icon size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest truncate">{stat.label}</p>
                                    <p className="text-xs md:text-sm font-black italic uppercase truncate">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Activity Analysis */}
                <Card className="md:col-span-4 bg-[#050505] border-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="px-6 md:px-8 py-5 md:py-6 border-b border-white/5 flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="text-xs md:text-sm font-black uppercase tracking-[0.2em] italic">
                            Recent Analysis Ledger
                        </CardTitle>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/dashboard/history')}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 p-0 h-auto"
                        >
                            View Full History
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                {profile?.recentScores?.map((score: number, idx: number) => (
                                    <TableRow key={idx} className="border-white/5 hover:bg-white/2 transition-all group px-4">
                                        <TableCell className="py-4 pl-6 md:pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-black italic text-zinc-500 group-hover:text-emerald-500 group-hover:scale-110 transition-all shrink-0">
                                                    CH-{idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-zinc-200">Advanced Biology Analysis</p>
                                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter mt-0.5">Verified • 2026-01-30</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-6 md:pr-8">
                                            <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                                <span className="text-sm font-black italic">{score}%</span>
                                                <Progress value={score} className="h-1 bg-zinc-800" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-12 py-4 pr-6 md:pr-8 hidden md:table-cell">
                                            <ArrowUpRight size={16} className="text-zinc-800 group-hover:text-emerald-500 transition-colors" />
                                        </TableCell>
                                    </TableRow>
                                )) || (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-40 text-center text-zinc-600 text-xs uppercase font-black tracking-[0.3em] italic">
                                                No recent logs found
                                            </TableCell>
                                        </TableRow>
                                    )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard

