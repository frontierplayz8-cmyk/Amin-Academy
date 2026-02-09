"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Users,
    FileSpreadsheet,
    ShieldCheck,
    CreditCard,
    Sparkles,
    LogOut,
    Globe,
    FileText,
    ChevronsUpDown,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarRail } from "@/components/ui/sidebar"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { profile } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await signOut(auth)
            router.push('/login')
        } catch (error) {
            console.error("Logout failed", error)
        }
    }

    // Menu Configuration
    const menuGroups = [
        {
            label: "Command",
            items: [
                { icon: LayoutDashboard, label: "Overview", href: "/PrincipalDashboard" },
                { icon: Sparkles, label: "AI Study Room", href: "/PrincipalDashboard/ai-study-room", activeClass: "text-emerald-500" },
                { icon: Sparkles, label: "AI Test Generator", href: "/PrincipalDashboard/generate-test", activeClass: "text-emerald-500" },
                { icon: Users, label: "Student Roster", href: "/PrincipalDashboard/students" },
                { icon: FileSpreadsheet, label: "Academic Records", href: "/PrincipalDashboard/records" },
                { icon: FileText, label: "Past Papers", href: "/PrincipalDashboard/past-papers" },
            ]
        },
        {
            label: "Administration",
            items: [
                { icon: FileSpreadsheet, label: "Curriculum Map", href: "/PrincipalDashboard/curriculum" },
                { icon: CreditCard, label: "Fee Management", href: "/PrincipalDashboard/finance" },
                { icon: Users, label: "Personnel Hub", href: "/PrincipalDashboard/settings" },
                { icon: ShieldCheck, label: "Account Settings", href: "/PrincipalDashboard/profile" },
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
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center">
                    <img
                        src="/academy-logo.png"
                        alt="Amin Academy Branding"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    />
                    <span className="font-black italic text-lg tracking-tighter group-data-[collapsible=icon]:hidden">
                        Amin<span className="text-emerald-500 not-italic">ACADEMY</span>
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {menuGroups.map((group, index) => (
                    <SidebarGroup key={index}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <SidebarMenuItem key={item.label}>
                                            <SidebarMenuButton
                                                render={<Link href={item.href} />}
                                                isActive={isActive}
                                                tooltip={item.label}
                                                className={isActive ? 'bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 hover:text-emerald-400' : 'text-zinc-500 hover:text-zinc-200'}
                                            >
                                                <item.icon className={item.activeClass} />
                                                <span>{item.label}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
