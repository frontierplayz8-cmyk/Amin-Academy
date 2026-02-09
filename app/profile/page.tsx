'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Mail, ShieldCheck, Camera } from 'lucide-react'
import { auth } from '@/lib/firebase'

const ProfilePage = () => {
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
    }, [])

    if (loading) return <div className="h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Section */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground">Manage your account details and preferences.</p>
                </div>

                <Separator className="bg-border" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Avatar/Status */}
                    <div className="space-y-6">
                        <Card className="border-border bg-card shadow-sm">
                            <CardContent className="pt-6 flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold uppercase ring-4 ring-border">
                                        {user?.username?.charAt(0) || 'U'}
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-1.5 bg-secondary rounded-full border border-border hover:bg-accent transition-colors">
                                        <Camera className="w-4 h-4 text-foreground" />
                                    </button>
                                </div>
                                <h2 className="mt-4 text-xl font-semibold">{user?.username || 'User'}</h2>
                                <p className="text-sm text-muted-foreground">Free Member</p>
                            </CardContent>
                            <CardFooter className="flex justify-center pb-6">
                                <Button variant="outline" size="sm" className="w-full">
                                    View Public Profile
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Right Column: Information Forms */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>Public Information</CardTitle>
                                <CardDescription>This information will be visible to other users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="username" placeholder={user?.username || 'username'} className="pl-10 bg-background border-input" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <textarea
                                        id="bio"
                                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Tell us a little bit about yourself..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle>Security</CardTitle>
                                <CardDescription>Update your email and security preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="user@example.com" className="pl-10 bg-background border-input" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30 border border-border">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium">Two-factor authentication is enabled.</span>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-border pt-6 flex justify-end gap-3">
                                <Button variant="ghost">Cancel</Button>
                                <Button className="bg-primary text-primary-foreground">Save Changes</Button>
                            </CardFooter>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardHeader>
                                <CardTitle className="text-red-500 flex items-center gap-2">
                                    Danger Zone
                                </CardTitle>
                                <CardDescription className="text-red-400/60">
                                    Actions here are irreversible. Please proceed with extreme caution.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h4 className="font-bold text-red-500">Terminate Account</h4>
                                        <p className="text-xs text-red-400/80 mt-1">
                                            This will permanently delete your profile, academic records, and all associated data.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            if (confirm("WARNING: Permanent Account Termination\n\nThis action cannot be undone. All your data will be purged from Amin Academy infrastructure.\n\nType 'TERMINATE' to confirm.")) {
                                                const promptCheck = prompt("Type 'TERMINATE' to continue:");
                                                if (promptCheck === 'TERMINATE') {
                                                    try {
                                                        const res = await fetch('/api/user/terminate', { method: 'DELETE' });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            window.location.href = '/login';
                                                        } else {
                                                            alert(data.message);
                                                        }
                                                    } catch (err) {
                                                        alert("Critical failure during termination protocol.");
                                                    }
                                                }
                                            }
                                        }}
                                        variant="destructive"
                                        className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2 rounded-xl h-auto"
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ProfilePage