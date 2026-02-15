"use client"

import React, { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "@/lib/useAuthenticatedFetch"
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Bell, Mail, Calendar, Clock, CheckCircle2, XCircle,
    ChevronRight, Trash2, ShieldCheck, MapPin, ExternalLink
} from "lucide-react"

const NotificationsPage = () => {
    const { authFetch } = useAuthenticatedFetch()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            const res = await authFetch('/api/notifications')
            const data = await res.json()
            if (data.success) {
                setNotifications(data.notifications)
            }
        } catch (error) {
            toast.error("Failed to load notifications")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const markAsRead = async (id: string, currentStatus: string) => {
        if (currentStatus === 'read') return

        try {
            const res = await authFetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ notificationId: id })
            })
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n))
            }
        } catch (error) {
            console.error("Mark as read failed")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Notifications...</div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-[1000px] mx-auto w-full pt-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                        System <span className="text-emerald-500">ALERTS</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Network Transmission Logs</p>
                </div>
                {notifications.filter(n => n.status === 'unread').length > 0 && (
                    <Badge className="bg-emerald-500 text-black font-black text-[10px] py-1 px-3 animate-pulse">
                        {notifications.filter(n => n.status === 'unread').length} NEW
                    </Badge>
                )}
            </div>

            <div className="grid gap-4">
                {notifications.map((notif) => (
                    <Card
                        key={notif.id}
                        className={`bg-zinc-900/10 border-white/5 hover:border-emerald-500/20 transition-all duration-300 rounded-3xl overflow-hidden group ${notif.status === 'unread' ? 'border-l-4 border-l-emerald-500' : ''}`}
                        onClick={() => markAsRead(notif.id, notif.status)}
                    >
                        <CardContent className="p-6">
                            <div className="flex gap-6 items-start">
                                <div className={`p-4 rounded-2xl shrink-0 ${notif.type === 'career_update' ? (notif.title.includes('Accepted') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500') : 'bg-zinc-900 text-zinc-500'
                                    }`}>
                                    {notif.type === 'career_update' ? (notif.title.includes('Accepted') ? <CheckCircle2 size={24} /> : <XCircle size={24} />) : <Bell size={24} />}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-black uppercase italic tracking-tight text-white">{notif.title}</h3>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                                {new Date(notif.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        {notif.status === 'unread' && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Unread</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                                        {notif.message}
                                    </p>

                                    {notif.data?.meetingDate && (
                                        <div className="mt-6 p-6 rounded-4xl bg-emerald-500/5 border border-emerald-500/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                                    <Calendar size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Scheduled Date</span>
                                                    <span className="text-xs font-bold text-white">{notif.data.meetingDate}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                                    <Clock size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Meeting Time</span>
                                                    <span className="text-xs font-bold text-white">{notif.data.meetingTime}</span>
                                                </div>
                                            </div>
                                            {notif.data.meetingLink && (
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                                        <ExternalLink size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Digital Portal</span>
                                                        <a href={notif.data.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-500 hover:underline">
                                                            Enter Meeting
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {notif.data?.response && !notif.data?.meetingDate && (
                                        <div className="mt-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                                            <p className="text-xs text-zinc-500 leading-relaxed italic">
                                                " {notif.data.response} "
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                        <div className="p-6 rounded-full bg-zinc-900 border border-white/5 text-zinc-700">
                            <Bell size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-zinc-500 uppercase italic tracking-tighter">Quiet Frequency</h3>
                            <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">No transmissions detected at this time</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationsPage
