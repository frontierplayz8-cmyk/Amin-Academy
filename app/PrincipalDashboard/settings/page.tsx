"use client"

import React, { useState, useEffect } from 'react'
import {
    Settings,
    Shield,
    Users,
    ChevronRight,
    Search,
    RefreshCcw,
    Fingerprint,
    UserPlus,
    Trash2,
    FileEdit,
    ShieldAlert,
    ExternalLink,
    Briefcase,
    Calendar,
    Banknote
} from 'lucide-react'
import { toast } from 'sonner'
import HireStaffModal from '@/components/HireStaffModal'
import EditStaffModal from '@/components/EditStaffModal'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function PersonnelHub() {
    const [auditSearch, setAuditSearch] = useState('')
    const [staffList, setStaffList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isHireModalOpen, setIsHireModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)

    const fetchStaff = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/staff')
            const data = await res.json()
            if (data.success) {
                setStaffList(data.staff)
            }
        } catch (error) {
            toast.error("Failed to synchronize personnel database")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const handleTerminate = async (id: string, name: string) => {
        if (!confirm(`CAUTION: Initiating permanent termination for ${name}. This action is irreversible. Confirm?`)) return

        const toastId = toast.loading("Executing termination protocol...")
        try {
            const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                toast.success("Personnel purged from system records", { id: toastId })
                fetchStaff()
            } else {
                toast.error(data.message, { id: toastId })
            }
        } catch (error) {
            toast.error("Purge failed", { id: toastId })
        }
    }

    const filteredStaff = staffList.filter((s: any) =>
        s.username.toLowerCase().includes(auditSearch.toLowerCase()) ||
        s.designation.toLowerCase().includes(auditSearch.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                        <Fingerprint className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Personnel Identity Hub</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        Personnel <span className="text-emerald-500 not-italic">HUB</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Shield size={12} className="text-emerald-500" />
                        Infrastructure Personnel & Authorization Directory
                    </p>
                </div>

                <Button
                    onClick={() => setIsHireModalOpen(true)}
                    className="h-14 px-8 bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all group"
                >
                    <UserPlus size={18} className="mr-3 group-hover:scale-110 transition-transform" />
                    Deploy New Faculty
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* STAFF DIRECTORY */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Security Modules */}
                    <Card className="bg-[#080808]/50 border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-emerald-500">
                                    <Settings size={16} />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Force Protocols</h3>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/5 border-emerald-500/20 px-3 py-1">All Systems Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ProtocolMini title="Attendance Live" active={true} />
                            <ProtocolMini title="Payroll Locked" active={false} />
                            <ProtocolMini title="Access Audit" active={true} />
                            <ProtocolMini title="Recruitment" active={true} />
                        </div>
                    </Card>

                    {/* Staff List Repository */}
                    <Card className="bg-[#080808]/50 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-emerald-500 shadow-xl">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Personnel Repository</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mt-1">Active Faculty Tokens: {staffList.length}</CardDescription>
                                    </div>
                                </div>
                                <div className="relative group w-full md:w-80">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Search by name or post..."
                                        className="pl-10 h-14 bg-zinc-950/50 border-white/5 focus:border-emerald-500/50 focus-visible:ring-emerald-500/20 rounded-2xl placeholder:text-zinc-700 font-medium"
                                        value={auditSearch}
                                        onChange={(e) => setAuditSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <Separator className="bg-white/5" />
                        <CardContent className="p-8 space-y-4">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4 text-zinc-700">
                                    <RefreshCcw size={48} className="animate-spin opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Identity Nodes...</p>
                                </div>
                            ) : filteredStaff.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4 bg-zinc-950/20 rounded-[2rem] border-2 border-dashed border-white/5 text-zinc-800">
                                    <Users size={48} className="opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No personnel matching query</p>
                                </div>
                            ) : (
                                filteredStaff.map((staff: any) => (
                                    <div key={staff._id} className="p-6 bg-zinc-950/50 rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden backdrop-blur-sm">
                                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                                            {/* Avatar */}
                                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 relative overflow-hidden group-hover:border-emerald-500/30 transition-all shrink-0">
                                                <img
                                                    src={`https://avatar.iran.liara.run/public/boy?username=${staff.username}`}
                                                    alt={staff.username}
                                                    className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1.5 justify-center">
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">Verified</span>
                                                </div>
                                            </div>

                                            {/* Profile Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center flex-wrap gap-2 mb-2">
                                                    <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{staff.username}</h4>
                                                    <Badge
                                                        className={cn(
                                                            "rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-2",
                                                            staff.ranks === 'Principal' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        )}
                                                    >
                                                        {staff.ranks}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                                        <Briefcase size={14} className="text-zinc-700" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">{staff.designation}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                                        <Banknote size={14} className="text-zinc-700" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">PKR {staff.salary?.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                                        <Calendar size={14} className="text-zinc-700" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">{staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : 'Historical'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedStaff(staff)
                                                        setIsEditModalOpen(true)
                                                    }}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all"
                                                >
                                                    <FileEdit size={18} />
                                                </Button>
                                                {staff.ranks !== 'Principal' && (
                                                    <Button
                                                        onClick={() => handleTerminate(staff._id, staff.username)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* SECURITY & PERFORMANCE */}
                <div className="space-y-6">
                    {/* Authorization Audit */}
                    <Card className="bg-[#080808]/50 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                        <CardHeader className="p-6 pb-2 border-b border-white/5 bg-white/[0.02]">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                <Fingerprint size={16} className="text-emerald-500" />
                                Authorization Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {[
                                { action: 'Faculty Deployed', user: 'Admin', time: '2m ago' },
                                { action: 'Salary Optimized', user: 'Admin', time: '1h ago' },
                                { action: 'Node Purged', user: 'Admin', time: 'Yesterday' }
                            ].map((log, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-zinc-950/50 border border-white/5 rounded-2xl group hover:border-emerald-500/10 transition-all">
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-[11px] font-black text-zinc-300 uppercase italic tracking-tight">{log.action}</p>
                                        <p className="text-[8px] text-zinc-700 font-black uppercase tracking-tighter">Identity: {log.user}</p>
                                    </div>
                                    <span className="text-[8px] font-mono text-zinc-500 font-black bg-white/5 px-2 py-1 rounded-lg uppercase">{log.time}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Termination Warning */}
                    <Card className="bg-red-500/5 border-red-500/20 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <ShieldAlert size={20} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Hazard Protocol</h3>
                        </div>
                        <p className="text-red-500/60 text-[10px] font-black uppercase tracking-widest leading-relaxed italic">
                            Deleting a faculty node will permanently purge all biometric data, session logs, and authorization keys from the main infrastructure.
                        </p>
                    </Card>

                    {/* Sync Module */}
                    <Button
                        variant="ghost"
                        className="w-full h-24 bg-zinc-950/50 border border-white/5 rounded-[2rem] flex items-center justify-between px-8 group hover:border-emerald-500/20 transition-all"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-zinc-700 group-hover:text-emerald-500 transition-colors">
                                <RefreshCcw size={20} className="group-hover:rotate-180 duration-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase text-zinc-300 tracking-widest">Sync Personnel</p>
                                <p className="text-[9px] text-zinc-700 font-black uppercase italic tracking-tighter mt-0.5">Last Pulse: 4m ago</p>
                            </div>
                        </div>
                        <ExternalLink size={16} className="text-zinc-800 group-hover:text-white transition-colors" />
                    </Button>
                </div>
            </div>

            <HireStaffModal
                isOpen={isHireModalOpen}
                setIsOpen={setIsHireModalOpen}
                onSuccess={fetchStaff}
            />

            <EditStaffModal
                isOpen={isEditModalOpen}
                setIsOpen={setIsEditModalOpen}
                staff={selectedStaff}
                onSuccess={fetchStaff}
            />
        </div>
    )
}

function ProtocolMini({ title, active }: { title: string, active: boolean }) {
    return (
        <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-2xl flex flex-col gap-2 group hover:border-emerald-500/10 transition-all">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-zinc-400 transition-colors">{title}</p>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    active ? "bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" : "bg-zinc-800"
                )} />
                <span className={cn(
                    "text-[10px] font-black uppercase italic tracking-tighter",
                    active ? "text-zinc-200" : "text-zinc-700"
                )}>{active ? 'Active' : 'Offline'}</span>
            </div>
        </div>
    )
}
