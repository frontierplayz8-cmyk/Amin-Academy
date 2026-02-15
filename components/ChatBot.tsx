'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, ChevronRight, Book, Shield, FileText, Compass, ExternalLink, Bot, HelpCircle, ArrowLeft, Image as ImageIcon, Users, Briefcase } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Message {
    id: string
    text: string
    sender: 'user' | 'bot'
    timestamp: Date
    actions?: { label: string; action: () => void }[]
    links?: { label: string; href: string }[]
}

const QUICK_ACTIONS = [
    { label: 'FAQs', icon: HelpCircle, type: 'faqs' },
    { label: 'Privacy', icon: Shield, type: 'policy_privacy' },
    { label: 'Navigation', icon: Compass, type: 'navigation' },
    { label: 'Features', icon: Book, type: 'features' },
]

const FAQS = [
    {
        question: "How to generate a paper?",
        answer: "Go to 'Paper Generator' or use the 'Generate Test' tab in the Principal Dashboard. Our AI will help you create structured board-style papers instantly.",
        link: "/PrincipalDashboard/generate-test"
    },
    {
        question: "How to edit papers?",
        answer: "Use 'Paper Architect' or 'Paper Editor' for granular control. You can edit sections, fix Urdu translations, and adjust the layout for professional printing.",
        link: "/paper-architect"
    },
    {
        question: "Can I edit images here?",
        answer: "Yes! Use 'Architect Studio' (under icons or separate link) to remove backgrounds, add layers, and design custom assets for your institute.",
        link: "/architect-studio"
    },
    {
        question: "Where is the student roster?",
        answer: "The Student Roster is located in the Principal Dashboard under the 'Students' tab. Here you can manage enrollments and view details.",
        link: "/PrincipalDashboard/students"
    },
    {
        question: "How to see academic records?",
        answer: "Academic records and performance tracking are available in the 'Records' tab of the Principal Dashboard.",
        link: "/PrincipalDashboard/records"
    }
]

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<'chat' | 'faqs'>('chat')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm AminBot. How can I assist you today? Ask me about generating papers, editing images, or managing students.",
            sender: 'bot',
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (view === 'chat') scrollToBottom()
    }, [messages, view])

    const addMessage = (text: string, sender: 'user' | 'bot', extra: Partial<Message> = {}) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            sender,
            timestamp: new Date(),
            ...extra
        }
        setMessages(prev => [...prev, newMessage])
    }

    const handleSend = () => {
        if (!inputValue.trim()) return
        const userQuery = inputValue.trim()
        addMessage(userQuery, 'user')
        setInputValue('')
        processBotResponse(userQuery.toLowerCase())
    }

    const processBotResponse = (query: string) => {
        setTimeout(() => {
            if (query.includes('privacy') || query.includes('data')) {
                handleAction('policy_privacy')
            } else if (query.includes('terms') || query.includes('legal')) {
                handleAction('policy_terms')
            } else if (query.includes('navigate') || query.includes('where')) {
                handleAction('navigation')
            } else if (query.includes('feature') || query.includes('what can you do')) {
                handleAction('features')
            } else if (query.includes('paper') || query.includes('generate') || query.includes('exam')) {
                addMessage("I can help with paper generation! Use the Generator for AI papers or the Architect for manual editing.", 'bot', {
                    links: [
                        { label: 'AI Paper Generator', href: '/PrincipalDashboard/generate-test' },
                        { label: 'Paper Architect (Editor)', href: '/paper-architect' }
                    ]
                })
            } else if (query.includes('image') || query.includes('background') || query.includes('edit')) {
                addMessage("Check out Architect Studio! You can remove backgrounds and design assets with Photoshop-like features.", 'bot', {
                    links: [{ label: 'Open Architect Studio', href: '/architect-studio' }]
                })
            } else if (query.includes('student') || query.includes('roster') || query.includes('manage')) {
                addMessage("You can manage your student roster in the Principal Dashboard.", 'bot', {
                    links: [{ label: 'Student Roster', href: '/PrincipalDashboard/students' }]
                })
            } else if (query.includes('record') || query.includes('academic') || query.includes('grade')) {
                addMessage("Academic records and performance metrics are available in the records section.", 'bot', {
                    links: [{ label: 'Academic Records', href: '/PrincipalDashboard/records' }]
                })
            } else if (query.includes('faq')) {
                setView('faqs')
            } else if (query.includes('hello') || query.includes('hi')) {
                addMessage("Hello! How can I help you navigate Amin Academy today?", 'bot')
            } else {
                addMessage("I'm not exactly sure about that. Try checking our FAQs or ask about specific features like 'image editing' or 'paper generation'.", 'bot')
            }
        }, 500)
    }

    const handleAction = (type: string) => {
        setIsOpen(true)
        setView('chat')
        switch (type) {
            case 'faqs':
                setView('faqs')
                break
            case 'policy_privacy':
                addMessage("Our Privacy Policy focuses on Data Security and Transparency. We encrypt all sensitive records via Firebase security rules.", 'bot', {
                    links: [{ label: 'Read Full Privacy Policy', href: '/privacy' }]
                })
                break
            case 'policy_terms':
                addMessage("Our Terms of Conduct govern enrollment and ethics. Concurrent admission with other institutes follows board regulations.", 'bot', {
                    links: [{ label: 'Read Full Terms', href: '/terms' }]
                })
                break
            case 'navigation':
                addMessage("Where would you like to go?", 'bot', {
                    links: [
                        { label: 'Home Page', href: '/' },
                        { label: 'About Us', href: '/about' },
                        { label: 'Available Lectures', href: '/lectures' },
                        { label: 'Careers', href: '/careers' },
                        { label: 'Documentation', href: '/docs' }
                    ]
                })
                break
            case 'features':
                addMessage("Amin Academy offers several AI-powered features:", 'bot', {
                    links: [
                        { label: 'AI Paper Generator', href: '/PrincipalDashboard/generate-test' },
                        { label: 'Architect Studio (Images)', href: '/architect-studio' },
                        { label: 'Skill Quizzes', href: '/quizzes' },
                        { label: 'Paper Architect', href: '/paper-architect' }
                    ]
                })
                break
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-9999 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="mb-4 w-[350px] md:w-[400px] h-[550px] bg-[#09090b]/90 backdrop-blur-2xl border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {view === 'faqs' && (
                                    <button
                                        onClick={() => setView('chat')}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                )}
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Bot className="text-amber-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm tracking-tight">
                                        {view === 'chat' ? 'AminBot' : 'Knowledge Base'}
                                    </h3>
                                    <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {view === 'chat' ? 'Always available' : 'Feature Guidance'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {view === 'chat' ? (
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.sender === 'user'
                                                ? 'bg-amber-500 text-black font-medium rounded-br-none shadow-lg shadow-amber-500/10'
                                                : 'bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-bl-none'
                                                }`}>
                                                {msg.text}
                                                {msg.links && (
                                                    <div className="mt-3 space-y-2 pt-2 border-t border-zinc-800/50">
                                                        {msg.links.map((link, idx) => (
                                                            <Link
                                                                key={idx}
                                                                href={link.href}
                                                                className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 hover:text-white transition-all text-xs group"
                                                            >
                                                                {link.label}
                                                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {FAQS.map((faq, idx) => (
                                        <div key={idx} className="space-y-2 p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/50">
                                            <h4 className="text-amber-500 text-xs font-black uppercase tracking-widest">{faq.question}</h4>
                                            <p className="text-zinc-400 text-sm leading-relaxed">{faq.answer}</p>
                                            <Link
                                                href={faq.link}
                                                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mt-1"
                                            >
                                                Go to feature <ChevronRight size={12} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions (only in chat view) */}
                        {view === 'chat' && (
                            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                                {QUICK_ACTIONS.map((action) => (
                                    <button
                                        key={action.type}
                                        onClick={() => handleAction(action.type)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-amber-500/50 text-[11px] font-medium transition-all"
                                    >
                                        <action.icon size={12} />
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area (only in chat view) */}
                        {view === 'chat' && (
                            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Type your question..."
                                        className="w-full bg-[#050505] border border-zinc-800 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all"
                                    />
                                    <button
                                        onClick={handleSend}
                                        className="absolute right-2 top-1.5 p-1.5 bg-amber-500 rounded-lg text-black hover:bg-amber-400 transition-all flex items-center justify-center"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-zinc-900 text-white border border-zinc-800' : 'bg-amber-500 text-black'
                    }`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-white border-4 border-amber-500"></span>
                    </span>
                )}
            </motion.button>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
