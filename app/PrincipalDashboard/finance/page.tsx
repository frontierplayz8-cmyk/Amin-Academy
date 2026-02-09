"use client"

import React, { useState, useEffect, useMemo } from 'react'
import {
    Wallet,
    DollarSign,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Search,
    RefreshCcw,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    PieChart
} from 'lucide-react'
import {
    Card,
    CardContent,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from 'sonner'
import { useAuthenticatedFetch } from '@/lib/useAuthenticatedFetch'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

export default function FinanceManagement() {
    const { authFetch, user, loading: authLoading } = useAuthenticatedFetch()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All')
    const [gradeFilter, setGradeFilter] = useState<string>('All')
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const fetchFinance = async () => {
        try {
            const res = await authFetch('/api/admin/students')
            const data = await res.json()
            if (data.success) {
                setStudents(data.students || [])
            }
        } catch (e) {
            console.error("Finance Fetch Error:", e)
            toast.error("Failed to sync financial ledger")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading && user) {
            fetchFinance()
        }
    }, [authLoading, user])

    const handleUpdateStatus = async (studentId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid'
        setUpdatingId(studentId)

        // Optimistic UI Update
        const originalStudents = [...students]
        setStudents(students.map((s: any) => s._id === studentId ? { ...s, feeStatus: newStatus } : s))

        try {
            const res = await authFetch('/api/admin/students', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    updates: { feeStatus: newStatus }
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success(`Transaction Recorded: ${newStatus} `)
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            toast.error("Transaction Failed: Reverting")
            setStudents(originalStudents) // Revert on fail
        } finally {
            setUpdatingId(null)
        }
    }

    const filteredStudents = useMemo(() => {
        return students.filter((s: any) => {
            const matchesSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.rollNumber || '').toLowerCase().includes(search.toLowerCase())
            const matchesStatus = statusFilter === 'All' || s.feeStatus === statusFilter
            const matchesGrade = gradeFilter === 'All' || s.grade === gradeFilter || s.grade === `Grade ${gradeFilter} `

            return matchesSearch && matchesStatus && matchesGrade
        })
    }, [students, search, statusFilter, gradeFilter])

    // Metrics Calculation
    const totalPotentialRevenue = students.reduce((acc: number, s: any) => acc + (s.feeAmount || 5500), 0)
    const collectedRevenue = students.reduce((acc: number, s: any) => s.feeStatus === 'Paid' ? acc + (s.feeAmount || 5500) : acc, 0)
    const pendingRevenue = totalPotentialRevenue - collectedRevenue
    const collectionRate = totalPotentialRevenue > 0 ? (collectedRevenue / totalPotentialRevenue) * 100 : 0

    const grades = ['All', ...Array.from(new Set(students.map((s: any) => s.grade?.replace('Grade ', '') || s.grade))).filter(Boolean).sort()] as string[]

    const handleUpdateAmount = async (studentId: string, newAmount: number) => {
        // Optimistic UI Update
        const originalStudents = [...students]
        setStudents(students.map((s: any) => s._id === studentId ? { ...s, feeAmount: newAmount } : s))

        try {
            const res = await authFetch('/api/admin/students', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    updates: { feeAmount: newAmount }
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Fee Structure Updated')
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            toast.error("Update Failed: Reverting")
            setStudents(originalStudents) // Revert on fail
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCcw className="animate-spin text-emerald-500" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Syncing Treasury...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                        <Wallet className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Treasury Ops</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        Financial <span className="text-emerald-500 not-italic">LEDGER</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <DollarSign size={12} className="text-emerald-500" />
                        Revenue Oversight & Fiscal Performance
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl">
                        <Download size={14} className="mr-2" /> Export Ledger
                    </Button>
                    <Button
                        onClick={fetchFinance}
                        className="h-12 bg-white text-black hover:bg-emerald-500 hover:text-black font-black uppercase italic tracking-widest rounded-xl px-8"
                    >
                        <RefreshCcw size={14} className="mr-2" /> Sync Matrix
                    </Button>
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Projected"
                    value={`PKR ${(totalPotentialRevenue / 1000).toFixed(1)} k`}
                    icon={<DollarSign size={20} />}
                    trend="up"
                    subval="Monthly Estimate"
                />
                <MetricCard
                    title="Collected Revenue"
                    value={`PKR ${(collectedRevenue / 1000).toFixed(1)} k`}
                    icon={<TrendingUp size={20} />}
                    trend="neutral"
                    subval={`${collectionRate.toFixed(1)}% Recovery`}
                    accent="text-emerald-500"
                />
                <MetricCard
                    title="Pending Dues"
                    value={`PKR ${(pendingRevenue / 1000).toFixed(1)} k`}
                    icon={<AlertCircle size={20} />}
                    trend="down"
                    subval={`${students.length - students.filter((s: any) => s.feeStatus === 'Paid').length} Nodes Pending`}
                    accent="text-red-500"
                />
                <MetricCard
                    title="Active Accounts"
                    value={students.length.toString()}
                    icon={<CheckCircle2 size={20} />}
                    trend="up"
                    subval="Total Enrolled"
                />
            </div>

            {/* MAIN CONTENT SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: LEDGER TABLE */}
                <Card className="lg:col-span-2 bg-[#080808]/50 border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[700px]">
                    {/* Toolbar */}
                    <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center bg-white/2">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 italic">Live Sector Ledger</h3>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 rounded-lg font-black text-[10px]">
                                {filteredStudents.length} ACTIVE NODES
                            </Badge>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={14} />
                                <Input
                                    placeholder="Search..."
                                    className="bg-zinc-950/50 border-white/5 pl-9 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl focus-visible:ring-emerald-500/20 w-48"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <Select value={gradeFilter} onValueChange={(val) => val && setGradeFilter(val)}>
                                <SelectTrigger className="bg-zinc-950/50 border-white/5 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl focus:ring-emerald-500/20 w-32">
                                    <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-white/5 rounded-xl">
                                    {grades.map(g => (
                                        <SelectItem key={g || 'all-grades'} value={g || "All"} className="text-[10px] font-black uppercase tracking-widest rounded-lg">
                                            {g === 'All' ? 'All Sectors' : `Grade ${g} `}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                                <SelectTrigger className="bg-zinc-950/50 border-white/5 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl focus:ring-emerald-500/20 w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-white/5 rounded-xl">
                                    <SelectItem value="All" className="text-[10px] font-black uppercase tracking-widest rounded-lg">All Status</SelectItem>
                                    <SelectItem value="Paid" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Paid Only</SelectItem>
                                    <SelectItem value="Pending" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Pending Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent bg-white/2">
                                    <TableHead className="py-6 pl-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">Identity</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sector</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Amount (PKR)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Protocol</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3 text-zinc-700">
                                                <PieChart size={40} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Zero fiscal data found for specified sector</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student: any, idx: number) => (
                                        <TableRow key={student.id || student._id || idx} className="border-white/5 hover:bg-white/2 group transition-colors">
                                            <TableCell className="py-6 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-[10px] font-black text-emerald-500/50">
                                                        {student.rollNumber || '00'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase tracking-tight text-white group-hover:text-emerald-500 transition-colors leading-none">{student.name}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-2 italic">INV-{(student.id || student._id || "").slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                Grade {student.grade?.replace('Grade ', '') || student.grade}
                                            </TableCell>
                                            <TableCell className="font-mono font-bold text-zinc-400">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-500/50">RS.</span>
                                                    <input
                                                        type="number"
                                                        className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-emerald-500 focus:outline-none w-24 text-sm font-black transition-all text-white"
                                                        defaultValue={student.feeAmount || 5500}
                                                        onBlur={(e) => {
                                                            const newVal = parseInt(e.target.value)
                                                            if (newVal !== student.feeAmount) {
                                                                handleUpdateAmount(student._id, newVal)
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.currentTarget.blur()
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`h - 7 px - 4 rounded - lg text - [9px] font - black uppercase tracking - widest border transition - all ${student.feeStatus === 'Paid'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        } `}
                                                >
                                                    {student.feeStatus === 'Paid' ? <CheckCircle2 size={10} className="mr-1.5" /> : <AlertCircle size={10} className="mr-1.5" />}
                                                    {student.feeStatus || 'PENDING'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button
                                                    size="sm"
                                                    disabled={updatingId === student._id}
                                                    onClick={() => handleUpdateStatus(student._id, student.feeStatus)}
                                                    className={`h - 9 px - 6 rounded - xl text - [9px] font - black uppercase tracking - widest transition - all ${student.feeStatus === 'Paid'
                                                        ? 'bg-zinc-900 border border-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/5'
                                                        : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)] font-black'
                                                        } `}
                                                >
                                                    {updatingId === student._id ? (
                                                        <RefreshCcw size={12} className="animate-spin" />
                                                    ) : (
                                                        student.feeStatus === 'Paid' ? 'Revert Status' : 'Authorize Payment'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* RIGHT: ANALYTICS PANEL */}
                <div className="flex flex-col gap-6">
                    {/* Collection Chart */}
                    <Card className="bg-[#080808]/50 border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md h-[340px] flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
                            <PieChart size={120} />
                        </div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <PieChart size={16} />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Recovery Matrix</h3>
                        </div>
                        <div className="flex-1 w-full scale-110">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{ name: 'Status', collected: collectedRevenue, pending: pendingRevenue }]} layout="vertical" barSize={60}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" hide />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Bar dataKey="collected" stackId="a" fill="#10b981" radius={[8, 0, 0, 8]} />
                                    <Bar dataKey="pending" stackId="a" fill="#ef4444" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between mt-8 p-4 bg-white/2 rounded-2xl border border-white/5">
                            <div className="text-center">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Recovered</p>
                                <p className="text-xl font-black text-emerald-500 italic scale-110">{collectionRate.toFixed(1)}%</p>
                            </div>
                            <Separator orientation="vertical" className="bg-white/5 h-10" />
                            <div className="text-center">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Decline</p>
                                <p className="text-xl font-black text-red-500 italic scale-110">{(100 - collectionRate).toFixed(1)}%</p>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Stats / Alerts */}
                    <Card className="bg-gradient-to-br from-[#080808]/80 to-black border-white/5 rounded-[2.5rem] p-8 flex-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:rotate-12 transition-transform duration-700">
                            <AlertCircle size={80} />
                        </div>
                        <div className="flex items-center gap-3 mb-6 text-red-500">
                            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <AlertCircle size={16} />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Critical Deficits</h3>
                        </div>
                        <div className="space-y-4">
                            {students.filter((s: any) => s.feeStatus === 'Pending').slice(0, 4).map((s: any, idx: any) => (
                                <div key={s.id || s._id || idx} className="flex justify-between items-center p-4 bg-white/2 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all cursor-pointer group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-tight group-hover/item:text-red-500 transition-colors">{s.name}</p>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Grade {s.grade?.replace('Grade ', '') || s.grade}</p>
                                        </div>
                                    </div>
                                    <p className="font-mono text-[10px] font-bold text-red-500/70">PKR {s.feeAmount || 5500}</p>
                                </div>
                            ))}
                            {students.filter((s: any) => s.feeStatus === 'Pending').length > 4 && (
                                <div className="pt-4 flex justify-center">
                                    <Button variant="ghost" className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-emerald-500 transition-colors">
                                        + {students.filter((s: any) => s.feeStatus === 'Pending').length - 4} Additional Nodes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

            </div>

        </div>
    )
}

function MetricCard({ title, value, icon, trend, subval, accent }: any) {
    return (
        <Card className="bg-[#080808]/50 border-white/5 rounded-[2.5rem] p-8 hover:border-emerald-500/20 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 rounded-[1.25rem] bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all duration-500 shadow-xl">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items - center gap - 1.5 px - 3 py - 1 rounded - full text - [10px] font - black tracking - widest uppercase italic ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : trend === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-zinc-500'
                        } `}>
                        {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : null}
                        {trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className={`text - 3xl font - black tracking - tighter italic ${accent || 'text-white'} `}>{value}</h3>
                </div>
                {subval && (
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{subval}</p>
                    </div>
                )}
            </div>
        </Card>
    )
}

