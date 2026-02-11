import React from 'react'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from './ui/button'
import { useAuth } from '@/context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const AuthStatus = () => {
    const { profile, loading, user: firebaseUser } = useAuth();

    const handleLogOut = async () => {
        try {
            await signOut(auth);
            // Optionally clear backend session cookie if you still use it
            fetch('/api/auth/logout', { method: "DELETE" });
            window.location.href = '/';
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const userRank = profile?.ranks;
    const userId = firebaseUser?.uid;
    const username = profile?.username || firebaseUser?.displayName || 'User';

    const dashboardPath = userRank === 'Teacher' ? '/TeacherDashboard' :
        userRank === 'Principal' ? '/PrincipalDashboard' : '/dashboard';

    if (loading) return <div className="w-10 h-10 bg-muted rounded-full" />;

    return (
        <nav>
            {!firebaseUser ? (
                <div className='flex gap-2'>
                    <Link href='/login' className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-80">
                        Sign In
                    </Link>
                    <Link href='/register' className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-bold hover:opacity-90">
                        Register
                    </Link>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-10 h-10 rounded-full bg-secondary hover:bg-accent p-0 overflow-hidden border border-border">
                                <div className='w-full h-full flex items-center justify-center bg-primary text-primary-foreground'>
                                    <p className='text-xs font-bold uppercase'>
                                        {username.charAt(0)}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            sideOffset={8}
                            className="dark bg-popover z-100 text-popover-foreground border border-border w-48 shadow-xl"
                        >
                            <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/50 mb-1">
                                {username}
                            </DropdownMenuLabel>

                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={`/profile/${userId}`} className="w-full text-zinc-300">
                                        Profile
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={dashboardPath} className="w-full text-zinc-300">
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator className="bg-border" />

                            <DropdownMenuItem
                                onClick={handleLogOut}
                                className="cursor-pointer text-red-400 focus:bg-destructive/10 focus:text-red-400"
                            >
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </nav>
    )
}

export default AuthStatus
