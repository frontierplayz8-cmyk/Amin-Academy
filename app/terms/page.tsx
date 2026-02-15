'use client'

import { FileText, Gavel, UserX, CreditCard, Cpu, GraduationCap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
    const terms = [
        {
            icon: <GraduationCap className="text-emerald-500" size={24} />,
            title: "Enrollment & Admission",
            content: "Admission to Amin Academy is subject to verification. Valid documentation must be provided. Concurrent admission with other institutes is governed by board regulations. False documentation results in immediate termination of the student account."
        },
        {
            icon: <Gavel className="text-blue-500" size={24} />,
            title: "Code of Ethics",
            content: "Students are expected to maintain professional conduct across all digital and physical areas of the academy. Cyber-bullying, plagiarism in AI-generated tests, or disrespect towards faculty will trigger disciplinary review."
        },
        {
            icon: <Cpu className="text-purple-500" size={24} />,
            title: "Intellectual Property",
            content: "All lecture content, test algorithms, and AI Study Room data are the proprietary property of Amin Academy. Unauthorized distribution, recording, or mirroring of these assets is strictly prohibited."
        },
        {
            icon: <CreditCard className="text-amber-500" size={24} />,
            title: "Financial Dues",
            content: "Semester dues must be cleared within the designated timeline to ensure uninterrupted access to dashboard services. Fees are generally non-refundable unless specified under the Global Refund Policy."
        },
        {
            icon: <UserX className="text-red-500" size={24} />,
            title: "Termination of Services",
            content: "Amin Academy reserves the right to suspend or terminate account access for users who breach security policies, disrupt educational activities, or engage in unauthorized system manipulation."
        }
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="space-y-12">
                    <header className="space-y-6 text-center animate-in fade-in slide-in-from-top-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest mx-auto">
                            <FileText size={12} /> Terms of Service v2026
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
                            Terms of <br /> <span className="text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-600">Conduct</span>
                        </h1>
                        <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">
                            The governing framework for students, faculty, and systems operating within the Amin Academy ecosystem.
                        </p>
                    </header>

                    <div className="h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent my-12" />

                    <div className="space-y-16">
                        {terms.map((term, idx) => (
                            <section key={idx} className="group animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                                        {term.icon}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">
                                            {term.title}
                                        </h3>
                                        <p className="text-zinc-400 leading-relaxed text-lg font-medium">
                                            {term.content}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

                    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 mt-20 border-l-4 border-l-blue-600">
                        <p className="text-zinc-400 text-sm font-medium italic">
                            "By accessing our platform and educational services, you agree to adhere to these policies. Failure to comply may result in loss of access to the Academy."
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
