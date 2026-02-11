'use client'

import { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, LoaderCircle, Eye, EyeOff, Sparkles, ShieldCheck, Fingerprint, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter()
  const [loading, setloading] = useState(false)
  const [error, seterror] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1); // 1: Login, 2: 2FA
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaUser, setMfaUser] = useState<any>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setloading(true)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userDoc = await getDoc(doc(db, 'users', user.uid))

      if (!userDoc.exists()) {
        await signOut(auth)
        toast.error('Account not found. Please register first.')
        router.push('/register')
        return
      }

      const userData = userDoc.data();

      if (userData.status === 'banned') {
        toast.error('Identity Expelled: Access to this node is permanently revoked.');
        await signOut(auth);
        setloading(false);
        return;
      }

      if (userData.twoFactorEnabled) {
        setMfaSecret(userData.twoFactorSecret);
        setMfaUser(user);
        setStep(2);
        toast.info('Two-Factor Authentication Required');
        return;
      }

      const ranks = userData.ranks
      toast.success('Logged in successfully')

      if (ranks === 'Student') router.push('/dashboard')
      else if (ranks === 'Teacher') router.push('/TeacherDashboard')
      else if (ranks === 'Principal') router.push('/PrincipalDashboard')
      else router.push('/')

    } catch (err: any) {
      toast.error('Google Login Failed')
    } finally {
      setloading(false)
    }
  }

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) return toast.error('Enter 6-digit code');

    setloading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode, secret: mfaSecret })
      });
      const data = await res.json();

      if (data.success) {
        const userDoc = await getDoc(doc(db, 'users', mfaUser.uid));
        const ranks = userDoc.data()?.ranks;
        toast.success('Identity Verified');

        if (ranks === 'Student') router.push('/dashboard')
        else if (ranks === 'Teacher') router.push('/TeacherDashboard')
        else if (ranks === 'Principal') router.push('/PrincipalDashboard')
        else router.push('/')
      } else {
        toast.error('Invalid 2FA Code');
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setloading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    seterror('')
    setloading(true)

    const formdata = new FormData(e.currentTarget);
    const email = formdata.get('email') as string;
    const password = formdata.get('password') as string;

    if (!email || !password) {
      seterror('Please fill in all fields')
      setloading(false)
      return
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.status === 'banned') {
          toast.error('Identity Expelled: Access to this node is permanently revoked.');
          await auth.signOut();
          setloading(false);
          return;
        }

        if (userData.twoFactorEnabled) {
          setMfaSecret(userData.twoFactorSecret);
          setMfaUser(user);
          setStep(2);
          toast.info('Two-Factor Authentication Required');
          return;
        }

        const ranks = userData.ranks;
        toast.success('Access Granted');

        if (ranks === 'Student') router.push('/dashboard')
        else if (ranks === 'Teacher') router.push('/TeacherDashboard')
        else if (ranks === 'Principal') router.push('/PrincipalDashboard')
        else router.push('/')
      } else {
        toast.error('Profile mismatch. Please contact support.');
      }
    } catch (err: any) {
      let errorMessage = 'Invalid credentials';
      if (err.code === 'auth/user-not-found') errorMessage = 'Account does not exist.';
      else if (err.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
      else if (err.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password.';
      seterror(errorMessage);
      toast.error(errorMessage);
    } finally {
      setloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full animate-bounce-subtle" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Header Content */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck size={12} /> SECURE SYSTEMS ACCESS
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Welcome <span className="text-emerald-500 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-600">Back</span>
          </h1>
          <p className="text-zinc-500 font-medium tracking-tight">Access your academic neural link workspace.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden relative group min-h-[460px] flex flex-col">
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-left-8 duration-500">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-xl mb-6 text-center animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    name='email'
                    placeholder="Enter your email"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Password</label>
                    <a href="#" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">Recover?</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name='password'
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300 pr-14 font-medium"
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
                  type='submit'
                  className="w-full h-14 bg-white text-black font-black uppercase italic tracking-wider rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all duration-500 group shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95 disabled:opacity-50"
                >
                  {loading ? <LoaderCircle className='animate-spin' size={24} /> : (
                    <>
                      Login
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="bg-[#0b0b0b] px-4 text-zinc-600">Secondary Uplink</span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
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
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 mt-4">
                <Fingerprint size={32} />
              </div>

              <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-2">Two-Factor Auth</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-center mb-10 leading-relaxed">
                Enter the 6-digit verification code <br /> from your authenticator app.
              </p>

              <form onSubmit={handle2FAVerify} className="w-full space-y-8">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="000 000"
                      className="w-full h-20 bg-black/40 border border-white/5 rounded-2xl text-center text-4xl font-black tracking-[0.2em] text-emerald-500 placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    disabled={loading || twoFactorCode.length !== 6}
                    type='submit'
                    className="w-full h-14 bg-emerald-600 text-white font-black uppercase italic tracking-wider rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all duration-500 group shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <LoaderCircle className='animate-spin' size={24} /> : (
                      <>
                        Verify Identity
                        <ShieldCheck size={20} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors py-2"
                  >
                    <ChevronLeft size={14} /> Back to Credentials
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-bold text-zinc-600 mt-10 uppercase tracking-[0.2em]">
          Don't have an account?{' '}
          <Link href="/register" className="text-emerald-500 hover:text-emerald-400 transition-colors">Register Here</Link>
        </p>
      </div>

    </div>
  );
}