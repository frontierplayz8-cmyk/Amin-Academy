"use client"

import { useState } from 'react'
import AICallModal from '@/components/AICallModal'
import { Phone } from 'lucide-react'

export default function TestCallPage() {
    const [isCallModalOpen, setIsCallModalOpen] = useState(false)

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="text-center space-y-8">
                <h1 className="text-4xl font-black text-white uppercase">AI Call Feature Test</h1>

                <button
                    onClick={() => setIsCallModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black uppercase flex items-center gap-3 mx-auto shadow-lg shadow-emerald-500/30"
                >
                    <Phone size={24} />
                    Test AI Call
                </button>

                <div className="text-zinc-500 text-sm space-y-2">
                    <p>✅ Click the button above to test the call feature</p>
                    <p>✅ Make sure you're using Chrome, Edge, or Safari</p>
                    <p>✅ Allow microphone access when prompted</p>
                </div>
            </div>

            <AICallModal
                isOpen={isCallModalOpen}
                onClose={() => setIsCallModalOpen(false)}
            />
        </div>
    )
}
