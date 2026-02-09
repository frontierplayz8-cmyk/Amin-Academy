"use client"

import React from 'react'
import AccountSettings from '@/components/AccountSettings'
import { Settings, Shield } from 'lucide-react'

export default function PrincipalProfilePage() {
    return (
        <div className="min-h-full bg-[#020202] py-12 px-10 relative">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-12">
                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <Settings size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Administrative Node</span>
                </div>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                    Account <span className="text-emerald-500 underline decoration-emerald-500/20">Settings</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-2 font-medium">Configure your personnel profile and infrastructure security keys.</p>
            </div>

            <AccountSettings />
        </div >
    )
}
