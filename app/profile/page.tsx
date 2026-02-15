'use client';

import React, { useState, useEffect } from 'react'
import { User, Mail, ShieldCheck, Camera, ShieldX, KeyRound, Loader2 } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useUploadThing } from '@/lib/uploadthing'
import TwoFactorModal from '@/components/TwoFactorModal'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const ProfilePage = () => {
    const [user, setUser] = useState<{ username: string; email?: string; twoFactorEnabled?: boolean; uid: string; imageUrl?: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [is2FAModalOpen, set2FAModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const fetchProfile = async () => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;

            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUser({
                    uid: firebaseUser.uid,
                    username: data.username,
                    email: data.email,
                    twoFactorEnabled: data.twoFactorEnabled,
                    imageUrl: data.imageUrl
                });
            }
        } catch (err) {
            console.error("Failed to load profile", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (u) fetchProfile();
            else setLoading(false);
        });
        return () => unsubscribe();
    }, [])

    const handleDisable2FA = async () => {
        if (!confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;

        setActionLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Two-factor authentication disabled");
                fetchProfile();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to disable 2FA");
        } finally {
            setActionLoading(false);
        }
    };

    const { startUpload } = useUploadThing("vaultUploader", {
        onClientUploadComplete: async (res) => {
            if (res && res[0]) {
                const downloadURL = res[0].url
                await updateDoc(doc(db, 'users', user!.uid), {
                    imageUrl: downloadURL,
                    updatedAt: new Date().toISOString()
                })
                setUser(prev => prev ? { ...prev, imageUrl: downloadURL } : null)
                toast.success("Profile photo updated")
            }
            setUploading(false)
        },
        onUploadError: (error) => {
            toast.error("Upload failed: " + error.message)
            setUploading(false)
        }
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        if (!file.type.startsWith('image/')) {
            toast.error("Please select a valid image file")
            return
        }

        setUploading(true)
        try {
            const token = await auth.currentUser?.getIdToken()
            await startUpload([file], { headers: { Authorization: `Bearer ${token}` } } as any)
        } catch (error) {
            toast.error("Upload initialization failed")
            setUploading(false)
        }
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#020202] text-white">
            <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading Profile...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
            <div className="max-w-4xl mx-auto space-y-12 py-10">

                {/* Header Section */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <KeyRound size={12} /> Account Management
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                        Profile <span className="text-emerald-500">Settings</span>
                    </h1>
                    <p className="text-zinc-500 font-medium tracking-tight">Manage your academic profile and security settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

                    {/* Left Column: Avatar/Status */}
                    <div className="space-y-6">
                        <div className="relative group p-8 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-xl flex flex-col items-center">
                            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                            <div className="relative">
                                <div className="w-28 h-28 rounded-full bg-linear-to-br from-emerald-500 to-amber-500 p-1">
                                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                                        {user?.imageUrl ? (
                                            <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-black italic uppercase">
                                                {user?.username?.charAt(0) || 'U'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <label className="absolute bottom-1 right-1 p-2 bg-emerald-500 rounded-xl border border-white/20 hover:scale-110 transition-all text-black shadow-lg cursor-pointer">
                                    <Camera size={16} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                                    </div>
                                )}
                            </div>

                            <div className="text-center mt-6">
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">{user?.username || 'User'}</h2>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none">Status: Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Information Forms */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Security Card */}
                        <div className="relative p-8 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-xl space-y-8">
                            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white">Security Settings</h3>
                                    <p className="text-zinc-500 text-xs font-medium">Protect your account with advanced security protocols.</p>
                                </div>
                                <ShieldCheck className="text-emerald-500/20" size={32} />
                            </div>

                            <Separator className="bg-white/5" />

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                                        <Input
                                            readOnly
                                            value={user?.email || 'user@example.com'}
                                            className="h-14 pl-12 bg-black/40 border-white/5 rounded-2xl text-zinc-300 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-2xl flex items-center justify-center ${user?.twoFactorEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {user?.twoFactorEnabled ? <ShieldCheck size={24} /> : <ShieldX size={24} />}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black uppercase italic tracking-wider">
                                                Two-Factor Authentication
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                Status: {user?.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                                            </p>
                                        </div>
                                    </div>

                                    {user?.twoFactorEnabled ? (
                                        <Button
                                            onClick={handleDisable2FA}
                                            disabled={actionLoading}
                                            className="border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl font-black uppercase italic tracking-widest text-[10px] h-10 px-6"
                                        >
                                            Disable 2FA
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => set2FAModalOpen(true)}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-emerald-500/10"
                                        >
                                            Enable 2FA
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="relative p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/20 backdrop-blur-xl">
                            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-red-500/20 to-transparent" />

                            <h3 className="text-xl font-black italic uppercase tracking-tight text-red-500 mb-6 flex items-center gap-2">
                                Danger Zone
                            </h3>

                            <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-2">
                                    <h4 className="font-black italic uppercase tracking-wide text-white">Delete Account</h4>
                                    <p className="text-[10px] text-red-400 font-medium leading-relaxed max-w-xs uppercase tracking-widest">
                                        Permanently remove your account and all associated data.
                                    </p>
                                </div>
                                <Button
                                    onClick={async () => {
                                        if (confirm("WARNING: Permanent Account Deletion\n\nThis action cannot be undone. Type 'DELETE' to confirm.")) {
                                            const promptCheck = prompt("Type 'DELETE' to continue:");
                                            if (promptCheck === 'DELETE') {
                                                try {
                                                    const res = await fetch('/api/user/terminate', { method: 'DELETE' });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        window.location.href = '/login';
                                                    } else {
                                                        toast.error(data.message);
                                                    }
                                                } catch (err) {
                                                    toast.error("An error occurred during account deletion.");
                                                }
                                            }
                                        }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest text-[10px] px-8 rounded-xl h-11"
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TwoFactorModal
                isOpen={is2FAModalOpen}
                onClose={() => set2FAModalOpen(false)}
                email={user?.email || ''}
                username={user?.username || ''}
                onSuccess={fetchProfile}
            />
        </div>
    )
}

export default ProfilePage;
