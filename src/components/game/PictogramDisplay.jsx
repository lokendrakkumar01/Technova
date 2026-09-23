import React from 'react';
import { motion } from 'framer-motion';

/**
 * PictogramDisplay — renders the emoji pictogram(s) for the current question.
 * Parses composite pictograms like "🐍 + 💻" and displays them with a "+" separator.
 */
export default function PictogramDisplay({ pictogram, isShowdown = false }) {
  if (!pictogram) return null;

  // Split on " + " to support compound pictograms
  const parts = pictogram.split(' + ');

  return (
    <motion.div
      className="flex items-center justify-center gap-4 flex-wrap"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
      key={pictogram}
    >
      {parts.map((part, idx) => (
        <React.Fragment key={idx}>
          {/* Emoji part */}
          <motion.div
            className="relative flex items-center justify-center"
            animate={{
              y: [0, -6, 0],
              filter: isShowdown
                ? [
                    'drop-shadow(0 0 20px rgba(234,179,8,0.6))',
                    'drop-shadow(0 0 40px rgba(234,179,8,0.9))',
                    'drop-shadow(0 0 20px rgba(234,179,8,0.6))',
                  ]
                : [
                    'drop-shadow(0 0 20px rgba(0,245,255,0.5))',
                    'drop-shadow(0 0 40px rgba(0,245,255,0.8))',
                    'drop-shadow(0 0 20px rgba(0,245,255,0.5))',
                  ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.3 }}
          >
            {/* Glow backdrop */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{
                background: isShowdown
                  ? 'radial-gradient(circle, rgba(234,179,8,0.6) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(0,245,255,0.5) 0%, transparent 70%)',
                transform: 'scale(1.4)',
              }}
            />
            <span
              className="relative z-10 select-none leading-none"
              style={{ fontSize: 'clamp(4rem, 12vw, 7rem)' }}
              role="img"
              aria-label={`pictogram-part-${idx}`}
            >
              {part.trim()}
            </span>
          </motion.div>

          {/* "+" separator between parts */}
          {idx < parts.length - 1 && (
            <motion.span
              className="font-display font-black select-none"
              style={{
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                color: isShowdown ? '#eab308' : '#00f5ff',
                textShadow: isShowdown
                  ? '0 0 20px rgba(234,179,8,0.8)'
                  : '0 0 20px rgba(0,245,255,0.8)',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              +
            </motion.span>
          )}
        </React.Fragment>
      ))}
    </motion.div>
  );
}
