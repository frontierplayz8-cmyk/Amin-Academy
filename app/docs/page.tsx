'use client'

import { useState, useEffect } from 'react';
import {
    BookOpen,
    Sparkles,
    ShieldCheck,
    Zap,
    Lock,
    Bug,
    AlertCircle,
    Code2,
    CheckCircle2,
    Cpu,
    Network,
    Fingerprint,
    Database,
    LineChart,
    Settings,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { UserGuideSection } from "@/components/docs/UserGuideSection";

const DocumentationPage = () => {
    const [activeSection, setActiveSection] = useState("getting-started");

    // Intersection Observer for scroll tracking
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.3 }
        );

        const sections = document.querySelectorAll('section[id]');
        sections.forEach((section) => observer.observe(section));

        return () => sections.forEach((section) => observer.unobserve(section));
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 w-full">
                <DocsSidebar activeSection={activeSection} onSectionChange={scrollToSection} />

                <SidebarInset className="bg-[#020202] border-none font-sans">
                    {/* Header with Sidebar Trigger */}
                    <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-[#020202]/80 backdrop-blur-md flex items-center px-6 justify-between">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-zinc-400 hover:text-white transition-colors" />
                            <div className="h-4 w-px bg-white/10 hidden md:block" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden md:inline-block">
                                Docs / <span className="text-zinc-200">{activeSection.replace('-', ' ')}</span>
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10">
                            Version 2.4.0-Alpha
                        </Button>
                    </header>

                    {/* Main Content Area */}
                    <main className="max-w-4xl mx-auto py-16 lg:py-24 px-6 lg:px-12 pb-32">
                        <div className="space-y-32">

                            {/* Getting Started Section */}
                            <section id="getting-started" className="scroll-mt-32 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center gap-3 text-emerald-500 mb-4">
                                    <Zap size={24} fill="currentColor" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">GETTING STARTED</span>
                                </div>
                                <h1 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter leading-tight">
                                    System <span className="text-emerald-500">Setup</span>
                                </h1>
                                <p className="text-zinc-400 text-lg leading-relaxed font-medium max-w-2xl">
                                    Welcome to the Amin Academy interface. This documentation outlines the protocols for operating our AI-driven academic platform.
                                </p>

                                <div className="grid md:grid-cols-2 gap-6 mt-12">
                                    <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6 group hover:border-emerald-500/20 transition-all">
                                        <div className="space-y-4">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <Cpu size={20} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white tracking-tight">AI Core</h3>
                                            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                                Advanced LLM orchestration for teaching assistance and real-time student evaluation.
                                            </p>
                                        </div>
                                    </Card>
                                    <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6 group hover:border-emerald-500/20 transition-all">
                                        <div className="space-y-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                <Network size={20} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white tracking-tight">Cloud Infrastructure</h3>
                                            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                                Fast academic delivery with under 100ms latency for AI voice interactions.
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </section>

                            {/* Authentication Section */}
                            <section id="authentication" className="scroll-mt-32 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <Lock size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Security</span>
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Access Control Protocols</h2>
                                    <p className="text-zinc-400 leading-relaxed font-medium">
                                        Our security architecture utilizes professional encryption and session management to ensure absolute data integrity.
                                    </p>
                                </div>

                                <Accordion className="w-full space-y-4">
                                    <AccordionItem value="item-1" className="border-white/5 bg-zinc-900/20 rounded-2xl px-6">
                                        <AccordionTrigger className="text-sm font-bold hover:no-underline text-zinc-300">Role-Based Access (RBAC)</AccordionTrigger>
                                        <AccordionContent className="text-zinc-500 text-xs leading-relaxed font-medium pb-4 space-y-2">
                                            <p>Permissions are strictly granular:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li><span className="text-emerald-500 font-bold">Principal:</span> System-wide administrative override.</li>
                                                <li><span className="text-blue-500 font-bold">Teacher:</span> Class orchestration and assessment authority.</li>
                                                <li><span className="text-zinc-300 font-bold">Student:</span> Learning terminal and personal performance data.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="item-2" className="border-white/5 bg-zinc-900/20 rounded-2xl px-6">
                                        <AccordionTrigger className="text-sm font-bold hover:no-underline text-zinc-300">Session Persistence</AccordionTrigger>
                                        <AccordionContent className="text-zinc-500 text-xs leading-relaxed font-medium pb-4">
                                            Authentication tokens are rotated periodically. Failure to sync with the login service will trigger an account lockout.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </section>

                            {/* USER GUIDE SECTIONS */}
                            <UserGuideSection />

                            {/* Teacher Tools Section */}
                            <section id="teacher-tools" className="scroll-mt-32 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <BookOpen size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Pedagogy</span>
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Teacher Workflows</h2>
                                    <p className="text-zinc-400 leading-relaxed font-medium">
                                        Simplify academic tasks with professional automation. Our teacher suite focuses on high-impact instructional delivery.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 rounded-3xl bg-linear-to-br from-zinc-900 to-zinc-950 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Code2 size={120} />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 font-black text-[9px] uppercase tracking-widest">Core Function</Badge>
                                            <h3 className="text-xl font-bold">BISE Exam Generation</h3>
                                            <p className="text-xs text-zinc-500 leading-relaxed font-medium max-w-lg">
                                                Our system analyzes official board patterns (BISE Lahore/Punjab) to generate examinations with full curriculum coverage and precise formatting.
                                            </p>
                                            <div className="flex items-center gap-6 pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-emerald-500 font-black text-xl italic">0.5s</span>
                                                    <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">Generation Time</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-emerald-500 font-black text-xl italic">99.9%</span>
                                                    <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">Board Accuracy</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                <LineChart size={16} className="text-blue-500" /> Automated Grading
                                            </h4>
                                            <p className="text-[11px] text-zinc-500 font-medium">Process subjective and objective assessments instantly with neural handwriting analysis.</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                <Settings size={16} className="text-emerald-500" /> Syllabus Mapping
                                            </h4>
                                            <p className="text-[11px] text-zinc-500 font-medium">Automatic tracking of course completion percentages and dynamic pacing adjustments.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Principal Hub Section */}
                            <section id="principal-hub" className="scroll-mt-32 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <ShieldCheck size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Administration</span>
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Principal Settings</h2>
                                    <p className="text-zinc-400 leading-relaxed font-medium">
                                        The strategic center for institutional management. Manage school operations with clear visibility.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {[
                                        { title: 'Student List', desc: 'Real-time synchronization of student enrollment, biodata, and academic standing.', icon: Fingerprint },
                                        { title: 'Fee Management', desc: 'Automatic fee tracking, processing, and automated payment notifications.', icon: Database },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/40 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                                <item.icon size={18} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-zinc-200">{item.title}</h4>
                                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* AI Learning Section */}
                            <section id="ai-learning" className="scroll-mt-32 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <Sparkles size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Next Gen</span>
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tight">AI Learning Systems</h2>
                                    <p className="text-zinc-400 leading-relaxed font-medium">
                                        Beyond simple tutoring. Our learning systems adapt to individual learning paths for efficient knowledge transfer.
                                    </p>
                                </div>

                                <Card className="bg-[#050505] border-white/5 rounded-3xl p-8 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
                                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                        <div className="flex-1 space-y-6">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold">The AI Study Room</h3>
                                                <p className="text-xs text-zinc-500 leading-relaxed font-medium italic">"The future of education is a personalized 1-on-1 learning experience."</p>
                                            </div>
                                            <ul className="space-y-3">
                                                {[
                                                    'Voice-activated interactive lectures',
                                                    'Instant curriculum-aware Q&A',
                                                    'Real-time concept visualization',
                                                    'Personalized study plans'
                                                ].map((it, idx) => (
                                                    <li key={idx} className="flex items-center gap-3 text-[11px] font-bold text-zinc-400">
                                                        <CheckCircle2 size={14} className="text-emerald-500" /> {it}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="w-full md:w-64 aspect-square rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center relative overflow-hidden group">
                                            <div className="absolute inset-4 rounded-full border border-emerald-500/10 animate-ping duration-1000" />
                                            <Sparkles size={64} className="text-emerald-500 group-hover:scale-125 transition-transform duration-700" />
                                        </div>
                                    </div>
                                </Card>
                            </section>

                            {/* Troubleshooting Section */}
                            <section id="troubleshooting" className="scroll-mt-32 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-zinc-100">
                                        <AlertCircle size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Support</span>
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Technical Resolution</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {[
                                        { q: 'My microphone is not connecting', a: 'Ensure you have granted permission in the browser settings and no other app is using the hardware.' },
                                        { q: 'Error 403: Access Denied', a: 'Your session has expired or your permissions are insufficient for this module.' },
                                        { q: 'Page layout is broken', a: 'The system uses modern CSS features. Ensure you are on the latest version of Chrome or Edge.' },
                                        { q: 'Fee notification issue', a: 'Check the Fee Management module to verify the billing cycle.' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="p-6 rounded-2xl bg-zinc-900 border border-white/5 space-y-2">
                                            <h4 className="text-xs font-black text-zinc-200 uppercase tracking-wide flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {item.q}
                                            </h4>
                                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>


                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default DocumentationPage;
