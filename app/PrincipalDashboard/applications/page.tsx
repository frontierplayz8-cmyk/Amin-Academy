"use client"

import React, { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/lib/useAuthenticatedFetch"
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    Mail, Phone, Briefcase, GraduationCap, Calendar, Clock, Link as LinkIcon,
    CheckCircle2, XCircle, Search, MoreVertical, ExternalLink
} from "lucide-react"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

const ApplicationsPage = () => {
    const { authFetch } = useAuthenticatedFetch()
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Modal state
    const [selectedApp, setSelectedApp] = useState<any>(null)
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false)
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [message, setMessage] = useState('')
    const [meetingDate, setMeetingDate] = useState('')
    const [meetingTime, setMeetingTime] = useState('')
    const [meetingLink, setMeetingLink] = useState('')

    const fetchApplications = async () => {
        try {
            const res = await authFetch('/api/admin/applications')
            const data = await res.json()
            if (data.success) {
                setApplications(data.applications)
            }
        } catch (error) {
            toast.error("Failed to load applications")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [])

    const handleAction = async (status: 'accepted' | 'rejected') => {
        if (!selectedApp) return
        setSubmitting(true)

        try {
            const res = await authFetch('/api/admin/applications/update', {
                method: 'PATCH',
                body: JSON.stringify({
                    id: selectedApp.id,
                    status,
                    message,
                    meetingDate: status === 'accepted' ? meetingDate : undefined,
                    meetingTime: status === 'accepted' ? meetingTime : undefined,
                    meetingLink: status === 'accepted' ? meetingLink : undefined
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success(`Application ${status} successfully`)
                setIsAcceptModalOpen(false)
                setIsRejectModalOpen(false)
                fetchApplications()
                resetForm()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Action failed")
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setMessage('')
        setMeetingDate('')
        setMeetingTime('')
        setMeetingLink('')
        setSelectedApp(null)
    }

    const filteredApplications = applications.filter(app =>
        app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subject.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Applications...</div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto w-full pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                        Career <span className="text-emerald-500">APPLICATIONS</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Reviewing Faculty Influx</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                    <Input
                        placeholder="Search candidates..."
                        className="pl-10 bg-zinc-950/50 border-white/5 rounded-xl h-12"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card className="bg-[#050505] border-white/5 rounded-4xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/2">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">Candidate</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subject</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Experience</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right pr-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApplications.map((app) => (
                                <TableRow key={app.id} className="border-white/5 hover:bg-white/2 transition-colors group">
                                    <TableCell className="py-6 pl-8">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-base">{app.fullName}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">{app.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 rounded-lg text-[10px] px-3">
                                            {app.subject}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-zinc-400 font-medium text-sm">{app.experience}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                app.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                            }
                                        >
                                            {app.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                                                    <MoreVertical size={18} className="text-zinc-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-zinc-950 border-white/5 rounded-2xl p-2 min-w-[200px]">
                                                <DropdownMenuItem onClick={() => { setSelectedApp(app); setIsAcceptModalOpen(true); }} className="rounded-xl focus:bg-emerald-500 focus:text-black font-bold h-11 transition-all">
                                                    <CheckCircle2 size={16} className="mr-3" /> Approve & Schedule
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setSelectedApp(app); setIsRejectModalOpen(true); }} className="rounded-xl focus:bg-red-500/10 focus:text-red-500 font-bold h-11 transition-all">
                                                    <XCircle size={16} className="mr-3" /> Reject Application
                                                </DropdownMenuItem>
                                                {app.linkedinProfile && (
                                                    <DropdownMenuItem asChild className="rounded-xl focus:bg-blue-500/10 focus:text-blue-500 font-bold h-11 transition-all">
                                                        <a href={app.linkedinProfile} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink size={16} className="mr-3" /> View LinkedIn
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredApplications.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center text-zinc-600 text-xs font-black uppercase tracking-widest">
                                        No applications found in the ledger
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Accept & Schedule Modal */}
            <Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
                <DialogContent className="bg-zinc-950 border-white/5 rounded-4xl max-w-lg p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Schedule Interview</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Providing meeting details for {selectedApp?.fullName}</DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Meeting Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                                    <Input
                                        type="date"
                                        className="bg-zinc-950 border-white/5 pl-10 h-12 rounded-xl text-white"
                                        value={meetingDate}
                                        onChange={(e) => setMeetingDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Meeting Time</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                                    <Input
                                        type="time"
                                        className="bg-zinc-950 border-white/5 pl-10 h-12 rounded-xl text-white"
                                        value={meetingTime}
                                        onChange={(e) => setMeetingTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Meeting Link (Zoom/Meet)</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                                <Input
                                    placeholder="https://meet.google.com/..."
                                    className="bg-zinc-950 border-white/5 pl-10 h-12 rounded-xl text-white"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Message to Candidate</Label>
                            <Textarea
                                placeholder="Write a short message..."
                                className="bg-zinc-950 border-white/5 rounded-xl text-white h-32 resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 gap-3">
                        <Button variant="ghost" className="rounded-xl h-12 font-bold uppercase tracking-widest text-xs" onClick={() => setIsAcceptModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic tracking-widest px-8 h-12 rounded-xl flex-1"
                            disabled={submitting || !meetingDate || !meetingTime}
                            onClick={() => handleAction('accepted')}
                        >
                            {submitting ? 'Transmitting...' : 'Approve & Notify'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent className="bg-zinc-950 border-white/5 rounded-4xl max-w-md p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-red-500">Decline Application</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Are you sure you want to decline {selectedApp?.fullName}?</DialogDescription>
                    </DialogHeader>

                    <div className="p-8">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Reason (Optional)</Label>
                        <Textarea
                            placeholder="Briefly explain the decision..."
                            className="bg-zinc-950 border-white/5 rounded-xl text-white h-32 mt-2 resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="p-8 pt-0 gap-3">
                        <Button variant="ghost" className="rounded-xl h-12 font-bold uppercase tracking-widest text-xs" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-red-500 hover:bg-red-400 text-white font-black uppercase italic tracking-widest px-8 h-12 rounded-xl flex-1 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            disabled={submitting}
                            onClick={() => handleAction('rejected')}
                        >
                            {submitting ? 'Transmitting...' : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ApplicationsPage
