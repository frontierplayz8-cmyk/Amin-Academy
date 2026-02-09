'use client'

import { BookOpen, Menu, X } from 'lucide-react'
import { useState } from 'react'
import AuthStatus from './IsLoggedIn'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

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
    <nav className="fixed top-0 w-full z-100 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">

        {/* Logo Section */}
        <Link href={'/'} className="flex items-center gap-2 font-bold text-xl tracking-tighter group z-50">
          <div className="flex items-center gap-2">
            <img
              src="/academy-logo.png"
              alt="Amin Academy Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
            />
            <span className="text-white italic">Amin<span className="text-zinc-500 not-italic font-light">ACADEMY</span></span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-zinc-400">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-1.5 hover:text-amber-500"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Section: Auth + Mobile Toggle */}
        <div className="flex items-center gap-6 z-50">
          <div className="hidden sm:block">
            <AuthStatus />
          </div>

          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <div
        className={cn(
          "absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-[#09090b] border-b border-zinc-800 p-6 md:hidden flex flex-col gap-6 shadow-2xl transition-all",
          isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-4 invisible pointer-events-none"
        )}
      >
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-lg font-bold text-zinc-400 hover:text-amber-500 uppercase italic tracking-widest"
          >
            {link.name}
          </Link>
        ))}

        <div className="pt-4 border-t border-zinc-800 flex justify-center sm:hidden">
          {/* Mobile Auth Status Wrapper */}
          <div onClick={() => setIsOpen(false)}>
            <AuthStatus />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar