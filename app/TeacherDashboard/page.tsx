'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Users,
  FileText,
  Sparkles,
  ClipboardCheck,
  Search,
  LayoutGrid,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react'
import ExamGeneratorModal from '@/components/ExamGeneratorModal'
import LectureUploadModal from '@/components/LectureUploadModal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { useAuthenticatedFetch } from '@/lib/useAuthenticatedFetch'
import { useAuth } from '@/context/AuthContext'
import { isWithinAcademyRadius, getCurrentPosition } from '@/lib/geofencing'

const TeacherDashboard = () => {
  const router = useRouter()
  const { authFetch, user: authUser } = useAuthenticatedFetch()
  const { loading: authLoading, profile } = useAuth()

  // Grade state updated to match DB format (simple numbers/strings)
  const [activeGrade, setActiveGrade] = useState('9')
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false)
  const [attendance, setAttendance] = useState<any>(null)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)

  const fetchAttendance = async () => {
    try {
      const res = await authFetch('/api/teacher/attendance')
      const data = await res.json()
      if (data.success) {
        setAttendance(data.attendance)
      }
    } catch (e) {
      console.error("Attendance Fetch Fail")
    }
  }

  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const res = await authFetch('/api/admin/students')
      const data = await res.json()
      if (data.success) {
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error("Fetch Error:", error)
      toast.error("Failed to load student roster")
    } finally {
      setLoadingStudents(false)
    }
  }

  const checkLocation = async () => {
    setLocationLoading(true)
    try {
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords
      const within = isWithinAcademyRadius(latitude, longitude)
      setIsWithinRadius(within)
    } catch (error) {
      console.error("Location access failed:", error)
      setIsWithinRadius(false)
      toast.error("Location access required to mark attendance")
    } finally {
      setLocationLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && authUser) {
      fetchAttendance()
      fetchStudents()
      checkLocation()
    }
  }, [authLoading, authUser])

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.grade == activeGrade || s.grade === `Grade ${activeGrade}`)
  }, [students, activeGrade])

  const handleMarkPresent = async () => {
    setMarkingAttendance(true)
    const toastId = toast.loading("Updating attendance record...")
    try {
      const res = await authFetch('/api/teacher/attendance', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message, { id: toastId })
        setAttendance(data.attendance)
      } else {
        toast.error(data.message, { id: toastId })
      }
    } catch (e) {
      toast.error("Network synchronization failed", { id: toastId })
    } finally {
      setMarkingAttendance(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-4 sm:p-6 md:p-10 font-sans">

      {/* 1. TOP BAR: Context & Actions */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <img
            src="/academy-logo.png"
            alt="Logo"
            className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
              Teacher <span className="text-emerald-500 underline decoration-emerald-500/30">Dashboard</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Amin Academy Portal</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition">
            <Search size={16} /> <span className="hidden sm:inline">Search Student</span>
          </button>
          <button
            onClick={() => setIsLectureModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 border border-emerald-500/30 text-emerald-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/10 transition"
          >
            <Video size={16} /> <span className="hidden sm:inline">Upload Lecture</span>
          </button>
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-black px-5 py-2 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-emerald-500 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus size={18} /> New Paper
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-6">

        {/* 2. THE AI POWER-ACTION (Featured Card) */}
        <div className="col-span-12 lg:col-span-8 group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 transition-all hover:border-emerald-500/40">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-500 mb-4">
              <Sparkles size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI Assistant Ready</span>
            </div>
            <h2 className="text-4xl font-black max-w-md leading-none mb-4">GENERATE QUESTION PAPER FROM SYLLABUS.</h2>
            <p className="text-zinc-400 text-sm max-w-sm mb-8">Select chapters from Classes 1-11 and let our AI generate a professional exam paper in seconds.</p>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsGeneratorOpen(true)}
                className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition"
              >
                Open Generator <ArrowRight size={18} />
              </button>
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                Last Gen: Class {activeGrade} (Recently)
              </div>
            </div>
          </div>
          {/* Abstract Decoration */}
          <div className="absolute right-[-5%] bottom-[-10%] opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText size={280} className="text-emerald-500 rotate-12" />
          </div>
        </div>

        {/* 3. CONTEXTUAL SIDE PANEL: Classes & Attendance */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Class Selector */}
          <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">My Classes</h3>
              <LayoutGrid size={16} className="text-zinc-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['7', '8', '9', '10', '11'].map((grade) => (
                <button
                  key={grade}
                  onClick={() => setActiveGrade(grade)}
                  className={`p-4 rounded-2xl border text-sm font-bold transition-all ${activeGrade === grade
                    ? 'bg-emerald-600 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-emerald-500/30 hover:text-white'
                    }`}
                >
                  Grade {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Marking Card */}
          <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
              <ClipboardCheck size={80} />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Attendance Status</h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${attendance?.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Live Database Sync</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Current Status</p>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter">
                {attendance ? (
                  <span className={attendance.status === 'Present' ? 'text-emerald-500' : 'text-amber-500'}>
                    {attendance.status}
                  </span>
                ) : "OFF-DUTY"}
              </h4>
            </div>

            {attendance ? (
              <div className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                  {attendance.status === 'Pending' && <Clock size={12} className="text-amber-500" />}
                  {attendance.status === 'Present' && <CheckCircle2 size={12} className="text-emerald-500" />}
                  {attendance.status === 'Absent' && <XCircle size={12} className="text-red-500" />}
                  {attendance.status === 'Pending' ? "Awaiting Principal Verification" : `Marked as ${attendance.status}`}
                </div>
                <p className="text-[9px] text-zinc-600 leading-relaxed uppercase tracking-widest font-medium">
                  {attendance.status === 'Pending'
                    ? "Your attendance has been recorded and is awaiting approval from the Principal."
                    : `Synced with school records on ${attendance.date}.`
                  }
                </p>
              </div>
            ) : locationLoading ? (
              <div className="flex items-center justify-center p-6 bg-zinc-900/40 rounded-2xl border border-white/5 gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={16} />
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Scanning Coordinates...</span>
              </div>
            ) : isWithinRadius ? (
              <button
                onClick={handleMarkPresent}
                disabled={markingAttendance}
                className="w-full bg-transparent border border-white/10 hover:border-white/30 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all hover:bg-white/5 active:scale-95 disabled:opacity-50"
              >
                {markingAttendance ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-emerald-500" />}
                Force Present Sync
              </button>
            ) : (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <ShieldAlert size={20} className="text-red-500" />
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Out of School Radius</p>
                <p className="text-[8px] text-red-500/60 font-medium text-center uppercase leading-tight tracking-tighter">
                  Attendance marking disabled. Terminal outside school area.
                </p>
                <button
                  onClick={checkLocation}
                  className="mt-2 text-[8px] font-black uppercase text-white/40 hover:text-white transition-colors"
                >
                  Re-check Location
                </button>
              </div>
            )}
          </div>

          {/* New Security Dashboard Card */}
          <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-6 flex flex-col relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
            <div className="absolute top-[-10%] right-[-10%] p-8 bg-emerald-500/5 blur-2xl rounded-full" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Security Node</h3>
              <ShieldCheck className={profile?.twoFactorEnabled ? "text-emerald-500" : "text-amber-500 animate-pulse"} size={16} />
            </div>

            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-relaxed mb-6">
              {profile?.twoFactorEnabled
                ? "2FA Protection confirmed. Your account is secure."
                : "Your account is vulnerable. Activate 2FA to secure your teacher profile."}
            </p>

            <button
              onClick={() => router.push('/profile')}
              className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profile?.twoFactorEnabled
                ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                : 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:bg-amber-400'
                }`}
            >
              {profile?.twoFactorEnabled ? "Manage Security" : "Enable 2FA Protection"}
            </button>
          </div>
        </div>

        {/* 4. STUDENT ROSTER (The "Work" Area) */}
        <div className="col-span-12 rounded-3xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/10">
            <h3 className="font-bold flex items-center gap-2">
              <Users size={18} className="text-emerald-500" />
              Active Roster: Grade {activeGrade}
            </h3>
            <div className="flex gap-4">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                {filteredStudents.length} Students Enrolled
              </span>
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Loading System...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-600">
                <Users size={32} className="opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No students enrolled in Grade {activeGrade}</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-600 text-[10px] font-black uppercase tracking-widest border-b border-white/5 bg-zinc-900/20">
                    <th className="p-4 md:p-6">Student Name</th>
                    <th className="p-4 md:p-6 hidden sm:table-cell">Index (Roll)</th>
                    <th className="p-4 md:p-6 hidden md:table-cell">Performance</th>
                    <th className="p-4 md:p-6 text-right">Fee Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.id || student._id || idx} className="border-b border-white/5 group hover:bg-emerald-500/5 transition">
                      <td className="p-4 md:p-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                          {student.imageUrl ? (
                            <img src={student.imageUrl} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-black text-zinc-500">{student.name?.[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">{student.name}</p>
                          <p className="text-[9px] font-mono text-zinc-600 truncate">{student.fatherName}</p>
                        </div>
                      </td>
                      <td className="p-4 md:p-6 font-mono text-zinc-400 text-xs hidden sm:table-cell">
                        {student.rollNumber}
                      </td>
                      <td className="p-4 md:p-6 hidden md:table-cell">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <div key={star} className={`w-1.5 h-1.5 rounded-full transition-all ${star <= (student.performance || 3) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-800'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 md:p-6 text-right">
                        <span className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider ${student.feeStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                          {student.feeStatus || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      <ExamGeneratorModal
        isOpen={isGeneratorOpen}
        setIsOpen={setIsGeneratorOpen}
        redirectPath="/TeacherDashboard/view-paper"
      />

      <LectureUploadModal
        isOpen={isLectureModalOpen}
        onClose={() => setIsLectureModalOpen(false)}
        userName="Teacher" // TODO: Replace with dynamic user name
      />

    </div>
  )
}

export default TeacherDashboard