import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AnimatedLogo — A morphing, animated logo for DevPulse.
 * Cycles through 4 icon states: pulse-line, shield, code brackets, radar-dot.
 *
 * Props:
 *   size  – 'sm' | 'md' | 'lg' (default 'md')
 */

const ICONS = [
  // 1. Heartbeat / pulse line
  (s) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.polyline
        points="2 12 6 12 9 4 12 20 15 12 18 12 22 12"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
    </svg>
  ),
  // 2. Shield with check
  (s) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.path
        d="M12 2l7 4v5c0 5-3.5 9.7-7 11-3.5-1.3-7-6-7-11V6l7-4z"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />
      <motion.polyline
        points="9 12 11 14 15 10"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: 'easeInOut' }}
      />
    </svg>
  ),
  // 3. Code brackets  < / >
  (s) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.polyline
        points="8 18 2 12 8 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <motion.polyline
        points="16 6 22 12 16 18"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeInOut' }}
      />
      <motion.line
        x1="13" y1="4" x2="11" y2="20"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: 'easeInOut' }}
      />
    </svg>
  ),
  // 4. Radar / scan circle with dot
  (s) => (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.circle
        cx="12" cy="12" r="10"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="12" cy="12" r="6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="12" cy="12" r="2"
        fill="currentColor"
        stroke="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6, ease: 'easeOut' }}
      />
    </svg>
  ),
];

const SIZE_MAP = {
  sm: { box: 'w-7 h-7', icon: 13, ring: 28, shadow: 'shadow-md' },
  md: { box: 'w-9 h-9', icon: 18, ring: 36, shadow: 'shadow-lg' },
  lg: { box: 'w-12 h-12', icon: 24, ring: 48, shadow: 'shadow-xl' },
};

export default function AnimatedLogo({ size = 'md' }) {
  const [phase, setPhase] = useState(0);
  const cfg = SIZE_MAP[size] || SIZE_MAP.md;

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % ICONS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`${cfg.box} relative flex items-center justify-center flex-shrink-0`}>
      {/* Outer spinning ring */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]"
        viewBox="0 0 40 40"
        fill="none"
      >
        <defs>
          <linearGradient id="logo-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle
          cx="20" cy="20" r="18"
          stroke="url(#logo-ring-grad)"
          strokeWidth="1.5"
          strokeDasharray="28 85"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      {/* Pulsing glow background */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-600/30 animate-[pulse_3s_ease-in-out_infinite] blur-sm" />

      {/* Main background */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 ${cfg.shadow} shadow-blue-500/25`} />

      {/* Morphing icon */}
      <div className="relative z-10 text-white flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            {ICONS[phase](cfg.icon)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
