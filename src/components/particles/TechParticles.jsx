import React, { useMemo } from 'react';

const SYMBOLS = ['{ }', '</>', '01', '101', 'AI', 'SQL', 'λ', 'π', '<>', '⚡', '#', '@', '&&', '||', '0x', 'const', '=>', '404', 'NaN', '!='];

export default function TechParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      symbol: SYMBOLS[i % SYMBOLS.length],
      left: `${(i * 4.1 + Math.sin(i) * 3) % 96 + 2}%`,
      top: `${(i * 7.3 + Math.cos(i) * 5) % 90 + 5}%`,
      size: `${11 + (i % 6) * 2}px`,
      duration: `${14 + (i % 8) * 3}s`,
      delay: `${-(i % 10) * 1.5}s`,
      opacity: 0.12 + (i % 5) * 0.04,
      color: i % 3 === 0 ? 'text-cyan-neon' : i % 3 === 1 ? 'text-purple-electric' : 'text-blue-bright',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute font-mono font-semibold tracking-wider ${p.color} animate-float`}
          style={{
            left: p.left,
            top: p.top,
            fontSize: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
            textShadow: '0 0 12px currentColor',
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}
