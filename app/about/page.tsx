'use client'

import Image from 'next/image'
import {
    Target, Award, Quote,
    ChevronRight, Sparkles, ShieldCheck, Users
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
    const principals = [
        {
            name: "Prof. Amin",
            role: "Founder & Chief Executive",
            image: "/principal1.png",
            specialty: "Curriculum Architecture",
            bio: "With over two decades of educational leadership, Prof. Amin envisioned a digital-first ecosystem where Pakistani students could access world-class academic resources instantly."
        },
        {
            name: "Prof. Nadeem",
            role: "Director of Academics",
            image: "/principal3.png",
            specialty: "Pedagogical Innovation",
            bio: "A veteran in board examination strategies, Prof. Nadeem has pioneered the 'Logic-First' teaching methodology that has produced thousands of top-tier results across Punjab."
        },
        {
            name: "Prof. Babar",
            role: "Director of Academics",
            image: "/principal2.png",
            specialty: "Neural Systems & AI",
            bio: "Bridging the gap between traditional learning and future-tech, Sarfraz leads the integration of AI tutors and automated testing systems at Amin Academy."
        }
    ]

    const milestones = [
        { year: "2003", title: "Institutional Genesis", desc: "Foundation laid for Amin Model High School." },
        { year: "2015", title: "Merit Excellence", desc: "Recognition as a top-tier board institution." },
        { year: "2024", title: "Digital Metamorphosis", desc: "Amin Academy Neural Link v1.0 launched." },
        { year: "2026", title: "Scale Elevation", desc: "Global academic synchronization and AI mentors fully active." }
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
            <Navbar />

            <main className="pt-32 pb-24 overflow-x-hidden">
                {/* Hero section - Optimized Heading Hierarchy */}
                <section className="max-w-7xl mx-auto px-6 mb-32 text-center" aria-labelledby="hero-heading">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <Sparkles size={12} aria-hidden="true" /> THE PATH TO PERFECTION
                    </div>
                    <h1 id="hero-heading" className="text-6xl sm:text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8">
                        OUR <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-br from-white via-emerald-400 to-zinc-700">
                            LEGACY
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-zinc-500 text-lg md:text-xl font-medium leading-relaxed italic">
                        "For over 20 years, we haven't just taught subjects; we've engineered the minds that will build Pakistan's tomorrow."
                    </p>
                </section>

                {/* The Triumvirate - Responsive Grid with Semantic Cards */}
                <section className="max-w-7xl mx-auto px-6 mb-40">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                                THE <span className="text-emerald-500">STAFF MEMBERS</span>
                            </h2>
                            <p className="text-zinc-500 font-medium max-w-lg text-lg">Meet the architects behind Amin Academy's unprecedented academic success.</p>
                        </div>
                        <div className="flex gap-4">
                            {[
                                { val: "3", label: "Staff" },
                                { val: "20+", label: "Years Experience" }
                            ].map((stat, i) => (
                                <div key={i} className="px-6 py-4 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col items-center min-w-[120px] shadow-2xl">
                                    <span className="text-3xl font-black italic mb-1">{stat.val}</span>
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        {principals.map((p, idx) => (
                            <article key={idx} className="group flex flex-col">
                                <div className="relative aspect-4/5 rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 mb-8 shadow-2xl group-hover:border-emerald-500/30 transition-all duration-500">
                                    <Image
                                        src={p.image}
                                        alt={`Portrait of ${p.name}, ${p.role}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                                        priority={idx === 0}
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80" />
                                    <div className="absolute bottom-10 left-10 right-10">
                                        <div className="inline-block px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
                                            {p.specialty}
                                        </div>
                                        <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-1">{p.name}</h3>
                                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-mono">{p.role}</p>
                                    </div>
                                </div>
                                <div className="px-6 space-y-4">
                                    <Quote size={28} className="text-emerald-500 opacity-20" aria-hidden="true" />
                                    <p className="text-zinc-400 text-lg font-medium leading-relaxed italic group-hover:text-zinc-300 transition-colors">
                                        {p.bio}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Core Philosophy - Image Optimization */}
                <section className="bg-zinc-900/30 py-40 border-y border-white/5 relative overflow-hidden backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="order-2 lg:order-1">
                                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-12">
                                    BEYOND THE <br /> <span className="text-emerald-500">TEXTBOOKS</span>
                                </h1>
                                <div className="space-y-10">
                                    {[
                                        { icon: <Target className="text-emerald-500" size={24} />, title: "Precision Learning", desc: "Data-driven insights to target individual student weaknesses." },
                                        { icon: <ShieldCheck className="text-emerald-500" size={24} />, title: "Ethical Excellence", desc: "Maintaining high standards of academic integrity and conduct." },
                                        { icon: <Award className="text-emerald-500" size={24} />, title: "Proven Velocity", desc: "Consistently delivering top-tier board results for over 20 years." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-8 group">
                                            <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-emerald-500/30 transition-all shadow-xl">
                                                {item.icon}
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black italic uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                                                <p className="text-zinc-500 text-lg font-medium leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-1 lg:order-2 relative">
                                <div className="relative aspect-square rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl group">
                                    <Image
                                        src="/principals-group.webp"
                                        alt="Leadership team collaborating on curriculum"
                                        fill
                                        className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-tr from-emerald-500/20 via-transparent to-blue-500/10 mix-blend-overlay" />
                                </div>
                                {/* Stats Floating Card */}
                                <div className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 p-8 md:p-10 bg-zinc-950/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] animate-in zoom-in duration-700">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                            <Users size={24} className="text-black" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] leading-none mb-2">IMPACT CIRCLE</p>
                                            <p className="text-3xl font-black italic text-white leading-none">1500+</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Milestone Timeline */}
                <section className="max-w-7xl mx-auto px-6 py-40">
                    <header className="text-center mb-24 space-y-6">
                        <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter">STRATEGIC <span className="text-emerald-500">TIMELINE</span></h2>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-zinc-800" />
                            <p className="text-zinc-500 font-bold tracking-[0.3em] font-mono text-xs uppercase italic">Evolution of Excellence</p>
                            <div className="h-px w-12 bg-zinc-800" />
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {milestones.map((m, i) => (
                            <div key={i} className="p-12 rounded-[2.5rem] bg-zinc-950 border border-white/5 hover:bg-zinc-900/50 hover:border-emerald-500/20 transition-all duration-500 group overflow-hidden relative shadow-2xl">
                                <span className="absolute -top-12 -right-12 text-[10rem] font-black italic text-zinc-800/10 group-hover:text-emerald-500/5 transition-all duration-700 pointer-events-none tracking-tighter">
                                    {m.year}
                                </span>
                                <div className="relative z-10 space-y-8">
                                    <div className="w-12 h-1 bg-emerald-500/30 group-hover:w-20 group-hover:bg-emerald-500 transition-all duration-500 rounded-full" />
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black italic text-emerald-500 mb-2">{m.year}</h3>
                                        <h4 className="text-xl font-black italic uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors leading-tight">
                                            {m.title}
                                        </h4>
                                        <p className="text-zinc-500 text-lg font-medium leading-relaxed group-hover:text-zinc-400 transition-colors">
                                            {m.desc}
                                        </p>
                                    </div>
                                    <div className="pt-4 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800 group-hover:text-emerald-500/50 transition-colors">Mission Phase</span>
                                        <ChevronRight size={20} className="text-zinc-800 group-hover:text-white group-hover:translate-x-2 transition-all duration-300" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}