/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020818',
          900: '#050d1f',
          800: '#0a1628',
          700: '#0f1f3c',
          600: '#162847',
        },
        cyan: {
          neon: '#00f5ff',
          glow: '#00d4e8',
          soft: '#67e8f9',
        },
        purple: {
          neon: '#bf00ff',
          electric: '#9333ea',
          soft: '#d946ef',
          glow: '#a855f7',
        },
        blue: {
          electric: '#0066ff',
          bright: '#3b82f6',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
        'hero-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.15) 0%, rgba(147,51,234,0.08) 40%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'cyan-glow': 'radial-gradient(circle, rgba(0,245,255,0.3) 0%, transparent 70%)',
        'purple-glow': 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0,245,255,0.4), 0 0 40px rgba(0,245,255,0.2)',
        'neon-purple': '0 0 20px rgba(147,51,234,0.4), 0 0 40px rgba(147,51,234,0.2)',
        'neon-blue': '0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.2)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'count-up': 'countUp 0.5s ease-out',
        'flicker': 'flicker 3s linear infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseNeon: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.7', filter: 'brightness(1.5)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,245,255,0.3), 0 0 10px rgba(0,245,255,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0,245,255,0.6), 0 0 40px rgba(0,245,255,0.3)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        countUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%': { opacity: '0.8' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.5' },
          '99%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
