"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Sparkles,
    FileText,
    ShieldCheck,
    LogOut,
    ChevronRight,
    ChevronsUpDown,
    Globe
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarRail
} from "@/components/ui/sidebar"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function TeacherSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { profile } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await signOut(auth)
            window.location.href = '/login'
        } catch (error) {
            console.error("Logout failed", error)
        }
    }

    const menuGroups = [
        {
            label: "Instructor Node",
            items: [
                { icon: LayoutDashboard, label: "Overview", href: "/TeacherDashboard" },
                { icon: Sparkles, label: "Image Editor", href: "/architect-studio" },
            ]
        },
        {
            label: "Management",
            items: [
                { icon: FileText, label: "Past Papers", href: "/TeacherDashboard/past-papers" },
                { icon: ShieldCheck, label: "Account Settings", href: "/TeacherDashboard/profile" },
            ]
        },
        {
            label: "Satellite View",
            items: [
                { icon: Globe, label: "Visit Website", href: "/" },
            ]
        }
    ]

    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-white/5 bg-[#050505]">
            <SidebarHeader className="border-b border-white/5 py-4">
                <div className="flex items-center gap-3 px-4 group-data-[collapsible=icon]:justify-center">
                    <img
                        src="/academy-logo.png"
                        alt="Amin Academy Branding"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    />
                    <span className="font-black italic text-lg tracking-tighter group-data-[collapsible=icon]:hidden text-white">
                        Amin<span className="text-emerald-500 not-italic">ACADEMY</span>
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="py-6 no-scrollbar">
                {menuGroups.map((group, index) => (
                    <SidebarGroup key={index}>
                        <SidebarGroupLabel>
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <SidebarMenuItem key={item.label}>
                                            <SidebarMenuButton
                                                render={<Link href={item.href} />}
                                                isActive={isActive}
                                                tooltip={item.label}
                                                className={`h-12 rounded-xl transition-all duration-300 font-bold text-xs ${isActive
                                                    ? 'bg-emerald-500/10 text-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'
                                                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                                                    }`}
                                            >
                                                <item.icon size={18} className={isActive ? 'text-emerald-500' : 'text-zinc-400'} />
                                                <span>{item.label}</span>
                                                {isActive && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                )}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent >

            <SidebarFooter className="p-4 border-t border-white/5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="w-full h-16 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all group"
                                >
                                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-zinc-950 border border-white/10 text-emerald-500 text-sm font-black italic shadow-xl group-hover:border-emerald-500/40 transition-all">
                                        {profile?.username?.charAt(0) || "T"}
                                    </div>
                                    <div className="grid flex-1 text-left text-xs leading-tight ml-3">
                                        <span className="truncate font-black uppercase text-white tracking-widest italic">{profile?.username || "Teacher Node"}</span>
                                        <span className="truncate text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Faculty Terminal</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-[1.5rem] bg-zinc-950 border-white/5 text-zinc-200 p-2 shadow-2xl backdrop-blur-xl"
                                side="top"
                                align="end"
                                sideOffset={8}
                            >
                                <DropdownMenuLabel className="px-4 py-3 font-normal">
                                    <div className="flex items-center gap-3">
                                        <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 text-emerald-500 text-sm font-black italic">
                                            {profile?.username?.charAt(0) || "T"}
                                        </div>
                                        <div className="grid flex-1 text-left text-xs leading-tight">
                                            <span className="truncate font-black uppercase text-white tracking-widest italic">{profile?.username || "Teacher Node"}</span>
                                            <span className="truncate text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Academic Staff</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5 my-2" />
                                <DropdownMenuItem className="focus:bg-emerald-500/10 focus:text-emerald-500 cursor-pointer rounded-xl h-11 px-4 font-bold text-xs gap-3 transition-colors" asChild>
                                    <Link href="/TeacherDashboard/profile">
                                        <ShieldCheck size={16} />
                                        Profile Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5 my-2" />
                                <DropdownMenuItem
                                    className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-xl h-11 px-4 font-bold text-xs gap-3 transition-colors"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    Terminate Session
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar >
    )
}
