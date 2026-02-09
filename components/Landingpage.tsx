'use client'

import React, { useRef } from 'react';
import {
  MoveRight, Globe,
  ArrowUpRight, Zap, BrainCircuit,
  Fingerprint, Terminal, Activity, Layers
} from 'lucide-react';
import Link from 'next/link';
import Footer from './Footer';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  tag: string;
  index: number;
}

interface PricingTierProps {
  name: string;
  price: string | number;
  description: string;
  features: string[];
  isRecommended?: boolean;
  cta: string;
}

// --- UTILITIES ---
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

// --- COMPONENTS ---

/**
 * NeuralBackground: A high-performance canvas/SVG layer
 * Simulates the "Proprietary OS v2.0" logic visuals
 */
const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Radial Gradient Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-emerald-600/10 blur-[160px] rounded-full opacity-50" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-900/10 blur-[140px] rounded-full opacity-30" />

      {/* The Grid Layer */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Animated SVG Neural Paths */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <NeuralLine delay={0} customPath="M -100 200 Q 400 150 1200 400" />
        <NeuralLine delay={2} customPath="M 1400 100 Q 800 500 -200 300" />
      </svg>
    </div>
  );
};

const NeuralLine = ({ customPath, delay }: { customPath: string; delay: number }) => (
  <path
    d={customPath}
    stroke="url(#neural-gradient)"
    strokeWidth="1"
    fill="transparent"
    className="opacity-0 animate-pulse"
    style={{ animationDelay: `${delay}s`, animationDuration: '8s' }}
  />
);

/**
 * Modern Feature Bento Card
 */
const FeatureCard = ({ icon: Icon, title, description, tag, index }: FeatureCardProps) => {
  return (
    <div
      className="group relative p-8 rounded-[2.5rem] bg-zinc-900/20 border border-white/5 hover:border-emerald-500/40 transition-all duration-500 hover:-translate-y-1"
    >
      <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="p-4 rounded-2xl bg-zinc-800/50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
            <Icon size={28} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-emerald-500 transition-colors">
            {tag}
          </span>
        </div>

        <h3 className="text-2xl font-bold mb-4 text-zinc-100 group-hover:translate-x-1 transition-transform italic uppercase">
          {title}
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all cursor-pointer uppercase tracking-widest">
          Initialize Module <ArrowUpRight size={14} />
        </div>
      </div>
    </div>
  );
};

/**
 * Main Content Component
 */
export default function Hero() {
  const scrollRef = useRef(null);

  return (
    <div ref={scrollRef} className="relative min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-emerald-500/40 selection:text-black">
      <NeuralBackground />
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 md:pt-44 pb-20 md:pb-32 px-6 overflow-hidden">
        <div
          className="max-w-7xl mx-auto text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-zinc-900/50 border border-white/10 mb-6 md:mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              System v3.1.2 Production • <span className="text-emerald-500">Global Academic Sync Active</span>
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-[10rem] font-black uppercase italic leading-[0.85] tracking-tighter mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000"
          >
            Automate <br />
            <span className="text-transparent bg-clip-text bg-linear-to-b from-emerald-400 to-emerald-700">Intellect</span>
          </h1>

          <p
            className="max-w-2xl mx-auto text-zinc-500 text-base md:text-xl leading-relaxed mb-10 md:mb-12 animate-in fade-in duration-1000 delay-300 fill-mode-both px-4"
          >
            Pakistan's premier digital academic infrastructure. Over 20 years of excellence, now powered by advanced AI paper generation, real-time board-level analytics, and instant faculty synchronization.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500 fill-mode-both w-full sm:w-auto px-4"
          >
            <button className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 rounded-2xl bg-emerald-500 text-black font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 group shadow-2xl shadow-emerald-500/20 text-sm md:text-base">
              Initialize System <MoveRight className="group-hover:translate-x-2 transition-transform" />
            </button>
            <Link href="/docs" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 rounded-2xl bg-zinc-900 border border-white/10 text-white font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all text-sm md:text-base">
                <Terminal size={18} /> Documentation
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="core" className="relative py-20 md:py-32 px-4 md:px-6 bg-[#050505] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-8">
            <div className="text-left">
              <h2 className="text-4xl md:text-7xl font-black uppercase italic leading-none mb-4 md:mb-6">
                Proprietary <br />
                <span className="text-emerald-500">Capabilities</span>
              </h2>
              <p className="text-zinc-500 max-w-md uppercase text-[10px] md:text-xs font-bold tracking-widest leading-relaxed">
                Engineered for sub-millisecond data processing and high-fidelity output.
              </p>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <div className="p-4 md:p-6 rounded-3xl bg-zinc-900/50 border border-white/5 text-left min-w-[140px]">
                <div className="text-2xl md:text-3xl font-black text-emerald-500 mb-1">99.9%</div>
                <div className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Uptime Protocol</div>
              </div>
              <div className="p-4 md:p-6 rounded-3xl bg-zinc-900/50 border border-white/5 text-left min-w-[140px]">
                <div className="text-2xl md:text-3xl font-black text-emerald-500 mb-1">12ms</div>
                <div className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Neural Latency</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <FeatureCard
              index={0}
              icon={BrainCircuit}
              tag="Module-01"
              title="AI Paper Gen"
              description="Transform curriculum data into bilingual examination sheets in seconds using our v2.0 neural logic."
            />
            {/* ... other cards (same structure, grid handles layout) */}
            <FeatureCard
              index={1}
              icon={Activity}
              tag="Module-02"
              title="Quantum Analytics"
              description="Deep-trace student performance vectors with interactive visualization and automated regression reporting."
            />
            <FeatureCard
              index={2}
              icon={Layers}
              tag="Module-03"
              title="Staff Grid"
              description="Dynamic faculty management including neural attendance, automated payroll, and performance indexing."
            />
            <FeatureCard
              index={3}
              icon={Fingerprint}
              tag="Module-04"
              title="Secure Vault"
              description="Enterprise-grade 2FA and biometric encryption protocols ensuring data integrity across all nodes."
            />
            <FeatureCard
              index={4}
              icon={Globe}
              tag="Module-05"
              title="Campus Sync"
              description="Unified multi-campus management protocol allowing board-level control over fragmented locations."
            />
            <FeatureCard
              index={5}
              icon={Zap}
              tag="Module-06"
              title="Instant Core"
              description="Low-latency infrastructure optimized for high-traffic academy environments and real-time scaling."
            />
          </div>
        </div>
      </section>

      {/* ... Subsequent sections: Security, CTA ... */}
      <Footer />
    </div>
  );
}

const PricingCard = ({ name, price, description, features, isRecommended, cta }: PricingTierProps) => (
  <div
    className={cn(
      "relative p-1 rounded-[3rem] transition-all duration-500 hover:-translate-y-2",
      isRecommended ? "bg-emerald-500 shadow-2xl shadow-emerald-500/20" : "bg-zinc-800/50"
    )}
  >
    <div className="bg-[#09090b] rounded-[calc(3rem-4px)] p-10 h-full flex flex-col">
      <h4 className={cn(
        "text-[10px] font-black uppercase tracking-[0.4em] mb-4",
        isRecommended ? "text-emerald-500" : "text-zinc-500"
      )}>{name}</h4>

      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-5xl font-black italic tracking-tighter">
          {typeof price === 'number' ? `$${price}` : price}
        </span>
        {typeof price === 'number' && <span className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">/ Month</span>}
      </div>

      <ul className="space-y-6 mb-12 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Zap size={10} />
            </div>
            {f}
          </li>
        ))}
      </ul>

      <button className={cn(
        "w-full py-5 rounded-2xl font-black uppercase italic tracking-[0.2em] text-xs transition-all",
        isRecommended ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-zinc-900 text-white hover:bg-zinc-800"
      )}>
        {cta}
      </button>
    </div>
  </div>
);