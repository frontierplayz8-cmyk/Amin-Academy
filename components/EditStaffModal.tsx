"use client"

import { useState, useEffect } from "react"
import { X, Save, Briefcase, Banknote, Calendar, Shield } from "lucide-react"
import { toast } from "sonner"

interface EditStaffModalProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    staff: any
    onSuccess: () => void
}

export default function EditStaffModal({ isOpen, setIsOpen, staff, onSuccess }: EditStaffModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        designation: "",
        salary: "",
        joiningDate: ""
    })

    useEffect(() => {
        if (staff) {
            setFormData({
                designation: staff.designation || "",
                salary: staff.salary || "",
                joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : ""
            })
        }
    }, [staff])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const toastId = toast.loading("Updating faculty configuration...")
        setLoading(true)

        try {
            const res = await fetch('/api/admin/staff', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: staff._id,
                    ...formData,
                    salary: Number(formData.salary)
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success("Faculty configuration updated", { id: toastId })
                setIsOpen(false)
                onSuccess()
            } else {
                toast.error(data.message, { id: toastId })
            }
        } catch (error) {
            toast.error("Update failed", { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !staff) return null

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-white/5 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Header */}
                <div className="p-8 border-b border-white/5 relative bg-white/2">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Refactor <span className="text-blue-500">Profile</span></h2>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1 italic">
                                Modifying Identity: {staff.username}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-blue-500" size={16} />
                            <input
                                required
                                type="text"
                                placeholder="Designation"
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-blue-500" size={16} />
                            <input
                                required
                                type="number"
                                placeholder="Monthly Salary"
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-blue-500" size={16} />
                            <input
                                required
                                type="date"
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                value={formData.joiningDate}
                                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 bg-zinc-900 border border-white/5 text-zinc-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="flex-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={16} />
                                    Commit Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
