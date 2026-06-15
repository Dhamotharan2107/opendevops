import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight, Check, Zap, Shield, Globe, Terminal,
  Cloud, Gauge, PackageCheck, Bot, TrendingUp,
  Code2, BarChart3, Users, Star, Github, Twitter,
  Menu, X, Cpu, Activity, Rocket, Sparkles, Braces
} from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

function SectionBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
      <Icon className="w-4 h-4 text-violet-400" />
      <span className="text-sm text-violet-300">{label}</span>
    </motion.div>
  );
}

function SectionHeader({ badge, title, description }: { badge: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div variants={itemVariants} className="text-center mb-16 md:mb-20">
      {badge}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 px-4">{title}</h2>
      <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-[600px] mx-auto px-4">{description}</p>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

export function NewLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Developers', href: '#developers' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[64px] sm:h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base text-white leading-none">Opendrap</span>
              <span className="text-[9px] sm:text-[10px] text-gray-500 leading-none mt-0.5">DevOps AI Platform</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full p-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link to="/register" className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all flex items-center gap-2">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="w-4 h-4" />
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden border-t border-white/5 bg-[#0A0A0F]"
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
              <hr className="border-white/5 my-2" />
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
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem_sm:4rem_4rem]" />
        <div className="absolute top-0 left-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-violet-500/25 rounded-full blur-[120px] sm:blur-[150px]" />
        <div className="absolute top-20 right-1/4 w-[250px] sm:w-[450px] h-[250px] sm:h-[450px] bg-fuchsia-500/15 rounded-full blur-[120px] sm:blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-pink-500/10 rounded-full blur-[100px]" />

        <div className="max-w-[1400px] mx-auto relative">
          <motion.div variants={itemVariants} className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs sm:text-sm text-gray-300">AI-powered deployment & testing platform</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center max-w-[950px] mx-auto mb-10 sm:mb-14">
            <h1 className="text-[38px] sm:text-[52px] md:text-[68px] leading-[1.05] font-bold mb-4 sm:mb-6 tracking-tight px-2">
              Deploy. Test. Monitor.
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                All powered by AI.
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-[650px] mx-auto leading-relaxed px-4">
              Opendrap is an open-source DevOps platform that automates your entire pipeline — from code push to production monitoring — with built-in AI agents that test, debug, and optimize your deployments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
              <Link to="/register" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-white/10 hover:shadow-white/20">
                Start building free
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm sm:text-base backdrop-blur-sm">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5" />
                View demo
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-10 mb-12 sm:mb-16 text-xs sm:text-sm text-gray-500 px-4">
            {[
              { icon: Terminal, text: 'Git-based deploys' },
              { icon: Bot, text: 'AI test agents' },
              { icon: BarChart3, text: 'Real-time monitoring' },
              { icon: Shield, text: 'Built-in security' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="relative group max-w-[1000px] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative border border-white/10 rounded-xl sm:rounded-2xl bg-[#0F0F14] p-1 shadow-2xl shadow-violet-500/5">
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-b from-[#1A1A24] to-[#0F0F14] overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[11px] sm:text-sm text-gray-500 font-mono">opendrap-deploy</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] sm:text-xs text-green-400 font-medium">Deployed</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6 font-mono text-[11px] sm:text-sm space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-gray-600">$</span>
                    <span className="text-violet-400">opendrap deploy</span>
                  </div>
                  <div className="text-gray-500 pl-5 sm:pl-6">⚡ Analyzing repository...</div>
                  <div className="flex items-center gap-1.5 sm:gap-2 pl-5 sm:pl-6">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                    <span className="text-gray-400">Dependencies installed (2.3s)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 pl-5 sm:pl-6">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                    <span className="text-gray-400">Build completed (8.1s)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 pl-5 sm:pl-6">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                    <span className="text-gray-400">AI tests passed (15 checks)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 pl-5 sm:pl-6">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                    <span className="text-gray-400">Deployed to production</span>
                  </div>
                  <div className="pl-5 sm:pl-6 text-violet-400 flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">https://your-app.opendrap.app</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 border-t border-white/5">
                  {[
                    { label: 'Deploy Time', value: '12.4s', icon: Zap, color: 'text-yellow-400' },
                    { label: 'Response Time', value: '42ms', icon: Gauge, color: 'text-green-400' },
                    { label: 'Success Rate', value: '99.9%', icon: TrendingUp, color: 'text-blue-400' },
                    { label: 'AI Tests', value: '15/15', icon: Bot, color: 'text-violet-400' }
                  ].map((metric, i) => (
                    <div key={i} className="bg-[#0F0F14] px-3 sm:px-4 py-2 sm:py-3">
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
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works - quick steps */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02]"
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader
            badge={<SectionBadge icon={Rocket} label="How it works" />}
            title="From code to cloud in minutes"
            description="Connect your repo, configure once, and let Opendrap handle the rest."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                icon: Braces,
                title: 'Connect your repo',
                description: 'Link any Git repository. Opendrap automatically detects your framework and configures the build pipeline.'
              },
              {
                step: '02',
                icon: Bot,
                title: 'AI runs the pipeline',
                description: 'Push code and our AI agents build, test, and deploy your app — catching bugs before they reach production.'
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Monitor & optimize',
                description: 'Track performance, errors, and usage in real time. Get AI-powered suggestions to improve reliability.'
              }
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} className="relative p-6 sm:p-8 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-4xl sm:text-5xl font-bold text-white/5 absolute top-4 right-6 select-none">{item.step}</span>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-5 sm:mb-6">
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 relative z-10">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed relative z-10">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
            {[
              { value: 'Unlimited', label: 'Projects & Teams', icon: Users },
              { value: '< 30s', label: 'Avg. Deploy Time', icon: Activity },
              { value: '99.99%', label: 'Uptime SLA', icon: Shield },
              { value: 'Global', label: 'Edge Network', icon: Globe }
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white/[0.02]"
        id="platform"
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader
            badge={<SectionBadge icon={Zap} label="Platform" />}
            title="Everything a modern dev team needs"
            description="CI/CD, AI testing, monitoring, collaboration — one platform, zero hassle."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Terminal,
                title: 'One-Click Deploys',
                description: 'Push to Git and deploy automatically. Zero configuration required.',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: Bot,
                title: 'AI-Powered Testing',
                description: 'Automated testing with GPT-4 that thinks like a real user.',
                color: 'from-violet-500 to-purple-500'
              },
              {
                icon: Globe,
                title: 'Global Edge Network',
                description: 'Deploy to 300+ cities worldwide with Cloudflare integration.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description: 'Monitor performance, errors, and user behavior in real-time.',
                color: 'from-orange-500 to-red-500'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'SOC 2 compliant with automatic SSL, DDoS protection, and WAF.',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Deploy previews, comments, and approvals for every pull request.',
                color: 'from-pink-500 to-rose-500'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group relative p-6 sm:p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-violet-500/20 transition-all duration-300"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Solutions Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8"
        id="solutions"
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader
            badge={<SectionBadge icon={Cpu} label="Solutions" />}
            title="Built for every workflow"
            description="From indie developers to enterprise teams, Opendrap scales with your needs"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: Zap, title: 'Startup Launchpad', description: 'Deploy your MVP in minutes. Built-in hosting, CI/CD, and monitoring.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Shield, title: 'Enterprise Suite', description: 'SOC 2 compliant with RBAC, audit logs, and dedicated support.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Users, title: 'Agency Platform', description: 'Manage multiple client projects with team collaboration and white-label options.', gradient: 'from-violet-500 to-purple-500' },
              { icon: Code2, title: 'Open Source', description: 'Free for public repositories. Community templates and plugins.', gradient: 'from-orange-500 to-red-500' }
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} className="group p-6 sm:p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-violet-500/20 transition-all duration-300">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Developers Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white/[0.02]"
        id="developers"
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader
            badge={<SectionBadge icon={Code2} label="Developers" />}
            title="Built for developers, by developers"
            description="Everything you need to ship fast, from CLI to API"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              { icon: Terminal, title: 'CLI & Agent', description: 'Install with one command. Deploy, test, and monitor from your terminal.' },
              { icon: Code2, title: 'API First', description: 'RESTful API for everything. Integrate Opendrap into your existing workflows.' },
              { icon: PackageCheck, title: 'Open Ecosystem', description: 'Extend with plugins, webhooks, and custom actions. Full TypeScript support.' }
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-violet-500/20 transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 sm:mb-5">
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemVariants} className="max-w-[700px] mx-auto">
            <div className="bg-black rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
                <span className="text-[11px] sm:text-sm text-gray-600 font-mono ml-2 sm:ml-3">terminal</span>
              </div>
              <div className="p-4 sm:p-6 font-mono text-[11px] sm:text-sm space-y-2 sm:space-y-3 overflow-x-auto">
                <div className="whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-gray-500"># List your projects via API</span></div>
                <div className="whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-white">curl https://opendrap-api.tert.workers.dev/api/projects \</span></div>
                <div className="whitespace-nowrap pl-4"><span className="text-white">-H "Authorization: Bearer $token"</span></div>
                <div className="pt-1 sm:pt-2 whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-gray-500"># Trigger a deployment</span></div>
                <div className="whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-white">curl -X POST https://opendrap-api.tert.workers.dev/api/deployments \</span></div>
                <div className="whitespace-nowrap pl-4"><span className="text-white">-H "Authorization: Bearer $token" \</span></div>
                <div className="whitespace-nowrap pl-4"><span className="text-white">{`-d '{"project_id": "my-app"}'`}</span></div>
                <div className="pt-1 sm:pt-2 whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-gray-500"># Run AI-powered tests</span></div>
                <div className="whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-white">curl -X POST https://opendrap-api.tert.workers.dev/api/tests \</span></div>
                <div className="whitespace-nowrap pl-4"><span className="text-white">-H "Authorization: Bearer $token" \</span></div>
                <div className="whitespace-nowrap pl-4"><span className="text-white">{`-d '{"type": "ai", "project_id": "my-app"}'`}</span></div>
                <div className="pt-1 sm:pt-2 whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-gray-500"># View deployment logs</span></div>
                <div className="whitespace-nowrap"><span className="text-green-500">$ </span><span className="text-white">curl https://opendrap-api.tert.workers.dev/api/logs?deployment_id=abc123 \</span></div>
                <div className="whitespace-nowrap pl-4"><span className="text-white">-H "Authorization: Bearer $token"</span></div>
              </div>
            </div>
          </motion.div>
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
              {
                name: 'Free', price: '$0', period: '/month', popular: false,
                features: ['1 project', 'Basic monitoring', 'Community support'],
                cta: 'Get started free', to: '/register',
                variant: 'ghost'
              },
              {
                name: 'Pro', price: '$29', period: '/month', popular: true,
                features: ['Unlimited projects', '10 team members', 'Unlimited AI tests', 'Advanced monitoring', 'Priority support', 'Custom domains'],
                cta: 'Start Pro trial', to: '/register',
                variant: 'primary'
              },
              {
                name: 'Enterprise', price: 'Custom', period: '', popular: false,
                features: ['Everything in Pro', 'Unlimited team members', 'Dedicated support', 'SSO/SAML', 'Audit logs', 'SLA guarantee'],
                cta: 'Contact sales', to: '#',
                variant: 'ghost'
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative p-6 sm:p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-white/10 border border-violet-500/30'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap">
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
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
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
                    className={`w-full py-2.5 sm:py-3 rounded-xl font-semibold transition-all flex items-center justify-center text-sm sm:text-base ${
                      plan.popular
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Built With */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-white/[0.02]"
      >
        <div className="max-w-[1400px] mx-auto">
          <motion.p variants={itemVariants} className="text-center text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
            Built with modern tools you already love
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-12 opacity-50">
            {['React', 'TypeScript', 'Node.js', 'Cloudflare', 'Docker', 'GitHub'].map((tool) => (
              <div key={tool} className="text-lg sm:text-2xl font-bold text-gray-400">{tool}</div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-pink-500/5" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[100px]" />
        <div className="max-w-[800px] mx-auto text-center relative">
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-4">
            Ready to simplify your DevOps?
          </motion.h2>
          <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 px-4">
            Join the waitlist or deploy your first project — no credit card required.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all text-sm sm:text-base shadow-lg shadow-white/10 hover:shadow-white/20"
            >
              Deploy your first app
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-12 mb-10 sm:mb-12">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
                  <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm sm:text-base text-white">Opendrap</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">DevOps AI Platform</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4 sm:mb-6 max-w-[300px]">
                Automate your pipeline, deploy with confidence, monitor with AI.
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Docs'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Status'] }
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

          <div className="pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
            <p>© 2024 Opendrap, Inc. All rights reserved.</p>
            <p>Built with ❤️ for developers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
