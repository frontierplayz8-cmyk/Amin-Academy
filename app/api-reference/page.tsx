'use client'

import {
    Code2,
    Terminal,
    Key,
    ChevronRight} from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function APIReferencePage() {
    const endpoints = [
        {
            method: "GET",
            path: "/api/lectures",
            desc: "Retrieve the full registry of available educational content nodes.",
            params: ["subject", "topic", "search"]
        },
        {
            method: "POST",
            path: "/api/auth/register",
            desc: "Initialize a new user identity within the Academy neural network.",
            params: ["username", "email", "password", "ranks"]
        },
        {
            method: "DELETE",
            path: "/api/lectures?id={uid}",
            desc: "Purge a specific content node (Principal authentication required).",
            params: ["id"]
        },
        {
            method: "POST",
            path: "/api/ai/voice-call",
            desc: "Initiate a real-time voice synthesis channel with the AI Mentor.",
            params: ["studentId", "context"]
        }
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Navigation Sidebar */}
                    <aside className="lg:col-span-3 space-y-8 hidden lg:block">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Core Protocols</h3>
                            <nav className="space-y-2">
                                {["Authentication", "Lectures API", "Staff Metrics", "AI Channels", "Webhooks"].map((item, i) => (
                                    <button key={i} className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-between group">
                                        {item}
                                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Content Section */}
                    <div className="lg:col-span-9 space-y-12">
                        <header className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                <Terminal size={12} /> API Infrastructure v3.0
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
                                Neural <br /> <span className="text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-600">Reference</span>
                            </h1>
                            <p className="text-zinc-500 text-lg font-medium max-w-2xl">
                                Documentation for developers and system administrators interacting with Amin Academy's automated educational backbone.
                            </p>
                        </header>

                        <div className="h-px bg-linear-to-r from-emerald-500/30 via-zinc-800 to-transparent" />

                        <div className="space-y-10">
                            {endpoints.map((endpoint, idx) => (
                                <section key={idx} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:border-emerald-500/20 transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                endpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`}>
                                                {endpoint.method}
                                            </span>
                                            <code className="text-zinc-300 font-mono text-sm md:text-lg bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                                {endpoint.path}
                                            </code>
                                        </div>
                                        <button className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                                            <Code2 size={14} /> View Schema
                                        </button>
                                    </div>

                                    <p className="text-zinc-400 font-medium mb-6">{endpoint.desc}</p>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Accepted Parameters</p>
                                        <div className="flex flex-wrap gap-2">
                                            {endpoint.params.map((p, i) => (
                                                <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-mono rounded-md border border-white/5">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>

                        <div className="p-10 rounded-[2.5rem] bg-linear-to-br from-indigo-600/10 to-transparent border border-white/5 space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                <Key className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase text-white">Security & Authentication</h3>
                            <p className="text-zinc-500 font-medium leading-relaxed">
                                Most endpoints require a <span className="text-white">Bearer Token</span> in the Authorization header. Tokens must be generated via the Auth Provider and validated on the Academy's server-side sector.
                            </p>
                            <code className="block bg-black p-4 rounded-xl border border-white/5 text-zinc-400 font-mono text-xs">
                                Authorization: Bearer &#60;firebase_id_token&#62;
                            </code>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
