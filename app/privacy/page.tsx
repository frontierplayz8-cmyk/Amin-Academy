'use client'

import { Shield, Lock, Eye, Server, UserCheck, Bell } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
    const sections = [
        {
            icon: <UserCheck className="text-emerald-500" size={24} />,
            title: "Data Acquisition",
            content: "Amin Academy collects personal information necessary to facilitate enrollment and academic progress. This includes student names, guardian contact details, and performance metrics. We only collect data that contributes to the educational lifecycle."
        },
        {
            icon: <Shield className="text-blue-500" size={24} />,
            title: "Encryption Protocols",
            content: "All sensitive data, including authentication tokens and grade records, are encrypted both at rest and in transit via Secure Socket Layer (SSL) technology and Firebase security rules."
        },
        {
            icon: <Eye className="text-amber-500" size={24} />,
            title: "Transparency",
            content: "We believe in radical data transparency. Students and guardians have the right to request a full dump of their academic and personal data stored on our neural infrastructure at any time."
        },
        {
            icon: <Server className="text-purple-500" size={24} />,
            title: "Third-Party Sync",
            content: "We do not sell, trade, or rent user identity data to external marketing sectors. Data is only shared with authorized educational boards or service providers (like Firebase) strictly for functional operations."
        },
        {
            icon: <Lock className="text-red-500" size={24} />,
            title: "Access Control",
            content: "Multi-layered role-based access control (RBAC) ensures that only authorized faculty (Teachers/Principals) can access specific datasets relevant to their administrative sector."
        }
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="space-y-12">
                    <header className="space-y-6 text-center animate-in fade-in slide-in-from-top-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mx-auto">
                            <Lock size={12} /> Privacy Protocol v2026
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
                            Data <br /> <span className="text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-600">Sovereignty</span>
                        </h1>
                        <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">
                            Our privacy framework is built on the principles of security, transparency, and student protection.
                        </p>
                    </header>

                    <div className="h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent my-12" />

                    <div className="space-y-16">
                        {sections.map((section, idx) => (
                            <section key={idx} className="group animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                                        {section.icon}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                                            {section.title}
                                        </h3>
                                        <p className="text-zinc-400 leading-relaxed text-lg font-medium">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

                    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 mt-20 space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-300">
                            <Bell size={16} className="text-amber-500" /> Policy Updates
                        </h4>
                        <p className="text-zinc-500 text-sm font-medium">
                            Amin Academy reserves the right to refine these protocols to adapt to new regulatory frameworks. Critical changes will be transmitted via direct dashboard notifications.
                        </p>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest pt-4">Last Sync: February 2026</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
