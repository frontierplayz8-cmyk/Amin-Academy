'use client'

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export const useAuthenticatedFetch = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    const authFetch = async (url: string, options: RequestInit = {}) => {
        // Wait for auth to initialize or fail if definitely not logged in
        if (loading) {
            // Options: return a promise that waits, or just throw. 
            // Better to throw a specific error that the component can catch if it wants, 
            // or just let the loading guard in the component handle it.
            throw new Error('Auth state still loading');
        }

        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const token = await user.getIdToken();

            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Auth fetch error:', error);
            throw error;
        }
    };

    return { authFetch, user, loading };
};
