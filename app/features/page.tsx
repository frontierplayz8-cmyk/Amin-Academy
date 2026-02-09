import { Cpu, BarChart3, Users, Shield, Zap, Globe } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function FeaturesPage() {
    const features = [
        {
            icon: <Cpu className="text-emerald-500" size={32} />,
            title: "AI Examination Hub",
            description: "Proprietary OS v2.0 logic generates bilingual papers for Classes 1-11 in under 60 seconds."
        },
        {
            icon: <BarChart3 className="text-emerald-500" size={32} />,
            title: "Academic Analytics",
            description: "Deep-learning insights into student progression with automated PDF report generation."
        },
        {
            icon: <Users className="text-emerald-500" size={32} />,
            title: "Faculty Control",
            description: "Comprehensive staff management including hiring, payroll, and 2FA-secured profiles."
        },
        {
            icon: <Shield className="text-emerald-500" size={32} />,
            title: "Military-Grade Security",
            description: "TOTP-based Two-Factor Authentication ensuring all academy data remains compartmentalized."
        },
        {
            icon: <Zap className="text-emerald-500" size={32} />,
            title: "Instant Deployment",
            description: "No complex setup. Register your academy and start generating papers immediately."
        },
        {
            icon: <Globe className="text-emerald-500" size={32} />,
            title: "Bilingual Standard",
            description: "Full support for English and Urdu scripts, formatted to meet board examination standards."
        }
    ]

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-emerald-500/40">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h1 className="text-5xl md:text-7xl font-black uppercase italic mb-6">
                            Advanced <span className="text-emerald-500">Infrastructure</span>
                        </h1>
                        <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
                            Amin Academy is powered by a proprietary academic engine designed to automate the administrative overhead of modern educational institutions.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="p-10 rounded-3xl bg-zinc-900/20 border border-white/5 hover:border-emerald-500/30 transition-all group">
                                <div className="mb-6 group-hover:scale-110 transition-transform inline-block">
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-black uppercase italic mb-4">{f.title}</h3>
                                <p className="text-zinc-500 leading-relaxed">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
