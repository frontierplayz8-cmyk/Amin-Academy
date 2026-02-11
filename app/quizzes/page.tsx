"use client"

import React, { useState, useEffect, useRef } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { BrainCircuit, CheckCircle2, ChevronRight, XCircle, Trophy, Loader2, Play, RefreshCw, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getSubjectsForGrade, getChaptersForSubject, setDynamicCurriculum } from '@/app/lib/curriculum-data'

function MathContent({ content, className }: { content: string, className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            let processed = content
                .replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
                    try { return katex.renderToString(formula, { displayMode: true, throwOnError: false }); }
                    catch { return match; }
                })
                .replace(/\$(.*?)\$/g, (match, formula) => {
                    try { return katex.renderToString(formula, { displayMode: false, throwOnError: false }); }
                    catch { return match; }
                });

            if (processed === content && (content.includes('^') || content.includes('_') || content.includes('='))) {
                if (content.length < 50 && !content.includes(' ')) {
                    try { processed = katex.renderToString(content, { throwOnError: false }); } catch { }
                }
            }
            containerRef.current.innerHTML = processed;
        }
    }, [content]);
    return <div ref={containerRef} className={className} />;
}

export default function QuizPage() {
    const [step, setStep] = useState<'setup' | 'loading' | 'quiz' | 'result'>('setup')

    // Setup State
    const [grade, setGrade] = useState('10th Grade')
    const [subject, setSubject] = useState('')
    const [chapter, setChapter] = useState('')
    const [topic, setTopic] = useState('')
    const [difficulty, setDifficulty] = useState('Easy')

    // Quiz State
    const [quizData, setQuizData] = useState<any>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [answers, setAnswers] = useState<{ question: string, user: string, correct: string, isCorrect: boolean }[]>([])
    const [score, setScore] = useState(0)

    useEffect(() => {
        const fetchCurriculum = async () => {
            try {
                const res = await fetch("/api/admin/curriculum")
                if (res.ok) {
                    const data = await res.json()
                    setDynamicCurriculum(data)
                }
            } catch (error) {
                console.error("Failed to load dynamic curriculum:", error)
            }
        }
        fetchCurriculum()
    }, [])

    // Data Helpers
    const subjects = React.useMemo(() => getSubjectsForGrade(grade), [grade])
    const chapters = React.useMemo(() => getChaptersForSubject(grade, subject), [grade, subject])

    // Auto-select defaults
    React.useEffect(() => { if (subjects.length > 0 && !subjects.includes(subject)) setSubject(subjects[0]) }, [subjects])
    React.useEffect(() => { if (chapters.length > 0 && !chapters.includes(chapter)) setChapter(chapters[0]) }, [chapters])

    const startQuiz = async () => {
        if (!topic) {
            alert("Please enter a topic")
            return
        }
        setStep('loading')
        try {
            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade, subject, chapter, topic, difficulty })
            })
            const data = await res.json()
            if (data.success) {
                setQuizData(data.quiz)
                setStep('quiz')
                setCurrentIndex(0)
                setAnswers([])
                setScore(0)
            } else {
                alert("Failed to generate quiz: " + data.error)
                setStep('setup')
            }
        } catch (e) {
            console.error(e)
            setStep('setup')
        }
    }

    const handleAnswer = (option: string) => {
        setSelectedOption(option)
    }

    const submitAnswer = () => {
        if (!selectedOption || !quizData) return

        const currentQ = quizData.questions[currentIndex]
        const isCorrect = selectedOption === currentQ.correctAnswer

        const newAnswer = {
            question: currentQ.question,
            user: selectedOption,
            correct: currentQ.correctAnswer,
            isCorrect
        }

        setAnswers([...answers, newAnswer])
        if (isCorrect) setScore(score + 1)

        setSelectedOption(null)

        if (currentIndex < quizData.questions.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            setStep('result')
        }
    }

    const resetQuiz = () => {
        setStep('setup')
        setAnswers([])
        setScore(0)
        setQuizData(null)
    }

    const getPercentage = () => {
        if (!quizData) return 0
        return Math.round((score / quizData.questions.length) * 100)
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 flex flex-col">
            <Navbar />

            <main className="grow max-w-4xl mx-auto px-6 pt-32 pb-20 w-full">

                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-black uppercase tracking-widest">
                        <BrainCircuit size={14} />
                        Skill Assessment
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                        AI Quiz <span className="text-transparent bg-clip-text bg-linear-to-br from-purple-400 to-pink-600">Engine</span>
                    </h1>
                </div>

                {/* STEP: SETUP */}
                {step === 'setup' && (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Grade Level</label>
                                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:ring-1 focus:ring-purple-500">
                                    {['9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Subject</label>
                                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:ring-1 focus:ring-purple-500">
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Target Chapter</label>
                                <select value={chapter} onChange={e => setChapter(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:ring-1 focus:ring-purple-500">
                                    {chapters.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Specific Topic</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Mitosis"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:ring-1 focus:ring-purple-500 placeholder:font-normal"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Difficulty Mode</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Easy', 'Medium', 'Hard'].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${difficulty === d
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                                : 'bg-black/50 border-white/10 text-zinc-500 hover:text-white hover:border-white/30'
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-500 text-center mt-2">
                                    {difficulty === 'Easy' ? '10 Questions' : difficulty === 'Medium' ? '15 Questions' : '20 Advanced Questions'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={startQuiz}
                            className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-sm hover:bg-purple-400 hover:scale-[1.02] transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
                        >
                            <Play size={16} fill="currentColor" /> Start Challenge
                        </button>
                    </div>
                )}

                {/* STEP: LOADING */}
                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                            <BrainCircuit className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black italic uppercase text-white mb-2">Architecting Assessment...</h3>
                            <p className="text-sm text-zinc-500 font-medium">Analyzing {topic} curriculum parameters</p>
                        </div>
                    </div>
                )}

                {/* STEP: QUIZ */}
                {step === 'quiz' && quizData && (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
                        {/* Progress Bar */}
                        <div className="mb-8">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                                <span>Question {currentIndex + 1} / {quizData.questions.length}</span>
                                <span>{difficulty} Mode</span>
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all duration-500 ease-out"
                                    style={{ width: `${((currentIndex) / quizData.questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 mb-8 min-h-[300px] flex flex-col justify-center">
                            <MathContent
                                content={quizData.questions[currentIndex].question}
                                className="text-2xl font-bold text-white leading-tight mb-8"
                            />
                            <div className="space-y-3">
                                {quizData.questions[currentIndex].options.map((option: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(option)}
                                        className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all ${selectedOption === option
                                            ? 'bg-purple-500/20 border-purple-500 text-white'
                                            : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        <span className="inline-block w-6 font-mono text-zinc-600 mr-2">{String.fromCharCode(65 + i)}.</span>
                                        <MathContent content={option} className="inline-block" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex justify-end">
                            <button
                                onClick={submitAnswer}
                                disabled={!selectedOption}
                                className="px-8 py-3 bg-white text-black rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {currentIndex === quizData.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: RESULT */}
                {step === 'result' && (
                    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-500">
                        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 md:p-12 text-center mb-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-purple-500 via-pink-500 to-amber-500" />

                            <Trophy className="mx-auto text-amber-500 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" size={64} />

                            <h2 className="text-5xl font-black italic text-white mb-2">{getPercentage()}%</h2>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest mb-8">Assessment Complete</p>

                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Score</p>
                                    <p className="text-2xl font-bold text-white">{score} / {quizData.questions.length}</p>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Rank</p>
                                    <p className={`text-2xl font-bold ${getPercentage() >= 80 ? 'text-emerald-500' : getPercentage() >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {getPercentage() >= 90 ? 'Elite' : getPercentage() >= 75 ? 'Advanced' : getPercentage() >= 50 ? 'Novice' : 'Rookie'}
                                    </p>
                                </div>
                            </div>

                            <button onClick={resetQuiz} className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-colors">
                                <RefreshCw size={16} /> Try Another Quiz
                            </button>
                        </div>

                        {/* Analysis */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-black italic uppercase text-zinc-500 pl-4">Detailed Analysis</h3>
                            {answers.map((ans, i) => (
                                <div key={i} className={`p-6 rounded-2xl border ${ans.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 min-w-[24px] ${ans.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {ans.isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <MathContent content={ans.question} className="font-bold text-white mb-3" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="bg-black/30 p-3 rounded-lg">
                                                    <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block mb-1">Your Answer</span>
                                                    <MathContent content={ans.user} className={ans.isCorrect ? 'text-emerald-400' : 'text-red-400'} />
                                                </div>
                                                {!ans.isCorrect && (
                                                    <div className="bg-black/30 p-3 rounded-lg border border-emerald-500/20">
                                                        <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider block mb-1">Correct Answer</span>
                                                        <MathContent content={ans.correct} className="text-emerald-400" />
                                                    </div>
                                                )}
                                            </div>
                                            {!ans.isCorrect && quizData.questions[i].explanation && (
                                                <div className="mt-3 text-xs text-zinc-400 flex gap-2 items-start bg-black/20 p-3 rounded-xl">
                                                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                                    <MathContent content={quizData.questions[i].explanation} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
