"use client"
import React, { useEffect } from 'react'
import {
    Bell,
    BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { StudentSidebar } from "@/components/dashboard/StudentSidebar"
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const StudentLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/register')
        }
    }, [user, loading, router])

    if (loading) return (
        <div className="flex h-screen bg-[#020202]">
            <aside className="w-72 border-r border-white/5 bg-[#050505] flex flex-col p-6">
                <div className="w-12 h-12 bg-white/5 rounded-full mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-10 bg-white/5 rounded-xl" />
                    ))}
                </div>
            </aside>
            <main className="flex-1 p-10">
                <div className="h-8 w-48 bg-white/5 rounded-lg mb-8" />
                <div className="h-64 bg-white/5 rounded-3xl" />
            </main>
        </div>
    )

    if (!user) return null

    return (
        <SidebarProvider>
            <StudentSidebar />
            <SidebarInset className="bg-[#020202]">
                <header className="sticky top-0 w-full h-16 px-4 md:px-8 bg-[#020202]/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center z-40">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />
                        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic hidden lg:block">
                            System<span className="text-emerald-500">01</span>_Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/notifications" className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#020202]" />
                        </Link>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default StudentLayout
