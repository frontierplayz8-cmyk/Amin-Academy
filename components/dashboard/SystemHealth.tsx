"use client"

import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { Database, HardDrive, Zap } from "lucide-react"
import { useState, useEffect, Activity } from "react"
import { Card } from "../ui/card"

export default function SystemHealth() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        dbUsage: 0,
        storageUsage: 0,
        apiLatency: 0,
        status: 'Scanning...'
    })

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                // Determine latency client-side as well
                const start = performance.now()

                // We can pass token if we want strict security, 
                // but for dashboard visuals we'll allow the API to run public 
                // or just pass it if available.
                const headers: any = {}
                if (user) {
                    const token = await user.getIdToken()
                    headers['Authorization'] = `Bearer ${token}`
                }

                const res = await fetch('/api/admin/system-health', { headers })
                const data = await res.json()

                console.log("Health Data:", data)

                const end = performance.now()
                const networkLatency = Math.round(end - start)

                setStats({
                    dbUsage: data.dbUsage || 0,
                    storageUsage: data.storageUsage || 0,
                    apiLatency: data.apiLatency + networkLatency, // Server + Network
                    status: 'Optimal'
                })
            } catch (e) {
                console.error("Health Check Failed:", e)
                setStats(prev => ({ ...prev, status: 'Offline' }))
            }
        }

        fetchHealth()
        const interval = setInterval(fetchHealth, 30000) // Reverted to 30s
        return () => clearInterval(interval)
    }, [user])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full animate-in fade-in duration-700">
            <HealthCard
                title="Nexus Database"
                value={`${stats.dbUsage}%`}
                subtext="Firestore Capacity"
                icon={Database}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                border="border-emerald-500/20"
                progress={stats.dbUsage}
            />
            <HealthCard
                title="Vault Storage"
                value={`${stats.storageUsage}%`}
                subtext="5GB Tier Quota"
                icon={HardDrive}
                color="text-blue-500"
                bg="bg-blue-500/10"
                border="border-blue-500/20"
                progress={stats.storageUsage}
            />
            <HealthCard
                title="Network Latency"
                value={`${stats.apiLatency}ms`}
                subtext="Edge Performance"
                icon={Activity}
                color="text-amber-500"
                bg="bg-amber-500/10"
                border="border-amber-500/20"
            />
            <HealthCard
                title="System Status"
                value={stats.status}
                subtext="All Systems Operational"
                icon={Zap}
                color="text-purple-500"
                bg="bg-purple-500/10"
                border="border-purple-500/20"
            />
        </div>
    )
}

function HealthCard({ title, value, subtext, icon: Icon, color, bg, border, progress }: any) {
    return (
        <Card className={cn("relative overflow-hidden p-6 rounded-[2rem] bg-[#080808]/60 backdrop-blur-xl border border-white/5 group hover:border-white/10 transition-all duration-500", border)}>
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={cn("p-2 rounded-xl", bg)}>
                            <Icon size={16} className={color} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{title}</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black italic text-white tracking-tighter">{value}</h3>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">{subtext}</p>
                    </div>
                </div>

                {progress !== undefined && (
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-zinc-800"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 28}
                                strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
                                className={cn("transition-all duration-1000", color)}
                            />
                        </svg>
                        <Zap size={16} className={cn("absolute", color)} />
                    </div>
                )}
            </div>
        </Card>
    )
}
