import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Zap, GitBranch, Shield, AlertTriangle, BarChart3, Cpu,
  ArrowRight, Github, Users, Activity, Eye, ChevronRight,
  Star, CheckCircle, Sparkles, Terminal, Bot, X
} from 'lucide-react';
import AnimatedLogo from '../components/shared/AnimatedLogo';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    icon: Activity,
    title: 'Health Radar',
    description: 'Real-time project health scoring derived from Git activity patterns. Watch momentum rise or fall across sprints.',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/5',
  },
  {
    icon: AlertTriangle,
    title: 'Blocker Detection',
    description: 'AI identifies stale PRs, silent blockers, and inactive contributors before they kill your deadline.',
    color: '#ef4444',
    gradient: 'from-red-500/20 to-red-600/5',
  },
  {
    icon: Shield,
    title: 'Bus Factor Heatmap',
    description: 'Visual heatmap showing knowledge concentration. Know who\'s the single point of failure instantly.',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
  },
  {
    icon: Zap,
    title: 'Risk Simulation',
    description: 'Drag a slider to predict: "What if this PR stays open 48 more hours?" Watch health drop live.',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-violet-600/5',
  },
  {
    icon: Bot,
    title: 'AI Advisor',
    description: 'Ask questions about your project. Get structured, data-backed answers from an AI that knows your repo.',
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
  },
  {
    icon: Terminal,
    title: 'Commit Honesty',
    description: 'AI reads diffs and catches misleading commits. "fixed auth" but only changed CSS? Caught.',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/5',
  },
];

const stats = [
  { value: '5', label: 'Intelligence Engines', icon: Cpu },
  { value: '7', label: 'Dashboard Panels', icon: BarChart3 },
  { value: '100%', label: 'Git-Based Truth', icon: Github },
  { value: '< 2s', label: 'Analysis Time', icon: Activity },
];

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

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="grid-background" />

      {/* ───────── Navbar ───────── */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Hamburger toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-xl flex flex-col gap-[5px] items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block w-[18px] h-[2px] rounded-full bg-foreground transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block w-[18px] h-[2px] rounded-full bg-foreground transition-all duration-300 ${menuOpen ? 'opacity-0 scale-0' : ''}`} />
              <span className={`block w-[18px] h-[2px] rounded-full bg-foreground transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <AnimatedLogo size="md" />
              <span className="text-xl font-extrabold tracking-tight">
                Dev<span className="gradient-text">Pulse</span>
              </span>
            </Link>
          </div>
          <a href="https://github.com" target="_blank" rel="noopener" className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Github size={18} />
          </a>
        </div>
      </nav>

      {/* ───────── Slide-out Menu Drawer ───────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-72 z-[70] bg-background border-r border-border flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-border">
                <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                  <AnimatedLogo size="md" />
                  <span className="text-xl font-extrabold tracking-tight">
                    Dev<span className="gradient-text">Pulse</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Drawer links */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                {[
                  { label: 'Home', to: '/', icon: Zap },
                  { label: 'Dashboard', to: '/dashboard', icon: BarChart3 },
                  { label: 'Commit Analysis', to: '/commits', icon: Terminal },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-foreground/70 hover:text-foreground hover:bg-secondary transition-all"
                  >
                    <item.icon size={20} className="text-muted-foreground" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              {/* Drawer footer */}
              <div className="px-6 py-5 border-t border-border">
                <a href="https://github.com" target="_blank" rel="noopener" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Github size={18} />
                  <span className="font-medium">GitHub Repository</span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ───────── Hero Section ───────── */}
      <section className="relative pt-36 pb-24 px-6">
        {/* Ambient glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-500/[0.07] blur-[150px] pointer-events-none" />
        <div className="absolute top-40 left-[20%] w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-[120px] pointer-events-none" />
        <div className="absolute top-60 right-[15%] w-[300px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-blue-500/[0.08] border border-blue-500/15 mb-10"
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-400 tracking-wide">Problem Statement #3 — Code Style Policeman</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-8"
          >
            <span className="text-foreground">Your Project's</span>
            <br />
            <span className="gradient-text">Command Center</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Student teams don't fail because of bad code — they fail because no one sees 
            the risk until it's too late. DevPulse predicts delivery risk from GitHub 
            activity, revealing hidden blockers before demo day.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-4 mb-20"
          >
            <Link
              to="/dashboard"
              className="group flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-white/[0.07]"
            >
              Launch Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/commits"
              className="flex items-center gap-2.5 px-9 py-4 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-secondary hover:border-border/80 transition-all"
            >
              <Terminal size={16} />
              Commit Analysis
            </Link>
          </motion.div>

          {/* Hero perspective mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 25 }}
            animate={{ opacity: 1, y: 0, rotateX: scrolled ? 0 : 12 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hero-image-wrapper max-w-4xl mx-auto"
          >
            <div className={`hero-image ${scrolled ? 'scrolled' : ''} rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/40`}>
              {/* Fake dashboard preview */}
              <div className="p-1">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/50 rounded-t-xl">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-lg bg-secondary text-xs text-muted-foreground font-mono">
                      devpulse.app/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard content preview */}
                <div className="p-6 space-y-4 bg-background">
                  <div className="flex gap-4">
                    <div className="flex-1 rounded-xl bg-card border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="h-3 w-24 rounded bg-secondary" />
                      </div>
                      <div className="text-4xl font-black text-red-400 mb-1">62</div>
                      <div className="h-2 w-20 rounded bg-secondary" />
                    </div>
                    <div className="flex-1 rounded-xl bg-card border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="h-3 w-20 rounded bg-secondary" />
                      </div>
                      <div className="text-4xl font-black text-amber-400 mb-1">5</div>
                      <div className="h-2 w-16 rounded bg-secondary" />
                    </div>
                    <div className="flex-1 rounded-xl bg-card border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-violet-400" />
                        <div className="h-3 w-28 rounded bg-secondary" />
                      </div>
                      <div className="text-4xl font-black text-violet-400 mb-1">3</div>
                      <div className="h-2 w-24 rounded bg-secondary" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-card border border-border p-4 h-28 flex items-end gap-1">
                    {[85, 88, 82, 80, 78, 75, 72, 70, 68, 65, 64, 63, 62, 62].map((v, i) => (
                      <div key={i} className="flex-1 rounded-t bg-blue-500/40" style={{ height: `${v}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Stats Row ───────── */}
      <section className="py-16 px-6 border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500/30 transition-colors">
                <stat.icon size={20} className="text-muted-foreground group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-3xl font-black text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── Features Grid ───────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border mb-6">
              <Sparkles size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground">Core Intelligence</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-5">
              Powered by 5 Engines
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Every insight is derived from your GitHub repository. No manual input. No surveys. Just truth from code.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeInUp}
                className="group relative rounded-2xl bg-card border border-border p-7 hover:border-border/80 transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300"
                    style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}20` }}
                  >
                    <feature.icon size={22} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────── How It Works ───────── */}
      <section className="py-28 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-5">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three steps from repo to insight</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="rounded-2xl bg-card border border-border p-8 h-full hover:border-blue-500/20 transition-colors">
                  <div className="text-5xl font-black text-secondary mb-6 select-none">{step.step}</div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-5">
                    <step.icon size={22} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 text-muted">
                    <ChevronRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA / Pitch Section ───────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl bg-card border border-border p-16 glow-blue relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-violet-500/[0.06]" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-8">
                <Zap size={28} className="text-blue-400" />
              </div>
              <blockquote className="text-2xl md:text-4xl font-black text-foreground leading-tight mb-8">
                "We don't just report commits.
                <br />
                <span className="gradient-text">We predict outcomes."</span>
              </blockquote>
              <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed mb-10">
                DevPulse reconstructs team alignment and predicts delivery risk from GitHub activity, 
                revealing hidden blockers and integration failures before demo day.
              </p>
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-white/[0.07]"
              >
                See It In Action
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AnimatedLogo size="sm" />
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">DevPulse</span> — Built for Code Style Policeman
            </span>
          </div>
          <a href="https://github.com" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github size={18} />
          </a>
        </div>
      </footer>
    </div>
  );
}
