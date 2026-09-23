import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'HOW TO PLAY', to: '/how-to-play', icon: '📖' },
  { label: 'LEADERBOARD', to: '/leaderboard',  icon: '🏆' },
  { label: 'MEMORIES',    to: '/memories',     icon: '📸' },
  { label: 'HOST',         to: '/host',         icon: '🎙️' },
]

// ─── Drawer backdrop ──────────────────────────────────────────────────────────
function Backdrop({ onClick }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      aria-hidden="true"
    />
  )
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }) {
  const navigate   = useNavigate()
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const toggleSound  = useGameStore((s) => s.toggleSound)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleNav = (to) => {
    navigate(to)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClick={onClose} />

          <motion.aside
            className="fixed top-0 right-0 z-50 h-full w-72 glass-dark border-l border-white/08 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            aria-label="Mobile navigation"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/06">
              <span className="font-display font-black text-sm tracking-widest text-cyan-neon">
                MENU
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50
                           hover:text-white hover:bg-white/05 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {NAV_ITEMS.map(({ label, to, icon }) => (
                <button
                  key={to}
                  onClick={() => handleNav(to)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                             font-display font-bold text-xs tracking-widest uppercase
                             text-white/70 hover:text-cyan-neon hover:bg-cyan-neon/05
                             border border-transparent hover:border-cyan-neon/20
                             transition-all duration-200"
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </button>
              ))}

              {/* Divider */}
              <div className="h-px bg-white/06 my-4" />

              {/* Play button */}
              <button
                onClick={() => handleNav('/mode')}
                className="w-full btn-primary text-center justify-center flex items-center gap-2"
              >
                ⚡ PLAY NOW
              </button>
            </nav>

            {/* Sound toggle at bottom */}
            <div className="px-6 py-5 border-t border-white/06">
              <button
                onClick={toggleSound}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                           font-display font-bold text-xs tracking-widest uppercase
                           text-white/50 hover:text-white/80 hover:bg-white/04
                           transition-all duration-200"
              >
                <span className="text-base">{soundEnabled ? '🔊' : '🔇'}</span>
                SOUND {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const toggleSound  = useGameStore((s) => s.toggleSound)
  const navRef = useRef(null)

  // Elevate navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        ref={navRef}
        className={[
          'sticky top-0 z-50 w-full transition-all duration-300',
          'glass-dark border-b',
          scrolled
            ? 'border-cyan-neon/15 shadow-[0_4px_30px_rgba(0,245,255,0.05)]'
            : 'border-white/05',
        ].join(' ')}
        role="banner"
      >
        {/* Slim accent line at very top */}
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00f5ff55, #9333ea55, transparent)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* ── Logo ──────────────────────────────────────────────────── */}
            <Link
              to="/"
              className="flex items-center gap-2 group select-none"
              aria-label="TECHNOVA Home"
            >
              {/* Animated hexagon badge */}
              <motion.div
                className="relative w-8 h-8 flex items-center justify-center"
                whileHover={{ rotate: 15 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <span
                  className="text-xl leading-none"
                  style={{ filter: 'drop-shadow(0 0 8px #00f5ff)' }}
                >
                  ⬡
                </span>
                <span className="absolute text-[9px] font-display font-black text-[#020818] leading-none pointer-events-none">
                  TN
                </span>
              </motion.div>

              <span
                className="font-display font-black text-lg tracking-widest transition-all duration-300
                           group-hover:drop-shadow-[0_0_12px_rgba(0,245,255,0.8)]"
                style={{
                  background: 'linear-gradient(135deg, #00f5ff 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                TECHNOVA
              </span>
            </Link>

            {/* ── Desktop nav ───────────────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
              {NAV_ITEMS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'px-4 py-1.5 rounded-lg font-display font-bold text-[11px] tracking-widest uppercase',
                      'transition-all duration-200',
                      isActive
                        ? 'text-cyan-neon bg-cyan-neon/08 border border-cyan-neon/25'
                        : 'text-white/55 hover:text-white/90 hover:bg-white/04 border border-transparent',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}

              {/* Sound toggle */}
              <button
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Mute' : 'Enable sound'}
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg
                           text-white/40 hover:text-white/80 hover:bg-white/05
                           transition-all duration-200 text-base"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              {/* CTA */}
              <motion.div
                className="ml-3"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link
                  to="/mode"
                  className="btn-primary !py-1.5 !px-5 !text-[11px] inline-flex items-center gap-1.5"
                >
                  ⚡ PLAY
                </Link>
              </motion.div>
            </nav>

            {/* ── Mobile: sound + hamburger ─────────────────────────────── */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Mute' : 'Enable sound'}
                className="w-9 h-9 flex items-center justify-center rounded-lg
                           text-white/40 hover:text-white/80 hover:bg-white/05
                           transition-all duration-200 text-base"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg
                           text-white/60 hover:text-white hover:bg-white/05
                           transition-all duration-200"
              >
                {/* Animated hamburger lines */}
                <span className="block w-5 h-[1.5px] bg-current rounded-full transition-all" />
                <span className="block w-3.5 h-[1.5px] bg-current rounded-full transition-all self-end" />
                <span className="block w-5 h-[1.5px] bg-current rounded-full transition-all" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
