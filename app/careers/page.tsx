'use client'

import React, { useState } from 'react';
import {
    MoveRight,
    CheckCircle2,
    MapPin,
    Clock,
    Briefcase,
    GraduationCap,
    Mail,
    Phone,
    User,
    BookOpen,
    Linkedin,
    Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitTeacherApplicationAction } from '@/app/actions/career-actions';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Info } from 'lucide-react';

const CareersPage = () => {
    const { user: authUser, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        if (authUser) {
            formData.append('applicantId', authUser.uid);
        }

        try {
            const result = await submitTeacherApplicationAction(formData);

            if (result.success) {
                toast.success("Application submitted successfully!");
                setIsSubmitted(true);
            } else {
                toast.error(result.error || "Failed to submit application.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#020202] text-zinc-100 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 size={64} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Application Received</h1>
                    <p className="text-zinc-500 leading-relaxed">
                        Thank you for your interest in joining Amin Academy. Our recruitment team will review your application and get back to you soon.
                    </p>
                    <Button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase py-6 rounded-xl"
                    >
                        Return to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-white/10 mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            Careers • <span className="text-emerald-500">Join our vision</span>
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none tracking-tighter">
                        Build the <br />
                        <span className="text-emerald-500">Future of Education</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-zinc-500 text-lg">
                        We're looking for passionate educators and innovators to join our high-frequency neural academic infrastructure.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Left Column: Info & Perks */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-emerald-500">Open Position</h2>
                            <Card className="bg-zinc-900/20 border-white/5 hover:border-emerald-500/40 transition-all duration-300">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                        <BookOpen className="text-emerald-500" size={20} />
                                        Senior Faculty Member (Multiple Subjects)
                                    </CardTitle>
                                    <CardDescription className="text-zinc-500 flex flex-wrap gap-4 mt-2">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> Remote / On-site</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> Full-time</span>
                                        <span className="flex items-center gap-1"><Briefcase size={14} /> Senior Level</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-zinc-400 text-sm leading-relaxed space-y-4">
                                    <p>
                                        Responsibilities include delivering high-quality lectures, designing curriculum, and utilizing our AI-powered tools for exam generation and student analytics.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-zinc-300">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            5+ Years of teaching experience
                                        </li>
                                        <li className="flex items-center gap-2 text-zinc-300">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            Master's Degree in relevant field
                                        </li>
                                        <li className="flex items-center gap-2 text-zinc-300">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            Familiarity with digital learning platforms
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 w-fit mb-4">
                                    <GraduationCap size={24} />
                                </div>
                                <h4 className="font-bold text-white mb-2 uppercase italic">Growth Protocol</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed uppercase tracking-widest">Continuous learning and professional development programs.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 w-fit mb-4">
                                    <Briefcase size={24} />
                                </div>
                                <h4 className="font-bold text-white mb-2 uppercase italic">Neural Stack</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed uppercase tracking-widest">Access to proprietary AI tools for efficient teaching.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Application Form */}
                    <Card className="bg-zinc-900/40 border-white/10 shadow-2xl backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Apply Today</CardTitle>
                            <CardDescription className="text-zinc-500 uppercase text-[10px] font-bold tracking-[0.2em]">Application Form Module v1.0</CardDescription>
                            {!authUser && !authLoading && (
                                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                    <Info className="text-amber-500 shrink-0 mt-0.5" size={14} />
                                    <p className="text-[9px] text-amber-200/70 font-bold uppercase tracking-widest leading-relaxed">
                                        Note: You are applying as a guest. To track your application status in your dashboard, please <a href="/login" className="text-amber-500 underline">login</a> before submitting.
                                    </p>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <User size={14} className="text-emerald-500" /> Full Name
                                        </Label>
                                        <Input id="fullName" name="fullName" placeholder="John Doe" required className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all py-6 rounded-xl text-white placeholder:text-zinc-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Mail size={14} className="text-emerald-500" /> Email Address
                                        </Label>
                                        <Input id="email" name="email" type="email" placeholder="john@example.com" required className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all py-6 rounded-xl text-white placeholder:text-zinc-600" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Phone size={14} className="text-emerald-500" /> Phone Number
                                        </Label>
                                        <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all py-6 rounded-xl text-white placeholder:text-zinc-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <BookOpen size={14} className="text-emerald-500" /> Subject Expertise
                                        </Label>
                                        <Input id="subject" name="subject" placeholder="e.g. Mathematics, Physics" required className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all py-6 rounded-xl text-white placeholder:text-zinc-600" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="qualifications" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <GraduationCap size={14} className="text-emerald-500" /> Qualifications
                                    </Label>
                                    <Input id="qualifications" name="qualifications" placeholder="e.g. M.Sc in Physics, B.Ed" className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all py-6 rounded-xl text-white placeholder:text-zinc-600" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase size={14} className="text-emerald-500" /> Years of Experience
                                    </Label>
                                    <Input id="experience" name="experience" placeholder="e.g. 5 Years" className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all py-6 rounded-xl text-white placeholder:text-zinc-600" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedinProfile" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Linkedin size={14} className="text-emerald-500" /> LinkedIn Profile (Optional)
                                    </Label>
                                    <Input id="linkedinProfile" name="linkedinProfile" placeholder="https://linkedin.com/in/..." className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all py-6 rounded-xl text-white placeholder:text-zinc-600" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        Cover Letter Snippet / Message
                                    </Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="Tell us why you're a great fit..."
                                        rows={4}
                                        className="bg-zinc-800/50 border-white/10 focus:border-emerald-500/50 transition-all rounded-xl text-white placeholder:text-zinc-600 resize-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic tracking-widest py-8 rounded-2xl group transition-all"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            Processing Neural Request...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Transmit Application <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CareersPage;
