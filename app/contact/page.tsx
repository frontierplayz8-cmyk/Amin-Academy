'use client'

import React, { useState } from 'react'
import {
    Mail,
    Phone,
    MapPin,
    MessageSquare,
    Send,
    Globe,
    Clock,
    ChevronRight,
    Headphones
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { toast } from 'sonner'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        toast.success("Message Transmitted. Our support protocols have been initiated.")
        setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' })
        setIsSubmitting(false)
    }

    const contactInfo = [
        {
            icon: <Phone className="text-emerald-500" size={24} />,
            title: "Direct Line",
            detail: "+92 300 1234567",
            sub: "Mon - Sat, 9am - 9pm PKT",
            action: "tel:+923001234567"
        },
        {
            icon: <Mail className="text-blue-500" size={24} />,
            title: "Support Node",
            detail: "support@aminacademy.edu.pk",
            sub: "24/7 Digital Sync",
            action: "mailto:support@aminacademy.edu.pk"
        },
        {
            icon: <MapPin className="text-amber-500" size={24} />,
            title: "Physical HQ",
            detail: "Main GT Road, Lahore, Pakistan",
            sub: "Sector 7G-A, Education Block",
            action: "https://maps.google.com"
        }
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Connectivity Hub
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
                            Establish <br /> <span className="text-transparent bg-clip-text bg-linear-to-br from-emerald-400 to-blue-600">Contact</span>
                        </h1>
                        <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-lg">
                            Have questions about our curriculum or AI-powered features? Reach out to our administrative oversight team.
                        </p>
                    </div>

                    <div className="hidden lg:block">
                        <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-t border-emerald-500/30 animate-spin transition-all duration-1000" />
                            <Headphones size={60} className="text-zinc-800" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-zinc-900/30 border border-white/5 p-8 md:p-12 rounded-4xl backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MessageSquare size={120} />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Identity</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Your Name"
                                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Digital Mail</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="email@example.com"
                                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Protocol Type</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        <option>General Inquiry</option>
                                        <option>Admission Support</option>
                                        <option>Technical Issue</option>
                                        <option>Fee Management</option>
                                        <option>Partnership</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Transmission Data</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="How can we assist your academic journey?"
                                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium resize-none"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Transmitting...
                                        </span>
                                    ) : (
                                        <>
                                            Initiate Sync <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Contact Sidebar */}
                    <div className="lg:col-span-5 space-y-6">
                        {contactInfo.map((info, idx) => (
                            <a
                                key={idx}
                                href={info.action}
                                target={info.title === "Physical HQ" ? "_blank" : undefined}
                                className="block p-8 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-white/10 hover:bg-zinc-900 transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {info.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{info.title}</p>
                                        <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors uppercase italic tracking-tight">{info.detail}</h4>
                                        <p className="text-sm text-zinc-500 font-medium">{info.sub}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-zinc-700 group-hover:text-white transition-colors" />
                                </div>
                            </a>
                        ))}

                        <div className="p-8 rounded-4xl bg-linear-to-br from-blue-600/20 to-emerald-600/20 border border-white/5 relative overflow-hidden group mt-10">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Globe size={18} className="text-emerald-400" />
                                    <span className="text-xs font-black uppercase tracking-tighter text-emerald-400">Global Accessibility</span>
                                </div>
                                <h3 className="text-2xl font-black italic uppercase text-white leading-tight">Digital First <br /> Academics</h3>
                                <p className="text-sm text-zinc-400 font-medium">Amin Academy operates with a decentralized support link, ensuring connectivity across all regional sectors of Pakistan.</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-zinc-100/5 rounded-full blur-3xl" />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
