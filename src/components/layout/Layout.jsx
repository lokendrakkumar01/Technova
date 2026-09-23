import React from 'react'
import Navbar from './Navbar'
import useGameStore from '../../store/gameStore'

/**
 * Layout — wraps every page with:
 *  • Deep navy bg (#020818) + subtle grid overlay
 *  • Sticky Navbar at top
 *  • Ambient radial glow accents (top-center)
 *  • Optional sound-toggle floating button (passed via soundToggle prop, or auto-wired)
 *  • Children rendered inside a relative z-10 container
 *
 * Props:
 *  className  – extra classes for the inner <main> wrapper
 *  noNavbar   – hide the Navbar (useful for ProjectorMode / full-screen pages)
 *  noPadding  – skip the default px/py padding on main
 */
export default function Layout({ children, className = '', noNavbar = false, noPadding = false }) {
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const toggleSound  = useGameStore((s) => s.toggleSound)

  return (
    <div className="relative min-h-screen bg-[#020818] overflow-x-hidden">

      {/* ── Subtle grid overlay ──────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* ── Top-center hero ambient glow ────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[40vh] z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.10) 0%, rgba(147,51,234,0.06) 45%, transparent 70%)',
        }}
      />

      {/* ── Bottom purple ambient glow ──────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 w-[50vw] h-[30vh] z-0"
        style={{
          background:
            'radial-gradient(ellipse at 100% 100%, rgba(147,51,234,0.08) 0%, transparent 60%)',
        }}
      />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      {!noNavbar && <Navbar />}

      {/* ── Sound Toggle (floating, bottom-right) ───────────────────────── */}
      <button
        onClick={toggleSound}
        aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
        title={soundEnabled ? 'Sound ON — click to mute' : 'Sound OFF — click to enable'}
        className={
          'fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center ' +
          'transition-all duration-300 glass-dark border ' +
          (soundEnabled
            ? 'border-cyan-neon/50 text-cyan-neon shadow-neon-cyan hover:shadow-[0_0_25px_rgba(0,245,255,0.6)]'
            : 'border-white/10 text-white/30 hover:border-white/30 hover:text-white/60')
        }
      >
        <span className="text-base leading-none select-none">
          {soundEnabled ? '🔊' : '🔇'}
        </span>
      </button>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main
        className={[
          'relative z-10',
          noPadding ? '' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
    </div>
  )
}
