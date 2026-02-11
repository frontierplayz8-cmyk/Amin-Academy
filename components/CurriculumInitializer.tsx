"use client"

import { useEffect } from "react"
import { useAuthenticatedFetch } from "@/lib/useAuthenticatedFetch"
import { setDynamicCurriculum } from "@/app/lib/curriculum-data"
import { useAuth } from "@/context/AuthContext"

export function CurriculumInitializer() {
    const { authFetch } = useAuthenticatedFetch()
    const { user } = useAuth()

    useEffect(() => {
        const fetchCurriculum = async () => {
            try {
                const res = await authFetch("/api/admin/curriculum")
                if (res.ok) {
                    const data = await res.json()
                    setDynamicCurriculum(data)
                }
            } catch (error) {
                console.error("Failed to initialize curriculum data:", error)
            }
        }

        if (user) {
            fetchCurriculum()
        }
    }, [user])

    return null
}
