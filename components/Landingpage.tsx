'use client'

import React from 'react';
import {
  MoveRight,
  Mic2,
  Layout,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Clock,
  Award
} from 'lucide-react';
import Link from 'next/link';
import Footer from './Footer';

// --- UTILITIES ---
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

/**
 * Clean Background with very subtle emerald glows
 */
const CleanBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-emerald-500/[0.04] blur-[100px] rounded-full" />
      <div className="absolute bottom-[5%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/[0.02] blur-[100px] rounded-full" />
      <div className="absolute inset-0 bg-[#020202]" />
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => {
  return (
    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 font-bold">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default function Hero() {
  return (
    <div className="relative text-zinc-100 font-sans">
      <CleanBackground />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-16 pb-14 md:pt-28 md:pb-20 px-6 z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 mb-8">
            <GraduationCap size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
              Amin Academy • Digital Education Portal
            </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black leading-tight tracking-tight mb-8 text-white">
            Learning Made <br />
            <span className="text-emerald-500 italic">Smart & Simple</span>
          </h1>

          <p className="max-w-2xl text-zinc-400 text-lg md:text-xl leading-relaxed mb-7">
            Amin Academy brings you the best of both worlds: 20 years of teaching experience combined with modern AI technology. Get 24/7 help with your studies and prepare for your exams with ease.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/login">
              <button className="px-10 py-5 bg-emerald-600 text-white font-bold rounded-2xl flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                Student Login <MoveRight size={20} />
              </button>
            </Link>
            <Link href="/quizzes">
              <button className="px-10 py-5 bg-zinc-900 border border-white/10 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all">
                Take a Quiz
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- KEY FEATURES --- */}
      <section className="relative py-24 px-6 border-t border-white/5 bg-zinc-900/[0.05] z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Everything You Need to Succeed</h2>
            <p className="text-zinc-500 font-medium tracking-wide">Simple tools to help you study better and faster</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Mic2}
              title="24/7 AI Tutor"
              description="Have a question? Talk to our AI tutor anytime. It understands your lessons and helps you learn in simple English and Urdu."
            />
            <FeatureCard
              icon={Layout}
              title="Board Standard Tests"
              description="Practice with tests that look just like the real board exams. We make sure you are ready for the big day."
            />
            <FeatureCard
              icon={BookOpen}
              title="Electronic Library"
              description="Access a massive collection of past papers, notes, and study material from the last 20 years, all in one place."
            />
          </div>
        </div>
      </section>

      {/* --- ABOUT US / LEGACY --- */}
      <section className="py-24 px-6 relative overflow-hidden bg-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8 text-left md:pl-10">
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-white tracking-tight">
              A Trusted Name in <br />
              <span className="text-emerald-500">Education</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
              For over two decades, Amin Academy (Amin Model High School) has been providing quality education. Today, we use AI to make learning more interactive and accessible for every student.
            </p>
            <div className="flex gap-12">
              <div>
                <div className="text-4xl font-bold text-white">20+</div>
                <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">Years of Trust</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white">100%</div>
                <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">Board Result</div>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full flex justify-center">
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full opacity-30 animate-pulse" />
              <div className="relative w-full bg-white/10 h-full rounded-xl overflow-hidden border-4 border-emerald-500/10 p-2 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                <img
                  src="/academy-logo.png"
                  alt="Amin Academy Logo"
                  className="w-full h-full object-contain relative z-10 opacity-100"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- NUMBERS --- */}
      <section className="py-24 px-6 border-y border-white/5 bg-zinc-900/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">200K+</div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Study Materials</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">24/7</div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">AI Support</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">99%</div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Success Rate</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-emerald-500 mb-2 tracking-tight">FREE</div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Practice Access</p>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight">Ready to Start?</h2>
          <p className="text-zinc-400 text-lg">Join Amin Academy and give your education a digital boost today.</p>
          <div className="flex justify-center">
            <Link href="/login">
              <button className="px-16 py-6 bg-white text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all text-xl">
                Join Now
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
