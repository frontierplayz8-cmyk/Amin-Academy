"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, MoveLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background Aesthetic Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />

            <div className="relative z-10 max-w-2xl w-full text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
                        <Sparkles size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Error 404</span>
                    </div>

                    <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-white mb-4">
                        LOST IN <span className="text-emerald-500">SPACE</span>
                    </h1>

                    <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-md mx-auto mb-12">
                        The page you're looking for has been moved or doesn't exist in this dimension.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link href="/">
                            <Button className="h-14 px-8 bg-white text-black hover:bg-emerald-500 hover:text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] group">
                                <Home size={16} className="mr-2 group-hover:-translate-y-0.5 transition-transform" />
                                Return Home
                            </Button>
                        </Link>

                        <Button
                            variant="ghost"
                            onClick={() => window.history.back()}
                            className="h-14 px-8 text-zinc-400 hover:text-white hover:bg-white/5 font-black uppercase text-xs tracking-widest rounded-2xl transition-all group"
                        >
                            <MoveLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            Go Back
                        </Button>
                    </div>
                </motion.div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, #fff 1px, transparent 0), linear-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Floating Decorative Elements */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 right-[15%] w-20 h-20 border border-white/10 rounded-3xl rotate-12 backdrop-blur-sm bg-white/5"
            />
            <motion.div
                animate={{
                    y: [0, 20, 0],
                    rotate: [0, -10, 0]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-40 left-[10%] w-32 h-32 border border-white/5 rounded-[40px] -rotate-12 backdrop-blur-sm bg-white/5"
            />
        </div>
    )
}
