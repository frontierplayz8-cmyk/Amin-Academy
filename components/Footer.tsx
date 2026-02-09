'use client';
import React from 'react';
import { BrainCircuit, Github, Twitter, Linkedin, Mail, Phone, MapPin, ExternalLink, Zap, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const socialIcons = [
        {
            icon: MessageCircle,
            href: 'https://whatsapp.com/channel/0029VbAo90dJkK7GHlnjbA0a',
            label: 'WhatsApp'
        }
    ]

    const footerLinks = [
        {
            title: "Navigation",
            links: [
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Skill Quizzes", href: "/quizzes" },
                { name: "Available Lectures", href: "/lectures" },
            ]
        },
        {
            title: "System",
            links: [
                { name: "Principal Portal", href: "/PrincipalDashboard" },
                { name: "Teacher Portal", href: "/TeacherDashboard" },
                { name: "API Reference", href: "/api" },
            ]
        },
        {
            title: "Connectivity",
            links: [
                { name: "Contact Us", href: "/contact" },
                { name: "Security Info", href: "/security" },
                { name: "Terms of Services", href: "/terms" },
                { name: "Privacy Policy", href: "/privacy" },
            ]
        }
    ];

    return (
        <footer className="relative bg-[#050505] border-t border-white/5 pt-24 pb-12 px-8 overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">

                    {/* Brand Identity */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6 group cursor-pointer w-fit">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <Image src={'/academy-logo.png'} alt='logo' width={40} height={40} />
                            </div>
                            <span className="font-black italic text-2xl tracking-tighter text-white">
                                Amin<span className="text-emerald-500 not-italic">ACADEMY</span>
                            </span>
                        </div>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mb-8 italic">
                            Architecting the future of Pakistani educational standards through advanced academic infrastructure and automated examination logic.
                        </p>
                        <div className="flex gap-4">
                            {socialIcons.map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
                                >
                                    <item.icon size={20} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Link Groups */}
                    {footerLinks.map((group, idx) => (
                        <div key={idx}>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-8 px-1 border-l-2 border-emerald-500/50">{group.title}</h4>
                            <ul className="space-y-4">
                                {group.links.map((link, i) => (
                                    <li key={i}>
                                        <Link href={link.href} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2 group w-fit">
                                            <span className="w-0 group-hover:w-1.5 h-[1.5px] bg-emerald-500 transition-all duration-300" />
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        <span>© {currentYear} Amin Academy</span>
                        <span className="hidden md:block">•</span>
                        <span>OS v3.1.2 Production</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/30 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Academic Pulse: <span className="text-emerald-500 ml-1">Live & Synchronized</span>
                    </div>

                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors"
                    >
                        Terminal Return <Zap size={12} className="text-emerald-500" />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
