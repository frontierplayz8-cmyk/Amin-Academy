"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    UserPlus,
    DollarSign,
    Briefcase,
    Calendar} from "lucide-react"

interface TeacherPromotionModalProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    onPromote: (details: { salary: number; designation: string; joiningDate: string }) => void
    userName: string
}

export default function TeacherPromotionModal({ isOpen, setIsOpen, onPromote, userName }: TeacherPromotionModalProps) {
    const [salary, setSalary] = useState<string>("45000")
    const [designation, setDesignation] = useState<string>("Subject Specialist")
    const [joiningDate, setJoiningDate] = useState<string>(new Date().toISOString().split('T')[0])

    const handleConfirm = () => {
        onPromote({
            salary: parseInt(salary),
            designation,
            joiningDate
        })
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[450px] bg-[#0a0a0a] border border-white/5 text-zinc-100 shadow-2xl rounded-[32px] overflow-hidden p-0">
                {/* Progress Bar Top */}
                <div className="h-1.5 w-full bg-zinc-900">
                    <div className="bg-emerald-500 h-full w-full" />
                </div>

                <DialogHeader className="p-8 pb-0">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <UserPlus size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Promotion Protocol</span>
                    </div>
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                        Teacher <span className="text-emerald-500">Details</span>
                    </DialogTitle>
                    <p className="text-zinc-500 text-xs mt-2 font-medium">Configuring academic record for <span className="text-zinc-200 font-bold">{userName}</span></p>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    {/* Salary Field */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#555] flex items-center gap-2">
                            <DollarSign size={12} className="text-emerald-500" />
                            Monthly Salary (PKR)
                        </Label>
                        <Input
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            className="bg-zinc-900 border-white/5 py-6 px-4 text-white font-bold placeholder:text-zinc-700 focus:border-emerald-500/50 rounded-xl"
                            placeholder="e.g. 50000"
                        />
                    </div>

                    {/* Designation Field */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#555] flex items-center gap-2">
                            <Briefcase size={12} className="text-emerald-500" />
                            Designation
                        </Label>
                        <Input
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            className="bg-zinc-900 border-white/5 py-6 px-4 text-white font-bold placeholder:text-zinc-700 focus:border-emerald-500/50 rounded-xl"
                            placeholder="e.g. Mathematics Teacher"
                        />
                    </div>

                    {/* Joining Date Field */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#555] flex items-center gap-2">
                            <Calendar size={12} className="text-emerald-500" />
                            Joining Date
                        </Label>
                        <Input
                            type="date"
                            value={joiningDate}
                            onChange={(e) => setJoiningDate(e.target.value)}
                            className="bg-zinc-900 border-white/5 py-6 px-4 text-white font-bold focus:border-emerald-500/50 rounded-xl"
                        />
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 bg-zinc-900 text-zinc-400 border border-white/5 hover:bg-zinc-800 hover:text-white py-6 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    >
                        Finalize Promotion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
