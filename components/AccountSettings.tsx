"use client"

import React, { useState, useEffect } from 'react'
import {
    User,
    Mail,
    Shield,
    Lock,
    Fingerprint,
    Save,
    Loader2,
    CheckCircle2,
    Info,
    Smartphone,
    QrCode,
    X,
} from 'lucide-react'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from './ui/textarea'

export default function AccountSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)

    // 2FA Setup State
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
    const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null)
    const [verificationCode, setVerificationCode] = useState('')
    const [verifying, setVerifying] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        bio: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorCode: ''
    })

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await res.json()
            if (data.success) {
                setUser(data.user)
                setFormData(prev => ({
                    ...prev,
                    username: data.user.username || '',
                    email: data.user.email || '',
                    bio: data.user.bio || ''
                }))
            }
        } catch (error) {
            toast.error("Failed to fetch profile coordinates")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const initiateTwoFactorSetup = async () => {
        try {
            setVerifying(true)
            const res = await fetch('/api/user/2fa/generate')
            const data = await res.json()
            if (data.success) {
                setTwoFactorSetup(data)
                setShowTwoFactorModal(true)
            }
        } catch (error) {
            toast.error("Failed to generate 2FA key")
        } finally {
            setVerifying(false)
        }
    }

    const verifyAndEnableTwoFactor = async () => {
        if (!verificationCode) return
        setVerifying(true)
        try {
            const res = await fetch('/api/user/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: twoFactorSetup.secret,
                    code: verificationCode,
                    action: 'enable'
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("2FA Security Protocol Active")
                setShowTwoFactorModal(false)
                setVerificationCode('')
                fetchProfile()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("verification failed")
        } finally {
            setVerifying(false)
        }
    }

    const disableTwoFactor = async () => {
        if (!formData.twoFactorCode) {
            toast.error("Please provide verification code to disable 2FA")
            return
        }
        setVerifying(true)
        try {
            const res = await fetch('/api/user/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: formData.twoFactorCode,
                    action: 'disable'
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("2FA Deactivated")
                fetchProfile()
                setFormData(prev => ({ ...prev, twoFactorCode: '' }))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Failed to disable 2FA")
        } finally {
            setVerifying(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Security checks
        if (!user.twoFactorEnabled && !formData.currentPassword) {
            toast.error("Authorization required: Enter current password")
            return
        }

        if (user.twoFactorEnabled && !formData.twoFactorCode) {
            toast.error("Identity verification required: Enter 2FA code")
            return
        }

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error("Protocol mismatch: Passwords do not match")
            return
        }

        setSaving(true)
        const toastId = toast.loading("Updating security layers...")

        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    bio: formData.bio,
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    twoFactorCode: formData.twoFactorCode
                })
            })

            const data = await res.json()

            if (data.success) {
                toast.success("Profile reconfigured successfully", { id: toastId })
                setUser(data.user)
                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                    twoFactorCode: ''
                }))
            } else {
                toast.error(data.message || "Update failed", { id: toastId })
            }
        } catch (error) {
            toast.error("Matrix error during update", { id: toastId })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Syncing Profile Stats...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
                <Shield size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Profile Authorization Failed</p>
                <Button onClick={fetchProfile} variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-500 text-xs">Retry Connection</Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <form onSubmit={handleUpdateProfile} className="space-y-8">

                {/* 1. IDENTITY BLOCK */}
                <div className="bg-zinc-900/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md">
                    <div className="p-8 border-b border-white/5 bg-white/2">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <User className="text-emerald-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Identity Access</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Core Personnel Metadata</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Node Identifier (Username)</Label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                    <Input
                                        value={formData.username}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
                                        className="bg-zinc-900/50 border-white/5 pl-10 focus-visible:ring-emerald-500/30 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Contact Protocol (Email)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-zinc-900/50 border-white/5 pl-10 focus-visible:ring-emerald-500/30"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Professional Narrative (Bio)</Label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                className="bg-zinc-900/50 border-white/5 min-h-[100px] focus-visible:ring-emerald-500/30 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pin-p-4 bg-zinc-900/30 rounded-2xl border border-white/5 p-4">
                            <MetaStat label="Rank" value={user?.ranks} accent="text-emerald-500" />
                            <MetaStat label="Designation" value={user?.designation || 'Faculty'} />
                            <MetaStat label="Joined" value={user?.joiningDate || 'Standard'} />
                        </div>
                    </div>
                </div>

                {/* 2. SECURITY BLOCK */}
                <div className="bg-zinc-900/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md">
                    <div className="p-8 border-b border-white/5 bg-white/2">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Shield className="text-red-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Security Clearing</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Encryption & Key Management</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* 2FA SETUP SECTION */}
                        <div className="p-6 bg-white/2 border border-white/5 rounded-3xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${user.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Two-Factor Authentication</p>
                                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                                            {user.twoFactorEnabled ? 'Protocol Active' : 'Protocol Inactive'}
                                        </p>
                                    </div>
                                </div>

                                {user.twoFactorEnabled ? (
                                    <Button
                                        type="button"
                                        onClick={disableTwoFactor}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase py-0 px-4 h-9 rounded-xl border border-red-500/20"
                                    >
                                        Disable 2FA
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={initiateTwoFactorSetup}
                                        className="bg-emerald-500 text-black text-[10px] font-black uppercase py-0 px-4 h-9 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                    >
                                        Setup 2FA
                                    </Button>
                                )}
                            </div>

                            {user.twoFactorEnabled && (
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    <p className="text-[9px] font-bold text-emerald-500/80 leading-relaxed uppercase tracking-wide">
                                        Your account is protected by an extra layer of security. Use your Authenticator app for authorization.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3">
                                <Info size={16} className="text-amber-500 shrink-0" />
                                <p className="text-[9px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-wide">
                                    {user.twoFactorEnabled
                                        ? "USE YOUR MOBILE AUTHENTICATOR CODE FOR AUTHORIZATION."
                                        : "AUTHORIZATION REQUIRES CURRENT LOGIN CREDENTIALS."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                        {user.twoFactorEnabled ? "authenticator sync code" : "Current Authorization Key"}
                                    </Label>
                                    <div className="relative">
                                        {user.twoFactorEnabled ? (
                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                                        ) : (
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                        )}
                                        <Input
                                            type={user.twoFactorEnabled ? "text" : "password"}
                                            placeholder={user.twoFactorEnabled ? "ENTER 6-DIGIT CODE" : "REQUIRED FOR ANY CHANGES"}
                                            value={user.twoFactorEnabled ? formData.twoFactorCode : formData.currentPassword}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [user.twoFactorEnabled ? 'twoFactorCode' : 'currentPassword']: e.target.value })}
                                            className={`bg-zinc-900/50 border-white/5 pl-10 focus-visible:ring-emerald-500/30 ${user.twoFactorEnabled ? 'text-emerald-500 font-mono tracking-[0.5em] text-center' : ''}`}
                                            maxLength={user.twoFactorEnabled ? 6 : undefined}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">New Private Key</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                            <Input
                                                type="password"
                                                value={formData.newPassword}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, newPassword: e.target.value })}
                                                className="bg-zinc-900/50 border-white/5 pl-10 focus-visible:ring-emerald-500/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Confirm Private Key</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                            <Input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="bg-zinc-900/50 border-white/5 pl-10 focus-visible:ring-emerald-500/30"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-black px-10 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                Committing Changes
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={18} />
                                Update Matrix
                            </>
                        )}
                    </Button>
                </div>

            </form>

            {/* --- DANGER ZONE --- */}
            <div className="mt-12 group">
                <div className="bg-red-500/5 border border-red-500/20 rounded-[32px] overflow-hidden backdrop-blur-md">
                    <div className="p-8 border-b border-red-500/10 bg-red-500/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Shield className="text-red-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase italic tracking-tighter text-red-500">Critical Access: Danger Zone</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-500/40">Irreversible Infrastructure protocols</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-black/40 border border-red-500/10">
                            <div className="flex-1">
                                <h4 className="text-md font-black text-white uppercase italic tracking-tight mb-1">Permanent Node Termination</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                                    Executing this protocol will permanently purge your identity node, academic logs, and authorization keys. This action cannot be undone.
                                </p>
                            </div>
                            <Button
                                onClick={async () => {
                                    if (confirm("CRITICAL WARNING: Permanent Account Termination\n\nThis action will purge all your data from Amin Academy. There is no recovery path.\n\nType 'TERMINATE' to confirm execution.")) {
                                        const promptCheck = prompt("Final Confirmation Checklist: Type 'TERMINATE' to purge account:");
                                        if (promptCheck === 'TERMINATE') {
                                            try {
                                                const res = await fetch('/api/user/terminate', { method: 'DELETE' });
                                                const data = await res.json();
                                                if (data.success) {
                                                    window.location.href = '/login';
                                                } else {
                                                    toast.error(data.message);
                                                }
                                            } catch (err) {
                                                toast.error("Critical failure during termination sequence.");
                                            }
                                        }
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-500 text-white px-8 py-5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all h-auto"
                            >
                                Terminate Account
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2FA SETUP MODAL */}
            {showTwoFactorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                    <div className="bg-[#0a0a0a] border border-white/5 w-full max-w-md rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <QrCode className="text-emerald-500" size={24} />
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Setup 2FA</h3>
                            </div>
                            <button onClick={() => setShowTwoFactorModal(false)} className="text-zinc-600 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 text-center">
                            <div className="space-y-2">
                                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">1. scan qr code</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-medium">Use Google Authenticator or Microsoft Authenticator</p>
                            </div>

                            <div className="inline-block p-4 bg-white rounded-3xl m-auto shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                <img src={twoFactorSetup?.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">2. verify sync</p>
                                    <Input
                                        placeholder="ENTER 6-DIGIT CODE"
                                        value={verificationCode}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
                                        className="bg-zinc-900 border-white/10 h-14 text-center text-xl font-mono tracking-[0.5em] text-emerald-500 rounded-2xl focus-visible:ring-emerald-500/30"
                                        maxLength={6}
                                    />
                                </div>

                                <Button
                                    onClick={verifyAndEnableTwoFactor}
                                    disabled={verificationCode.length !== 6 || verifying}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase h-14 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                                >
                                    {verifying ? <Loader2 className="animate-spin" size={20} /> : "Verify & Activate Protocol"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MetaStat({ label, value, accent = "text-zinc-300" }: { label: string, value: string | undefined, accent?: string }) {
    return (
        <div className="flex flex-col gap-1 px-4 py-2 border-l border-white/5 first:border-0">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{label}</span>
            <span className={`text-[10px] font-bold uppercase truncate ${accent}`}>{value || 'N/A'}</span>
        </div>
    )
}
