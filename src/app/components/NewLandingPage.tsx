import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useSpring, useTransform, useMotionValue, useInView } from 'motion/react';
import {
  ArrowRight, Check, Zap, Shield, Globe, Terminal,
  Gauge, TrendingUp, BarChart3,
  Star, Github, Twitter,
  Menu, X, Activity, Rocket, Sparkles, Braces,
  GitBranch, TerminalSquare,
  Server, Network, Users
} from 'lucide-react';
import Logo from './Logo.svg';

/* ---------- Animation variants ---------- */
const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

/* ---------- Section helpers ---------- */
function SectionBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 rounded-full mb-6 backdrop-blur-sm">
      <Icon className="w-4 h-4 text-white" />
      <span className="text-sm text-white/80 font-medium tracking-wide">{label}</span>
    </motion.div>
  );
}

function SectionHeader({ badge, title, description }: { badge: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div variants={itemVariants} className="text-center mb-16 md:mb-20">
      {badge}
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 px-4 text-white">
        {title}
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-[620px] mx-auto px-4 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

/* ---------- Tilt card wrapper ---------- */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [8, -8]);
  const rotateY = useTransform(x, [-50, 50], [-8, 8]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Animated terminal ---------- */
const terminalLines = [
  { type: 'cmd', text: 'opendevops deploy' },
  { type: 'info', text: 'Analyzing repository...' },
  { type: 'ok', text: 'Dependencies installed (2.3s)' },
  { type: 'ok', text: 'Build completed (8.1s)' },
  { type: 'ok', text: 'Tests passed (15 checks)' },
  { type: 'ok', text: 'Deployed to production' },
  { type: 'url', text: 'https://your-app.opendevops.app' },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typed, setTyped] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    let lineIdx = 0;
    let charIdx = 0;
    let raf: ReturnType<typeof setTimeout>;
    const typeNext = () => {
      if (lineIdx >= terminalLines.length) {
        setVisibleLines(terminalLines.length);
        setTyped('');
        return;
      }
      const line = terminalLines[lineIdx];
      if (charIdx <= line.text.length) {
        setTyped(line.text.slice(0, charIdx));
        charIdx++;
        raf = setTimeout(typeNext, 35);
      } else {
        setVisibleLines(lineIdx + 1);
        setTyped('');
        lineIdx++;
        charIdx = 0;
        raf = setTimeout(typeNext, 400);
      }
    };
    raf = setTimeout(typeNext, 600);
    return () => clearTimeout(raf);
  }, [inView]);

  const colorMap: Record<string, string> = {
    cmd: 'text-white',
    info: 'text-gray-500',
    ok: 'text-gray-400',
    url: 'text-white',
  };

  return (
    <div ref={ref} className="relative border border-white/10 rounded-xl sm:rounded-2xl bg-[#0A0A0A] p-1 shadow-2xl shadow-black/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="rounded-lg sm:rounded-xl bg-gradient-to-b from-[#161616] to-[#0A0A0A] overflow-hidden relative">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/30" />
            </div>
            <span className="text-[11px] sm:text-sm text-gray-500 font-mono">opendevops-deploy</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-white/5 border border-white/15 rounded-full">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
            <span className="text-[10px] sm:text-xs text-white font-medium">Deployed</span>
          </div>
        </div>
        <div className="p-4 sm:p-6 font-mono text-[11px] sm:text-sm space-y-1.5 sm:space-y-2 min-h-[230px]">
          {terminalLines.map((line, i) => {
            const isCurrent = i === visibleLines;
            const isShown = i < visibleLines;
            if (!isShown && !isCurrent) return null;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                {line.type === 'cmd' && <span className="text-gray-600">$</span>}
                {line.type === 'ok' && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white shrink-0" />}
                {line.type === 'info' && <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white/60 shrink-0" />}
                {line.type === 'url' && <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />}
                <span className={`${colorMap[line.type]} ${line.type !== 'cmd' && line.type !== 'url' ? 'pl-0' : ''}`}>
                  {isCurrent ? typed : line.text}
                  {isCurrent && <span className="animate-blink">▋</span>}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 border-t border-white/5">
          {[
            { label: 'Deploy Time', value: '12.4s', icon: Zap, color: 'text-white' },
            { label: 'Response Time', value: '42ms', icon: Gauge, color: 'text-white' },
            { label: 'Success Rate', value: '99.9%', icon: TrendingUp, color: 'text-white' },
            { label: 'Tests', value: '15/15', icon: Check, color: 'text-white' }
          ].map((metric, i) => (
            <div key={i} className="bg-[#0A0A0A] px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <metric.icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${metric.color}`} />
                <span className="text-[10px] sm:text-xs text-gray-500">{metric.label}</span>
              </div>
              <div className="text-sm sm:text-base font-semibold text-white">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'How to use', href: '#workflow' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-0.5 bg-white z-[60] origin-left"
      />

      {/* Animated Background — pure monochrome */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(255,255,255,0.04)_0%,transparent_50%)]" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-white/[0.04] rounded-full blur-[120px] animate-aurora" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-white/[0.03] rounded-full blur-[120px] animate-aurora-reverse" />
        <div className="absolute top-[45%] left-[55%] w-[380px] h-[380px] bg-white/[0.02] rounded-full blur-[100px] animate-float-slow" />
        <div
          className="absolute inset-0 grid-fade bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[64px] sm:h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 hover:shadow-white/20 transition-shadow"
            >
              <img src={Logo} alt="Opendevops Logo" className="w-6 h-6 sm:w-7 sm:h-7 invert" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base text-white leading-none group-hover:text-white/70 transition-colors">Opendevops</span>
              <span className="text-[9px] sm:text-[10px] text-gray-500 leading-none mt-0.5">DevOps Platform</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link to="/register" className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg shadow-white/10 hover:shadow-white/20 group">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-white/10 bg-black overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {item.label}
                </a>
              ))}
              <hr className="border-white/10 my-2" />
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.08] rounded-full blur-[120px] opacity-30" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <motion.div variants={itemVariants} className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm group">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-white" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-xs sm:text-sm text-white/80">All-in-one DevOps platform</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center max-w-[950px] mx-auto mb-10 sm:mb-14">
            <h1 className="text-[38px] sm:text-[52px] md:text-[68px] lg:text-[80px] leading-[1.05] font-bold mb-4 sm:mb-6 px-2 tracking-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-block"
              >
                Deploy. Monitor. Ship.
              </motion.span>
              <span className="block text-white bg-clip-text text-transparent text-glow mt-1">
                All from one dashboard.
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-[650px] mx-auto leading-relaxed px-4">
              Opendevops brings your projects, deployments, terminal, logs, monitoring, and team collaboration together — so you can manage your entire infrastructure from a single place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
              <Link to="/register" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-white/10 hover:shadow-white/20 group relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">Start building free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm sm:text-base backdrop-blur-sm group">
                <TerminalSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>View demo</span>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-10 mb-12 sm:mb-16 text-xs sm:text-sm text-gray-500 px-4">
            {[
              { icon: GitBranch, text: 'Git-based deploys' },
              { icon: Terminal, text: 'Real-time terminal' },
              { icon: BarChart3, text: 'Live monitoring' },
              { icon: Shield, text: 'Built-in security' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.08, y: -2 }}
                className="flex items-center gap-1.5 sm:gap-2 cursor-default"
              >
                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="relative group max-w-[1000px] mx-auto">
            <div className="absolute -inset-1 bg-white rounded-2xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
            <AnimatedTerminal />
          </motion.div>
        </div>
      </motion.section>

      {/* What is Opendevops — About */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
        id="about"
      >
        <div className="max-w-[900px] mx-auto text-center">
          <SectionHeader
            badge={<SectionBadge icon={Activity} label="What is this" />}
            title="One platform for your whole workflow"
            description="Opendevops is a self-hosted DevOps platform. You connect your projects, run deployments, open a terminal session, track logs and errors, manage tasks and bugs, and chat with your team — all without switching between ten different tools."
          />
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12">
            {[
              { icon: Server, title: 'Self-hosted', desc: 'Runs on Cloudflare Workers with a D1 database. Your data stays in your control.' },
              { icon: Network, title: 'Real-time', desc: 'Terminal sessions, log streams, and deployment updates push live over WebSocket.' },
              { icon: Users, title: 'Team-ready', desc: 'Built-in team chat, task boards, and bug tracking so your whole team stays aligned.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
        id="workflow"
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader
            badge={<SectionBadge icon={Rocket} label="How to use" />}
            title="From repo to production in three steps"
            description="Connect your repository, deploy with one command, and monitor everything in real time."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
            <div className="hidden sm:block absolute top-20 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {[
              {
                step: '01',
                icon: Braces,
                title: 'Connect your repo',
                description: 'Link any Git repository. Opendevops detects your framework and sets up the build pipeline automatically.',
              },
              {
                step: '02',
                icon: Rocket,
                title: 'Deploy with one command',
                description: 'Push your code or run a single command. Opendevops builds, tests, and deploys your app to the edge.',
              },
              {
                step: '03',
                icon: Activity,
                title: 'Monitor in real time',
                description: 'Watch logs, track errors, and check performance metrics as they happen. Fix issues before users notice.',
              }
            ].map((item, i) => (
              <TiltCard key={i}>
                <motion.div
                  variants={itemVariants}
                  className="group relative p-6 sm:p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/[0.06] transition-all duration-300 h-full"
                >
                  <span className="text-5xl sm:text-6xl font-bold text-white/5 absolute top-4 right-6 select-none group-hover:text-white/10 transition-colors">{item.step}</span>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white flex items-center justify-center mb-5 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 relative z-10">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed relative z-10">{item.description}</p>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8"
        id="pricing"
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader
            badge={<SectionBadge icon={Star} label="Pricing" />}
            title="Simple, transparent pricing"
            description="Start free, upgrade when you grow. No hidden fees."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-[1100px] mx-auto">
            {[
              { name: 'Free', price: '$0', period: '/month', popular: false, features: ['1 project', 'Basic monitoring', 'Community support'], cta: 'Get started free', to: '/register' },
              { name: 'Pro', price: '$29', period: '/month', popular: true, features: ['Unlimited projects', '10 team members', 'Full terminal access', 'Advanced monitoring', 'Priority support', 'Custom domains'], cta: 'Start Pro trial', to: '/register' },
              { name: 'Enterprise', price: 'Custom', period: '', popular: false, features: ['Everything in Pro', 'Unlimited team members', 'Dedicated support', 'SSO/SAML', 'Audit logs', 'SLA guarantee'], cta: 'Contact sales', to: '#' }
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className={`relative p-6 sm:p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-white/10 border border-white/40 shadow-xl shadow-white/10'
                    : 'bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-white text-black rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-lg">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl font-bold mb-1">{plan.name}</h3>
                <div className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">
                  {plan.price}<span className="text-base sm:text-lg text-gray-400 font-normal">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 sm:space-y-3 mb-8 sm:mb-10">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-300">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.to === '#' ? (
                  <button className="w-full py-2.5 sm:py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all text-sm sm:text-base">
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to={plan.to}
                    className={`w-full py-2.5 sm:py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base group ${
                      plan.popular
                        ? 'bg-white text-black hover:bg-white/90 shadow-lg'
                        : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-12 mb-10 sm:mb-12">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10">
                  <img src={Logo} alt="Opendevops Logo" className="w-6 h-6 sm:w-7 sm:h-7 invert" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm sm:text-base text-white">Opendevops</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">DevOps Platform</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4 sm:mb-6 max-w-[300px]">
                Manage your projects, deployments, terminal, logs, and team — all in one place.
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Github className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
              </div>
            </div>

            {[
              { title: 'Product', links: ['About', 'Pricing', 'Docs'] },
              { title: 'Company', links: ['About', 'Blog', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm text-white">{section.title}</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {section.links.map((link) => {
                    const href = link === 'Docs' ? '/docs' : '#';
                    return (
                      <li key={link}>
                        {link === 'Docs' ? (
                          <Link to={href} className="text-xs sm:text-sm text-gray-500 hover:text-white transition-colors">
                            {link}
                          </Link>
                        ) : (
                          <a href={href} className="text-xs sm:text-sm text-gray-500 hover:text-white transition-colors">
                            {link}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
            <p>© 2025 Opendevops, Inc. All rights reserved.</p>
            <p>Built with care for developers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
