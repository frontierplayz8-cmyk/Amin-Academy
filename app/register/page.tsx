"use client";

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Eye, EyeOff, UserPlus, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function RegisterPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleGoogleSignUp = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user already exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    username: user.displayName || user.email?.split('@')[0],
                    ranks: 'Student',
                    createdAt: new Date().toISOString()
                }, { merge: true });

                await setDoc(doc(db, 'students', user.uid), {
                    email: user.email,
                    username: user.displayName || user.email?.split('@')[0],
                    uid: user.uid,
                    attendance: 0,
                    grade: '10th',
                    feeStatus: 'Pending',
                    feeAmount: 5500,
                    recentScores: [],
                    createdAt: new Date().toISOString()
                }, { merge: true });

                toast.success('Registration Complete');
            } else {
                toast.info('Existing account detected. Synced.');
            }

            // Redirect directly to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Registration Failed');
            toast.error(err.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!username || !email || !password) {
            setError("All fields are required");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            try {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    username,
                    email,
                    ranks: 'Student',
                    createdAt: new Date().toISOString()
                });

                await setDoc(doc(db, 'students', user.uid), {
                    email,
                    username,
                    uid: user.uid,
                    attendance: 0,
                    grade: '10th',
                    feeStatus: 'Pending',
                    feeAmount: 5500,
                    recentScores: [],
                    createdAt: new Date().toISOString()
                });

                toast.success('Registration Successful');
                // Redirect directly to dashboard
                router.push('/dashboard');
            } catch (firestoreErr: any) {
                toast.error(`Account created, but database error.`);
                setError(`Account created, but database error. Try logging in.`);
            }
        } catch (err: any) {
            setError(err.message || "Registration system error.");
            toast.error(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full animate-bounce-subtle" />

            <div className="relative z-10 w-full max-w-[460px]">
                {/* Header Content */}
                <div className="text-center mb-8 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">
                        <UserPlus size={12} /> NEW ACCOUNT REGISTRATION
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                        Join the <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-blue-600">Community</span>
                    </h1>
                    <p className="text-zinc-500 font-medium tracking-tight">Make your child's future brighter</p>
                </div>

                {/* Auth Card */}
                <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Name</label>
                            <input
                                required
                                type="text"
                                name="username"
                                placeholder="Enter your name"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email Address</label>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300 pr-14 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-2"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full h-14 bg-white text-black font-black uppercase italic tracking-wider rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all duration-500 group shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95 disabled:opacity-50 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                    Register
                                    <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-[#020202] px-4 text-zinc-600">Alternative Signup</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="w-full h-14 border border-white/5 bg-white/5 p-4 rounded-2xl flex items-center justify-center gap-4 hover:bg-white/10 hover:border-white/10 transition-all duration-300 font-bold text-sm tracking-tight disabled:opacity-50 active:scale-95"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.1c-.22-.67-.35-1.39-.35-2.1s.13-1.43.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06 0.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c0.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-center text-xs font-bold text-zinc-600 mt-8 uppercase tracking-[0.2em]">
                        ALREADY HAVE AN ACCOUNT?{' '}
                        <Link href="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors">Login Here</Link>
                    </p>
                </div>
            </div>

            {/* Branding Floating Element */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-30">
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Amin Academy v2.0</span>
            </div>
        </div>
    );
}