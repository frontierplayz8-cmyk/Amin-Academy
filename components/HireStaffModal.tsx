"use client"

import { useState } from "react"
import { X, UserPlus, Shield, Mail, Lock, Briefcase, Banknote, Calendar } from "lucide-react"
import { toast } from "sonner"

interface HireStaffModalProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    onSuccess: () => void
}

export default function HireStaffModal({ isOpen, setIsOpen, onSuccess }: HireStaffModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        designation: "General Faculty",
        salary: "",
        joiningDate: new Date().toISOString().split('T')[0]
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const toastId = toast.loading("Deploying faculty node to infrastructure...")
        setLoading(true)

        try {
            const res = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    salary: Number(formData.salary)
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success("Faculty member deployed successfully", { id: toastId })
                setIsOpen(false)
                setFormData({
                    username: "",
                    email: "",
                    password: "",
                    designation: "General Faculty",
                    salary: "",
                    joiningDate: new Date().toISOString().split('T')[0]
                })
                onSuccess()
            } else {
                toast.error(data.message, { id: toastId })
            }
        } catch (error) {
            toast.error("Deployment failed", { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-white/5 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Header */}
                <div className="p-8 border-b border-white/5 relative bg-white/2">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Hire <span className="text-emerald-500">New Faculty</span></h2>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                <Shield size={12} className="text-emerald-500" />
                                Personnel Deployment Protocol
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Identity Profile</label>

                            <div className="relative group">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-500" size={16} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Username"
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-500" size={16} />
                                <input
                                    required
                                    type="email"
                                    placeholder="Official Email"
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-500" size={16} />
                                <input
                                    required
                                    type="password"
                                    placeholder="Access Password"
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Professional Info */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Professional Assignment</label>

                            <div className="relative group">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-500" size={16} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Designation (e.g. Senior Prof)"
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                />
                            </div>

                            <div className="relative group">
                                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-500" size={16} />
                                <input
                                    required
                                    type="number"
                                    placeholder="Base Salary (PKR)"
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>

                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-emerald-500" size={16} />
                                <input
                                    required
                                    type="date"
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                    value={formData.joiningDate}
                                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 bg-zinc-900 border border-white/5 text-zinc-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
                        >
                            Abort Deployment
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="flex-2 bg-emerald-600 hover:bg-emerald-500 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    Confirm Deployment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
