"use client"

import React from 'react'
import AccountSettings from '@/components/AccountSettings'
import { Settings, User } from 'lucide-react'

export default function TeacherProfilePage() {
    return (
        <div className="min-h-full bg-[#020202] py-12 px-10 relative overflow-hidden">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-12">
                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <User size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Faculty Profile</span>
                </div>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                    Instructor <span className="text-emerald-500 underline decoration-emerald-500/20">Portal</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-2 font-medium">Manage your faculty credentials and professional documentation.</p>
            </div>

            <AccountSettings />
        </div>
    )
}
