"use client"

import * as React from "react"
import {
    Zap,
    Lock,
    BookOpen,
    ShieldCheck,
    Sparkles,
    Bug,
    AlertCircle,
    MessageSquare,
    Terminal,
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

const navigation = [
    {
        group: "Introduction",
        items: [
            { id: "getting-started", title: "Getting Started", icon: Zap },
            { id: "authentication", title: "Authentication", icon: Lock },
        ]
    },
    {
        group: "User Guide",
        items: [
            { id: "user-roles", title: "User Roles & Permissions", icon: ShieldCheck },
            { id: "paper-generation", title: "AI Paper Generation", icon: Sparkles },
            { id: "paper-architect", title: "Paper Architect & Editor", icon: BookOpen },
            { id: "student-records", title: "Student Records", icon: Terminal },
            { id: "faq", title: "FAQ", icon: MessageSquare },
        ]
    },
    {
        group: "Core Features",
        items: [
            { id: "teacher-tools", title: "Teacher Workflows", icon: BookOpen },
            { id: "principal-hub", title: "Administrative Hub", icon: ShieldCheck },
            { id: "ai-learning", title: "AI Learning Systems", icon: Sparkles },
        ]
    },
    {
        group: "Technical Reference",
        items: [
            { id: "troubleshooting", title: "Troubleshooting", icon: AlertCircle },
        ]
    }
]

interface DocsSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeSection: string
    onSectionChange: (id: string) => void
}

export function DocsSidebar({ activeSection, onSectionChange, ...props }: DocsSidebarProps) {
    return (
        <Sidebar variant="inset" {...props} className="bg-[#020202] border-white/5">
            <SidebarHeader className="border-b border-white/5 py-6">
                <div className="flex items-center gap-3 px-4">
                    <Terminal size={20} className="text-emerald-500" />
                    <span className="font-black italic text-lg tracking-tighter">
                        Amin<span className="text-emerald-500 not-italic">DOCS</span>
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent className="py-6">
                {navigation.map((group, index) => (
                    <SidebarGroup key={index}>
                        <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4">
                            {group.group}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="px-2">
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            onClick={() => onSectionChange(item.id)}
                                            isActive={activeSection === item.id}
                                            tooltip={item.title}
                                            className={
                                                activeSection === item.id
                                                    ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400"
                                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                                            }
                                        >
                                            <item.icon size={18} />
                                            <span className="font-bold text-xs">{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
