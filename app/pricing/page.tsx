import Navbar from '@/components/Navbar'
import { Check } from 'lucide-react'

export default function PricingPage() {
    const plans = [
        {
            name: "Student",
            price: "15",
            description: "For individual learners seeking practice",
            features: ["Unlimited Mock Exams", "Personal Analytics", "PDF Progress Reports", "Mobile Access"]
        },
        {
            name: "Teacher",
            price: "45",
            description: "Empower your classroom with AI",
            features: ["Classroom Management", "50 AI Papers / Month", "Bulk Student Reporting", "Priority Support"],
            featured: true
        },
        {
            name: "Institutional",
            price: "199",
            description: "Full-scale academy automation",
            features: ["Unlimited AI Papers", "Principal Admin Suite", "Fee Management System", "Network Logs", "SLA Support"]
        }
    ]

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-emerald-500/40">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h1 className="text-5xl md:text-7xl font-black uppercase italic mb-6">
                            Subscription <span className="text-emerald-500">Plans</span>
                        </h1>
                        <p className="text-zinc-500 max-w-xl mx-auto">
                            Choose the tier that fits your academy's operational capacity. No hidden protocols.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((p, i) => (
                            <div key={i} className={`p-1 rounded-3xl ${p.featured ? 'bg-linear-to-b from-emerald-500 to-emerald-900 shadow-2xl shadow-emerald-500/20' : 'bg-zinc-800'}`}>
                                <div className="bg-[#09090b] rounded-[calc(1.5rem-1px)] p-10 h-full flex flex-col">
                                    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">{p.name}</h3>
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-5xl font-black italic">${p.price}</span>
                                        <span className="text-zinc-600">/month</span>
                                    </div>
                                    <p className="text-zinc-500 text-sm mb-8">{p.description}</p>

                                    <ul className="space-y-4 mb-10 flex-1">
                                        {p.features.map((f, fi) => (
                                            <li key={fi} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                    <Check size={12} className="text-emerald-500" />
                                                </div>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <button className={`w-full py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all ${p.featured ? 'bg-emerald-600 hover:bg-emerald-500 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
                                        Deploy {p.name}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
