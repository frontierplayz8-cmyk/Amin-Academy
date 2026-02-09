"use client"

import React, { useState } from 'react';
import {
    LayoutDashboard,
    ShieldCheck,
    Sparkles,
    LogOut,
    ChevronRight,
    Menu,
    X,
    Bell,
    Globe,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar"
import { Separator } from "@/components/ui/separator";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/register');
            } else if (profile?.ranks !== 'Teacher') {
                router.push('/'); // Redirect unauthorized users
            }
        }
    }, [user, loading, profile, router]);

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
    );

    if (!profile || profile.ranks !== 'Teacher') return null;

    return (
        <SidebarProvider>
            <TeacherSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 bg-black/20 backdrop-blur-md px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/TeacherDashboard" className="hover:text-emerald-500 transition-colors">Instructor</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="opacity-20" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-zinc-200">Terminal Access</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Connection Stable</span>
                        </div>
                    </div>
                </header>
                <div className="flex-1 p-4 pt-0 custom-scrollbar overflow-hidden flex flex-col h-[calc(100vh-4rem)]">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
