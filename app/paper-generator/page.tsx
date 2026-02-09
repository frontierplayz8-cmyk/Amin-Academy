import Navbar from '@/components/Navbar'
import { Sparkles, Zap, FileText, Languages, Layout, Share2, MoveRight } from 'lucide-react'
import Link from 'next/link'

export default function PaperGeneratorLanding() {
    const steps = [
        {
            icon: <Layout className="text-emerald-500" size={24} />,
            title: "Select Format",
            desc: "Choose from multiple board patterns and classes 1-11."
        },
        {
            icon: <Zap className="text-emerald-500" size={24} />,
            title: "AI Synthesis",
            desc: "Our engine crafts curriculum-aligned questions automatically."
        },
        {
            icon: <Languages className="text-emerald-500" size={24} />,
            title: "Bilingual Output",
            desc: "Instant translation between English and Urdu scripts."
        },
        {
            icon: <FileText className="text-emerald-500" size={24} />,
            title: "Export & Print",
            desc: "Download high-quality PDFs formatted for board exams."
        }
    ]

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-emerald-500/40 overflow-hidden">
            <Navbar />

            {/* GLOW EFFECT */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-emerald-600/5 blur-[160px] rounded-full pointer-events-none" />

            <main className="relative pt-32 pb-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-32">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs font-black uppercase tracking-widest text-emerald-400 mb-10">
                            <Sparkles size={16} className="animate-pulse" />
                            Next-Gen Examination Logic
                        </div>

                        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-none uppercase italic">
                            AI Paper <br /><span className="text-emerald-500">Synthesis.</span>
                        </h1>

                        <p className="text-zinc-500 max-w-2xl text-lg leading-relaxed mb-12 font-medium">
                            Eliminate hours of manual formatting. Generate professional, curriculum-aware examination papers for any subject in seconds.
                        </p>

                        <Link href="/register" className="group bg-zinc-100 text-black px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all duration-300 flex items-center gap-3">
                            Start Generating Now <MoveRight className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        {steps.map((s, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-3xl hover:bg-zinc-800/60 transition-colors">
                                <div className="mb-6">{s.icon}</div>
                                <h3 className="text-lg font-black uppercase italic mb-2">{s.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-32 p-12 rounded-[3.5rem] bg-emerald-950/20 border border-emerald-500/20 text-center">
                        <h2 className="text-3xl font-black uppercase italic mb-4">Board Level Ready</h2>
                        <p className="text-zinc-500 mb-8 max-w-xl mx-auto">Our formatting engine adheres to the strict layout requirements of BISE and other regional educational boards.</p>
                        <div className="flex justify-center flex-wrap gap-8 grayscale opacity-50">
                            <div className="text-xl font-bold italic tracking-tighter underline">MATRIC</div>
                            <div className="text-xl font-bold italic tracking-tighter underline">FSc</div>
                            <div className="text-xl font-bold italic tracking-tighter underline">MIDDLE</div>
                            <div className="text-xl font-bold italic tracking-tighter underline">PRIMARY</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
