'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, Key, Info } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
    username: string;
    onSuccess: () => void;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ isOpen, onClose, email, username, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [qrData, setQrData] = useState({ secret: '', otpauth: '' });
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && step === 1) {
            generateSecret();
        }
    }, [isOpen]);

    const generateSecret = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username })
            });
            const data = await res.json();
            if (data.success) {
                setQrData({ secret: data.secret, otpauth: data.otpauth });
                setStep(2);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to generate 2FA secret');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/auth/2fa/enable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code, secret: qrData.secret })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Two-factor authentication enabled!');
                onSuccess();
                onClose();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to verify code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 mx-auto">
                        <ShieldCheck size={24} />
                    </div>
                    <DialogTitle className="text-center text-2xl font-black uppercase italic tracking-tighter">
                        Secure Your Account
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400">
                        Add an extra layer of security with Google Authenticator
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center">
                    {loading && step === 1 ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Initializing Security Protocol...</p>
                        </div>
                    ) : (
                        <>
                            {step === 2 && (
                                <div className="space-y-6 w-full flex flex-col items-center">
                                    <div className="p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-in zoom-in duration-500">
                                        <QRCodeCanvas
                                            value={qrData.otpauth}
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                            imageSettings={{
                                                src: "/academy-logo.png",
                                                x: undefined,
                                                y: undefined,
                                                height: 40,
                                                width: 40,
                                                excavate: true,
                                            }}
                                        />
                                    </div>

                                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 w-full">
                                        <div className="flex items-start gap-3">
                                            <Info className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                                            <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                                Scan this QR code with your Authenticator app (Google Authenticator, Authy, etc.).
                                                If you can't scan it, use the secret key below.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Setup Key</Label>
                                        <div className="relative group">
                                            <Input
                                                readOnly
                                                value={qrData.secret}
                                                className="bg-black/40 border-white/5 rounded-xl pr-12 font-mono text-emerald-500"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(qrData.secret);
                                                    toast.success("Key copied to clipboard");
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors p-1"
                                            >
                                                <Key size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setStep(3)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic tracking-widest py-6 rounded-2xl"
                                    >
                                        Already Scanned
                                    </Button>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 w-full animate-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Verification Code</Label>
                                        <Input
                                            placeholder="000000"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            maxLength={6}
                                            className="h-16 text-center text-3xl font-black tracking-[0.5em] bg-black/40 border-white/5 rounded-2xl focus:ring-emerald-500/20"
                                        />
                                        <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-widest mt-2">Enter the 6-digit code from your app</p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={handleVerify}
                                            disabled={loading}
                                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic tracking-widest rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : "Verify & Enable"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setStep(2)}
                                            className="text-zinc-500 hover:text-white"
                                        >
                                            Back to QR Code
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TwoFactorModal;
