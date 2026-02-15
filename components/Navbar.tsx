'use client'

import { BookOpen, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AuthStatus from './IsLoggedIn'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hide navbar on dashboard routes
  const dashboardRoutes = ['/principaldashboard', '/teacherdashboard', '/dashboard']
  const isDashboard = pathname ? dashboardRoutes.some(route => pathname.toLowerCase().startsWith(route)) : false

  if (isDashboard) return null

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Skill Quizzes', href: '/quizzes' },
    { name: 'Available Lectures', href: '/lectures' },
    { name: 'Careers', href: '/careers' },
    { name: 'Docs', href: '/docs' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">

        {/* Logo Section */}
        <div className="flex-1 flex justify-start">
          <Link href={'/'} className="flex items-center gap-2 font-bold text-xl tracking-tighter group z-50 transition-transform active:scale-95">
            <div className="flex items-center gap-2.5">
              <img
                src="/academy-logo.png"
                alt="Amin Academy Logo"
                className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all duration-300"
              />
              <span className="text-white italic tracking-tighter">Amin<span className="text-zinc-500 not-italic font-light">ACADEMY</span></span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center gap-6 text-[13px] font-medium tracking-wide text-zinc-400 whitespace-nowrap">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "relative py-1 transition-colors hover:text-white group",
                pathname === link.href && "text-amber-500"
              ) as string}
            >
              {link.name}
              <span className={cn(
                "absolute -bottom-1 left-0 w-0 h-px bg-amber-500 transition-all duration-300 group-hover:w-full",
                pathname === link.href && "w-full"
              ) as string} />
            </Link>
          ))}
        </div>

        {/* Right Section: Auth + Mobile Toggle */}
        <div className="flex-1 flex justify-end items-center gap-4 z-50">
          <div className="hidden sm:block">
            <AuthStatus />
          </div>

          {mounted && (
            <button
              className="md:hidden p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-[#09090b]/95 backdrop-blur-2xl border-b border-zinc-800/50 p-8 md:hidden flex flex-col gap-6 shadow-2xl z-40"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 text-xl font-bold text-zinc-400 hover:text-amber-500 uppercase italic tracking-[0.2em] transition-all py-2"
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-auto pt-8 border-t border-zinc-800/50 flex justify-center sm:hidden">
              <div onClick={() => setIsOpen(false)}>
                <AuthStatus />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar