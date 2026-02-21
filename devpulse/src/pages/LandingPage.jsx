import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Zap, GitBranch, Shield, AlertTriangle, BarChart3, Cpu,
  ArrowRight, Github, Users, Activity, Eye, ChevronRight,
  Sparkles, Terminal, Bot, X,
  GitPullRequest, TrendingUp, Search, Bell, Calendar,
  Code2, Layers, Target, Gauge, BrainCircuit, ArrowUpRight,
  Menu
} from 'lucide-react';
import AnimatedLogo from '../components/shared/AnimatedLogo';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const features = [
  {
    icon: Activity,
    title: 'Health Radar',
    description: 'Real-time project health scoring derived from Git activity patterns. Watch momentum rise or fall across sprints.',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/5',
    tag: 'Core',
  },
  {
    icon: AlertTriangle,
    title: 'Blocker Detection',
    description: 'AI identifies stale PRs, silent blockers, and inactive contributors before they kill your deadline.',
    color: '#ef4444',
    gradient: 'from-red-500/20 to-red-600/5',
    tag: 'AI-Powered',
  },
  {
    icon: Shield,
    title: 'Bus Factor Heatmap',
    description: "Visual heatmap showing knowledge concentration. Know who's the single point of failure instantly.",
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    tag: 'Analytics',
  },
  {
    icon: Zap,
    title: 'Risk Simulation',
    description: 'Drag a slider to predict: "What if this PR stays open 48 more hours?" Watch health drop live.',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-violet-600/5',
    tag: 'Predictive',
  },
  {
    icon: Bot,
    title: 'AI Advisor',
    description: 'Ask questions about your project. Get structured, data-backed answers from an AI that knows your repo.',
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    tag: 'AI-Powered',
  },
  {
    icon: Terminal,
    title: 'Commit Honesty',
    description: 'AI reads diffs and catches misleading commits. "fixed auth" but only changed CSS? Caught.',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/5',
    tag: 'Integrity',
  },
];

// const stats = [
//   { value: 5, label: 'Intelligence Engines', icon: Cpu, suffix: '' },
//   { value: 7, label: 'Dashboard Panels', icon: BarChart3, suffix: '' },
//   { value: 100, label: 'Git-Based Truth', icon: Github, suffix: '%' },
//   { value: 2, label: 'Analysis Time', icon: Activity, suffix: 's', prefix: '< ' },
// ];

const steps = [
  {
    step: '01',
    title: 'Connect Your Repository',
    description: 'Link your GitHub repo in one click. We ingest commits, PRs, branches, and contributor data automatically.',
    icon: Github,
  },
  {
    step: '02',
    title: '5 Engines Analyze',
    description: 'Delivery metrics, alignment inference, blocker detection, risk scoring, and AI interpretation — all automated.',
    icon: Cpu,
  },
  {
    step: '03',
    title: 'Predict & Act',
    description: 'See your health score, simulate delays, identify risks, and ask the AI advisor for actionable recommendations.',
    icon: Zap,
  },
];

const whatWeDo = [
  {
    icon: Search,
    title: 'Deep Repo Analysis',
    desc: "We parse every commit, PR, and branch to build a complete picture of your project's pulse.",
  },
  {
    icon: BrainCircuit,
    title: 'AI-Driven Insights',
    desc: 'Gemini AI interprets patterns, detects anomalies, and provides actionable recommendations.',
  },
  {
    icon: Bell,
    title: 'Proactive Alerts',
    desc: 'Auto-ping inactive members, flag stale PRs, and surface blockers before they become crises.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    desc: 'Google Calendar integration auto-assigns tasks and milestones based on team workload.',
  },
];

/* ═══════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════ */

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

/* Animated Counter */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, target, duration]);

  return { count, ref };
}

function CounterStat({ stat, index }) {
  const { count, ref } = useCounter(stat.value, 1500);
  return (
    <motion.div
      ref={ref}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className="relative group text-center"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-300">
        <stat.icon size={22} className="text-muted-foreground group-hover:text-blue-400 transition-colors" />
      </div>
      <p className="text-4xl md:text-5xl font-black text-foreground mb-1 tabular-nums">
        {stat.prefix || ''}{count}{stat.suffix || ''}
      </p>
      <p className="text-sm text-muted-foreground">{stat.label}</p>
    </motion.div>
  );
}

/* Floating Particles */
function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      dur: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-blue-400/20"
          style={{ left: p.left, top: p.top }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* Typewriter */
function Typewriter({ words, className }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    const speed = deleting ? 40 : 80;
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), 1800);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) {
          setDeleting(false);
          setIndex((i) => (i + 1) % words.length);
        }
      }
    }, speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, index, words]);

  return (
    <span className={className}>
      {text}
      <span className="animate-pulse text-blue-400">|</span>
    </span>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((i) => (i + 1) % features.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="grid-background" />

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/20'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <AnimatedLogo size="sm" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Dev<span className="gradient-text">Pulse</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Dashboard', to: '/dashboard' },
              { label: 'Commit Analysis', to: '/commits' },
            ].map((link) =>
              link.to ? (
                <Link key={link.to} to={link.to} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  {link.label}
                </a>
              )
            )}
            <Link to="/dashboard" className="ml-3 px-5 py-2 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all">
              Launch
            </Link>
            <button
              onClick={toggleTheme}
              className="ml-1 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
          >
            <AnimatePresence mode="wait">
              {menuOpen ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* ═══════════ MOBILE DRAWER ═══════════ */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[280px] bg-card border-l border-border z-50 p-6 pt-20"
            >
              <div className="space-y-2">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Dashboard', to: '/dashboard' },
                  { label: 'Commit Analysis', to: '/commits' },
                ].map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-foreground font-medium hover:bg-secondary transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="mt-6 block text-center px-5 py-3 rounded-xl bg-foreground text-background font-bold text-sm">
                Launch Dashboard
              </Link>
              <button
                onClick={toggleTheme}
                className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-secondary transition-colors"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        <FloatingParticles />

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-blue-500/[0.08] blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-violet-500/[0.06] blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[150px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">

          {/* Title with typewriter */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[1.08] tracking-tight mb-4 sm:mb-6"
          >
            Your Project's
            <br />
            <Typewriter
              words={['Command Center', 'Health Monitor', 'Risk Predictor', 'AI Advisor']}
              className="gradient-text"
            />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2"
          >
            Many student teams fail to deliver on time because nobody sees the warning signs.
            DevPulse reads your GitHub activity, revealing hidden blockers{' '}
            <span className="text-foreground font-medium">before demo day</span>.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-20"
          >
            <Link
              to="/dashboard"
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 sm:px-9 py-4 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/[0.07] hover:shadow-black/15 dark:hover:shadow-white/[0.12]"
            >
              Launch Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/commits"
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 sm:px-9 py-4 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-secondary hover:border-border/80 transition-all"
            >
              <Terminal size={16} />
              Commit Analysis
            </Link>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 25 }}
            animate={{ opacity: 1, y: 0, rotateX: scrolled ? 0 : 12 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hero-image-wrapper max-w-4xl mx-auto"
          >
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WHAT WE DO ═══════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full bg-blue-500/[0.04] blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-violet-500/[0.04] blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border mb-5 sm:mb-6">
              <Eye size={14} className="text-violet-400" />
              <span className="text-xs font-medium text-muted-foreground">What We Do</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 sm:mb-5">
              We Turn Git Data Into <span className="gradient-text">Foresight</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-2">
              DevPulse is an AI-powered project health monitoring platform that analyzes your GitHub repository in real-time.
              No surveys. No standups. Just truth — extracted directly from your code activity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {whatWeDo.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="group relative rounded-2xl bg-card/50 backdrop-blur-sm border border-border p-6 sm:p-7 hover:border-blue-500/20 hover:bg-card transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon size={22} className="text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ROW ═══════════ */}
      {/* <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <CounterStat key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </section> */}

      {/* ═══════════ FEATURES (Interactive on Desktop) ═══════════ */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border mb-5 sm:mb-6">
              <Sparkles size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground">Core Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 sm:mb-5">
              Powered by <span className="gradient-text">5 Engines</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Every insight is derived from your GitHub repository. No manual input. No surveys. Just truth from code.
            </p>
          </motion.div>

          {/* Desktop: Interactive Feature Showcase */}
          <div className="hidden lg:grid grid-cols-5 gap-6">
            {/* Feature list (left) */}
            <div className="col-span-2 space-y-2">
              {features.map((feature, i) => (
                <motion.button
                  key={feature.title}
                  onClick={() => setActiveFeature(i)}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 ${activeFeature === i
                    ? 'bg-card border-border shadow-lg'
                    : 'border-transparent hover:bg-card/50 hover:border-border/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${activeFeature === i ? 'scale-110' : ''
                        }`}
                      style={{
                        backgroundColor: activeFeature === i ? `${feature.color}20` : `${feature.color}10`,
                        border: `1px solid ${activeFeature === i ? feature.color + '40' : feature.color + '15'}`,
                      }}
                    >
                      <feature.icon size={18} style={{ color: feature.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold transition-colors ${activeFeature === i ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {feature.title}
                        </h3>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors ${activeFeature === i ? 'bg-blue-500/15 text-blue-400' : 'bg-secondary text-muted-foreground/60'
                            }`}
                        >
                          {feature.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Feature detail (right) */}
            <div className="col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-2xl bg-card border border-border overflow-hidden h-full min-h-[340px]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].gradient} opacity-60`} />
                  <div className="relative z-10 p-8 sm:p-10 flex flex-col justify-between h-full">
                    <div>
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                        style={{
                          backgroundColor: `${features[activeFeature].color}15`,
                          border: `1px solid ${features[activeFeature].color}30`,
                        }}
                      >
                        {(() => {
                          const Icon = features[activeFeature].icon;
                          return <Icon size={26} style={{ color: features[activeFeature].color }} />;
                        })()}
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-4"
                        style={{ backgroundColor: `${features[activeFeature].color}12`, color: features[activeFeature].color }}
                      >
                        {features[activeFeature].tag}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
                        {features[activeFeature].title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                        {features[activeFeature].description}
                      </p>
                    </div>
                    <div className="mt-8">
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: features[activeFeature].color }}
                      >
                        Try it now <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile / Tablet: Card Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeInUp}
                className="group relative rounded-2xl bg-card border border-border p-6 sm:p-7 hover:border-border/80 transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                      style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}20` }}
                    >
                      <feature.icon size={20} style={{ color: feature.color }} />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground/70">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-blue-500/[0.03] blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border mb-5 sm:mb-6">
              <Layers size={14} className="text-cyan-400" />
              <span className="text-xs font-medium text-muted-foreground">How Our Application Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 sm:mb-5">
              Three Steps to <span className="gradient-text">Full Visibility</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto">
              From repository to actionable insights in under 2 seconds
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[100px] left-[16.67%] right-[16.67%] h-px">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-cyan-500/30"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                style={{ transformOrigin: 'left' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.step}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="relative"
                >
                  <div className="group rounded-2xl bg-card border border-border p-7 sm:p-8 h-full hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/[0.04] transition-all duration-500">
                    {/* Step circle */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xl font-black text-blue-400">{step.step}</span>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-4 sm:mb-5">
                      <step.icon size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:flex absolute top-[100px] -right-4 text-blue-400/40 z-10">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ DASHBOARD PREVIEW ═══════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border mb-5 sm:mb-6">
              <Gauge size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-muted-foreground">Dashboard Preview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 sm:mb-5">
              Everything at a <span className="gradient-text">Glance</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              See how DevPulse gives you complete visibility over your project's health, risks, and team dynamics.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {[
              { icon: Activity, title: 'Health Score', desc: 'Composite metric from commit frequency, PR velocity, and contributor balance', color: '#3b82f6', value: '62/100' },
              { icon: AlertTriangle, title: 'Active Blockers', desc: 'Stale PRs, inactive contributors, and merge conflicts detected automatically', color: '#ef4444', value: '5 found' },
              { icon: Users, title: 'Bus Factor', desc: 'Knowledge distribution across team members — avoid single points of failure', color: '#8b5cf6', value: '3 critical' },
              { icon: TrendingUp, title: 'Delivery Risk', desc: 'Probability of missing deadline based on commit trends and outstanding work', color: '#f59e0b', value: '72%' },
              { icon: GitPullRequest, title: 'Integration Risk', desc: 'Merge conflict probability calculated from branch divergence and overlap', color: '#06b6d4', value: '79%' },
              { icon: Bot, title: 'AI Recommendations', desc: 'Context-aware suggestions powered by Gemini AI that understands your repo', color: '#10b981', value: 'Active' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                custom={i}
                variants={fadeInUp}
                className="group rounded-2xl bg-card border border-border p-5 sm:p-6 hover:border-border/80 transition-all duration-500 overflow-hidden relative"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}12`, border: `1px solid ${card.color}20` }}
                  >
                    <card.icon size={18} style={{ color: card.color }} />
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ backgroundColor: `${card.color}12`, color: card.color }}
                  >
                    {card.value}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">{card.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CTA / PITCH ═══════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl bg-card border border-border p-10 sm:p-16 glow-blue relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-violet-500/[0.06]" />
            <FloatingParticles />
            <div className="relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <Zap size={28} className="text-blue-400" />
              </div>
              <blockquote className="text-xl sm:text-2xl md:text-4xl font-black text-foreground leading-tight mb-6 sm:mb-8">
                "We don't just report commits.
                <br />
                <span className="gradient-text">We predict outcomes."</span>
              </blockquote>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
                DevPulse reconstructs team alignment and predicts delivery risk from GitHub activity,
                revealing hidden blockers and integration failures before demo day.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  to="/dashboard"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-black/10 dark:shadow-white/[0.07]"
                >
                  See It In Action
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/commits"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-all"
                >
                  <Code2 size={16} />
                  View Commits
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-border py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AnimatedLogo size="sm" />
              <span className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">DevPulse</span> — Built for Code Style Policeman
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/commits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Commits</Link>
              <a href="https://github.com" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github size={18} />
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground/60">
              Webathon 2025 — AI-Powered Project Health Monitoring for Developer Teams
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
