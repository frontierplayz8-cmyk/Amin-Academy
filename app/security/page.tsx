'use client'

import React from 'react'
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, Cpu, Database, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function SecurityPage() {
    const protocols = [
        {
            icon: <Fingerprint className="text-emerald-500" size={24} />,
            title: "Identity Integrity",
            content: "We utilize Firebase Authentication for all user sessions. Multi-factor authentication (MFA) is recommended for all faculty accounts to prevent unauthorized access to the administrative oversight system."
        },
        {
            icon: <ShieldCheck className="text-blue-500" size={24} />,
            title: "Geofence Enforcement",
            content: "Attendance reliability is ensured via geographical triangulation. Teachers must be within the designated radius of the academy's coordinates (31.369101, 74.363653) to mark presence."
        },
        {
            icon: <Database className="text-purple-500" size={24} />,
            title: "Database Isolation",
            content: "Your data is stored within isolated Firestore segments. We implement strict security rules to ensure that a student's data is never exposed to unauthorized peers or external sectors."
        },
        {
            icon: <Cpu className="text-amber-500" size={24} />,
            title: "AI Oversight",
            content: "Our AI systems (Gemini) are strictly constrained to educational contexts. We monitor AI interactions to ensure they provide safe, accurate, and ethical academic support."
        },
        {
            icon: <Lock className="text-red-500" size={24} />,
            title: "Encryption Standards",
            content: "All data transmissions utilize TLS 1.3 encryption. Internal sensitive documents are hashed using industrial-grade cryptographic algorithms before storage."
        }
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="space-y-12">
                    <header className="space-y-6 text-center animate-in fade-in slide-in-from-top-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mx-auto">
                            <ShieldAlert size={12} /> Security Protocol v2026
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
                            Security <br /> <span className="text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-600">Infrastructure</span>
                        </h1>
                        <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">
                            Amin Academy employs multi-layered institutional-grade security measures to protect the integrity of the academic network.
                        </p>
                    </header>

                    <div className="h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent my-12" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {protocols.map((protocol, idx) => (
                            <section
                                key={idx}
                                className="p-8 bg-zinc-900/40 border border-white/5 rounded-4xl hover:bg-zinc-900 transition-all group animate-in fade-in zoom-in duration-500 fill-mode-backwards"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {protocol.icon}
                                </div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight text-white mb-4 group-hover:text-emerald-400 transition-colors">
                                    {protocol.title}
                                </h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                                    {protocol.content}
                                </p>
                            </section>
                        ))}

                        <div className="p-8 rounded-4xl bg-linear-to-br from-red-600/20 to-zinc-900 border border-red-500/20 flex flex-col justify-center items-center text-center space-y-4">
                            <Eye size={40} className="text-red-500 animate-pulse" />
                            <h3 className="text-xl font-black italic uppercase text-white">Vulnerability Reporting</h3>
                            <p className="text-zinc-500 text-xs font-medium">Identify a potential security oversight? Report it immediately to our security link for a potential bounty or commendation.</p>
                            <a href="/contact" className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all">Submit Report</a>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 mt-20 text-center">
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                            Continuous Monitoring Pipeline Active | Status: <span className="text-emerald-500">Nominal</span>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
