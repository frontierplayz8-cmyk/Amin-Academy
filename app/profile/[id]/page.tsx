'use client'

import React, { useEffect, useState, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Mail, ShieldCheck, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'
import { auth } from '@/lib/firebase'

const ProfilePage = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params)
    const [user, setUser] = useState<{ username: string; email?: string } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await auth.currentUser?.getIdToken()
                const res = await fetch('/api/auth/isLoggedin', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                const data = await res.json()
                if (res.ok) setUser(data.user)
            } catch (err) {
                console.error("Failed to load profile", err)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [id])

    const UpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formdata = new FormData(e.currentTarget);
        const username = formdata.get('username');
        const email = formdata.get('email');
        const bio = formdata.get('bio');

        try {
            const token = await auth.currentUser?.getIdToken()
            const res = await fetch('/api/auth/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, username, email, bio })
            });

            if (res.ok) {
                toast.success("Profile updated successfully!");
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
    )

    return (
        <><Navbar />
            <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
                <div className="max-w-4xl mt-20 mx-auto space-y-8">

                    {/* Header Section */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                        <p className="text-muted-foreground">Viewing profile of: <span className="text-foreground font-mono text-sm">{user?.username}</span></p>
                    </div>

                    <Separator className="bg-border" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Left Column: Avatar/Status */}
                        <div className="space-y-6">
                            <Card className="border-border bg-card shadow-xl">
                                <CardContent className="pt-6 flex flex-col items-center">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-foreground text-3xl font-bold uppercase ring-4 ring-background">
                                            {user?.username?.charAt(0) || 'U'}
                                        </div>
                                        <button className="absolute bottom-0 right-0 p-1.5 bg-primary hover:bg-primary/90 rounded-full border-2 border-card transition-colors">
                                            <Camera className="w-4 h-4 text-primary-foreground" />
                                        </button>
                                    </div>
                                    <h2 className="mt-4 text-xl font-semibold">{user?.username || 'User'}</h2>
                                    <p className="text-sm text-muted-foreground font-medium">Verified Member</p>
                                </CardContent>
                                <CardFooter className="flex justify-center pb-6">
                                    <Button variant="outline" size="sm" className="w-full">
                                        View Public Profile
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Right Column: Information Forms */}
                        <form onSubmit={UpdateProfile} className="md:col-span-2 space-y-6">
                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle>Public Information</CardTitle>
                                    <CardDescription>How you appear to others on the platform.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider">Username</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="username"
                                                name='username'
                                                placeholder={user?.username || 'username'}
                                                className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider">Bio</Label>
                                        <textarea
                                            id="bio"
                                            name='bio'
                                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                            placeholder="Tell us a little bit about yourself..." />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle>Security</CardTitle>
                                    <CardDescription>Email and authentication preferences.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                name='email'
                                                type="email"
                                                placeholder="user@example.com"
                                                className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">2FA Enabled</span>
                                            <span className="text-xs text-muted-foreground">Your account is extra secure.</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t border-border pt-6 flex justify-end gap-3">
                                    <Button variant="ghost">Cancel</Button>
                                    <Button type="submit">
                                        Save Changes
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>

                    </div>
                </div>
            </div>
        </>
    )
}

export default ProfilePage