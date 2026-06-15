import { Link } from 'react-router';
import {
  Rocket, Terminal, Globe, Brain, AlertCircle, FileCode,
  GitBranch, Zap, Shield, BarChart3, Check, ArrowRight,
  Play, Users, TrendingUp, Clock, Activity, CheckCircle2,
  ScrollText, Sparkles, FolderGit2, Code2, Server, Cloud,
  Lock, Gauge, PackageCheck, Workflow, Bot, Database
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-all duration-300">
                  <Cloud className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base text-white leading-none">Opendrap</span>
                <span className="text-[10px] text-gray-400 leading-none mt-0.5">DevOps Platform</span>
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full p-1">
              {[
                { label: 'Platform', href: '#platform' },
                { label: 'Solutions', href: '#solutions' },
                { label: 'Developers', href: '#developers' },
                { label: 'Pricing', href: '#pricing' }
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Deploy, Test & Debug Applications in Minutes
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Connect your Git repository, launch your application, generate a public URL,
              monitor logs, run AI-powered testing, and share with clients from one platform.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="px-8 py-4 border border-border rounded-lg font-medium hover:bg-accent transition-colors flex items-center gap-2">
                <Play className="w-4 h-4" /> Watch Demo
              </button>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="relative group">
            {/* Animated gradient orbs */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000" />

            <div className="relative border border-purple-500/30 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-1 shadow-2xl shadow-purple-500/10">
              <div className="border border-border/30 rounded-3xl bg-gradient-to-br from-background/95 to-background/80 p-8">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Terminal Window */}
                  <div className="col-span-2 border border-green-500/30 rounded-xl bg-black/90 backdrop-blur-sm overflow-hidden shadow-xl shadow-green-500/5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-950/50 to-emerald-950/50 border-b border-green-500/20">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      </div>
                      <Terminal className="w-3 h-3 text-green-500 ml-2" />
                      <span className="text-xs text-green-400/80">terminal</span>
                    </div>
                    <div className="p-4 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">$</span>
                        <span className="text-gray-400">npm run deploy</span>
                      </div>
                      <div className="text-blue-400">→ Building application...</div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                        </div>
                        <span className="text-gray-500 text-xs">75%</span>
                      </div>
                      <div className="text-green-400">✓ Build complete</div>
                      <div className="text-purple-400">→ Deploying to production...</div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-gray-500">Uploading assets</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="border border-purple-500/30 rounded-xl bg-gradient-to-br from-purple-950/40 to-purple-900/20 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Deployment</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-500">Live</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Health</span>
                        <span className="text-xs font-medium">100%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Response</span>
                        <span className="text-xs font-medium text-green-500">42ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* AI Testing */}
                  <div className="border border-blue-500/30 rounded-xl bg-gradient-to-br from-blue-950/40 to-cyan-900/20 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">AI Testing</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Homepage', status: 'pass' },
                        { label: 'Login Flow', status: 'pass' },
                        { label: 'Checkout', status: 'warning' }
                      ].map((test, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {test.status === 'pass' ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                          )}
                          <span className="text-xs text-muted-foreground">{test.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Public URL */}
                  <div className="border border-cyan-500/30 rounded-xl bg-gradient-to-br from-cyan-950/40 to-blue-900/20 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">Public URL</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                        app-xyz.dev
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span>Cloudflare Edge</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="border border-emerald-500/30 rounded-xl bg-gradient-to-br from-emerald-950/40 to-green-900/20 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">Analytics</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Requests</span>
                        <span className="text-xs font-medium text-emerald-500">1.2k</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Errors</span>
                        <span className="text-xs font-medium">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 border-y border-border/50 bg-gradient-to-b from-background to-accent/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-4 gap-8">
            {[
              {
                icon: Rocket,
                label: 'Deployments',
                value: '1000+',
                gradient: 'from-purple-500 to-purple-600',
                description: 'Successful deployments'
              },
              {
                icon: Users,
                label: 'Developers',
                value: '500+',
                gradient: 'from-blue-500 to-blue-600',
                description: 'Active developers'
              },
              {
                icon: TrendingUp,
                label: 'Uptime',
                value: '99.9%',
                gradient: 'from-green-500 to-green-600',
                description: 'Service reliability'
              },
              {
                icon: Brain,
                label: 'AI Tests',
                value: '10000+',
                gradient: 'from-pink-500 to-pink-600',
                description: 'Tests executed'
              }
            ].map((stat, i) => (
              <div key={i} className="group text-center p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="relative inline-block mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                    <stat.icon className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
                </div>
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-base font-medium mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              Deploy, test, monitor, and debug from a single platform
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'One Click Deployment',
                description: 'Deploy GitHub repositories instantly with auto-scaling infrastructure.',
                gradient: 'from-yellow-500 via-orange-500 to-red-500',
                glow: 'group-hover:shadow-yellow-500/20',
                border: 'border-yellow-500/20',
                iconBg: 'from-yellow-500 to-orange-600'
              },
              {
                icon: Terminal,
                title: 'Browser Terminal',
                description: 'Full-featured terminal with command history and autocomplete.',
                gradient: 'from-green-500 via-emerald-500 to-teal-500',
                glow: 'group-hover:shadow-green-500/20',
                border: 'border-green-500/20',
                iconBg: 'from-green-500 to-emerald-600'
              },
              {
                icon: Globe,
                title: 'Public URL Generator',
                description: 'Cloudflare-powered URLs with SSL and global CDN distribution.',
                gradient: 'from-blue-500 via-cyan-500 to-teal-500',
                glow: 'group-hover:shadow-blue-500/20',
                border: 'border-blue-500/20',
                iconBg: 'from-blue-500 to-cyan-600'
              },
              {
                icon: Brain,
                title: 'AI Testing Agent',
                description: 'Playwright-powered testing that thinks like a real user.',
                gradient: 'from-purple-500 via-pink-500 to-rose-500',
                glow: 'group-hover:shadow-purple-500/20',
                border: 'border-purple-500/20',
                iconBg: 'from-purple-500 to-pink-600'
              },
              {
                icon: AlertCircle,
                title: 'Error Monitoring',
                description: 'Real-time exception tracking with stack traces and context.',
                gradient: 'from-red-500 via-rose-500 to-pink-500',
                glow: 'group-hover:shadow-red-500/20',
                border: 'border-red-500/20',
                iconBg: 'from-red-500 to-rose-600'
              },
              {
                icon: FileCode,
                title: 'API Testing Lab',
                description: 'Postman-style API explorer with collections and environments.',
                gradient: 'from-indigo-500 via-purple-500 to-pink-500',
                glow: 'group-hover:shadow-indigo-500/20',
                border: 'border-indigo-500/20',
                iconBg: 'from-indigo-500 to-purple-600'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className={`group relative border ${feature.border} rounded-2xl p-8 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl hover:from-card/70 hover:to-card/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${feature.glow} hover:-translate-y-1`}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-all duration-500`} />

                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-gradient-to-br ${feature.gradient}`} style={{ zIndex: -1 }} />

                <div className="relative">
                  {/* Icon with animated gradient */}
                  <div className="mb-6 relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                      <feature.icon className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                    <div className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.iconBg} blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
                  </div>

                  <h3 className="text-lg font-semibold mb-3 group-hover:text-white transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-2">
                    <span className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                      Learn more
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-b from-background via-accent/20 to-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500 rounded-full filter blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Rocket className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-300">Simple Process</span>
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From code to production in 7 simple steps
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-20" />

            <div className="grid grid-cols-7 gap-6">
              {[
                { step: '1', title: 'Create Project', icon: FolderGit2, gradient: 'from-purple-500 to-purple-600' },
                { step: '2', title: 'Install Agent', icon: Terminal, gradient: 'from-blue-500 to-blue-600' },
                { step: '3', title: 'Connect Git', icon: GitBranch, gradient: 'from-cyan-500 to-cyan-600' },
                { step: '4', title: 'Deploy App', icon: Rocket, gradient: 'from-green-500 to-green-600' },
                { step: '5', title: 'Generate URL', icon: Globe, gradient: 'from-yellow-500 to-yellow-600' },
                { step: '6', title: 'Run AI Tests', icon: Brain, gradient: 'from-pink-500 to-pink-600' },
                { step: '7', title: 'Monitor Logs', icon: BarChart3, gradient: 'from-orange-500 to-orange-600' }
              ].map((item, i) => (
                <div key={i} className="relative group">
                  <div className="text-center">
                    {/* Step circle with icon */}
                    <div className="relative inline-block mb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 relative z-10`}>
                        <item.icon className="w-7 h-7 text-white" strokeWidth={2} />
                      </div>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />

                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-2 border-purple-500 flex items-center justify-center text-xs font-bold z-20">
                        {item.step}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-sm font-semibold mb-2 group-hover:text-white transition-colors">
                      {item.title}
                    </div>

                    {/* Connecting arrow */}
                    {i < 6 && (
                      <div className="absolute top-8 left-[60%] w-full h-0.5 hidden md:block">
                        <ArrowRight className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
                      </div>
                    )}
                  </div>

                  {/* Hover card */}
                  <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 p-4 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
                    <p className="text-xs text-muted-foreground text-center">
                      {i === 0 && 'Initialize a new project in seconds'}
                      {i === 1 && 'Run our CLI agent for deployment'}
                      {i === 2 && 'Link your GitHub repository'}
                      {i === 3 && 'Deploy with one command'}
                      {i === 4 && 'Get a public preview URL instantly'}
                      {i === 5 && 'AI tests your app automatically'}
                      {i === 6 && 'Track logs and performance metrics'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              Start Your First Project
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI Testing Showcase */}
      <section id="ai-testing" className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-purple-300">Powered by AI</span>
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              AI-Powered Testing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Let AI test your application like a real user with intelligent automation
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 items-center">
            {/* Browser mockup with AI testing */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

              <div className="relative border border-purple-500/30 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-1 shadow-2xl">
                <div className="border border-border/30 rounded-3xl bg-black/90 overflow-hidden">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-950/50 to-blue-950/50 border-b border-purple-500/20">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4 px-4 py-1.5 bg-background/50 rounded-lg text-xs font-mono text-muted-foreground flex items-center gap-2">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span>example.com</span>
                    </div>
                  </div>

                  {/* Browser content with AI overlay */}
                  <div className="relative p-8 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
                    {/* Simulated webpage */}
                    <div className="space-y-4">
                      <div className="h-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded w-1/2" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded border border-purple-500/20" />
                        <div className="h-24 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded border border-blue-500/20" />
                      </div>
                      <div className="h-6 bg-gradient-to-r from-green-500/20 to-green-500/10 rounded w-1/3" />
                    </div>

                    {/* AI cursor indicator */}
                    <div className="absolute top-16 right-16 flex items-center gap-2 px-3 py-2 bg-purple-500 rounded-lg shadow-lg animate-pulse">
                      <Brain className="w-4 h-4 text-white" />
                      <span className="text-xs text-white font-medium">AI Testing...</span>
                    </div>

                    {/* AI action highlights */}
                    <div className="absolute bottom-8 left-8 right-8 space-y-2">
                      {[
                        { action: 'Click detected', status: 'success', delay: '0s' },
                        { action: 'Form validation passed', status: 'success', delay: '0.5s' },
                        { action: 'Navigation successful', status: 'success', delay: '1s' }
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-green-500/30 animate-pulse"
                          style={{ animationDelay: item.delay }}
                        >
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-400 font-mono">{item.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Actions list */}
            <div className="space-y-4">
              <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                AI Agent Actions
              </h3>
              {[
                { icon: Globe, action: 'Open Website', desc: 'Navigate to target URL', color: 'from-blue-500 to-cyan-500' },
                { icon: GitBranch, action: 'Click Login', desc: 'Locate and interact with elements', color: 'from-purple-500 to-pink-500' },
                { icon: FileCode, action: 'Fill Forms', desc: 'Input realistic test data', color: 'from-green-500 to-emerald-500' },
                { icon: CheckCircle2, action: 'Validate Responses', desc: 'Verify expected behavior', color: 'from-yellow-500 to-orange-500' },
                { icon: AlertCircle, action: 'Detect Errors', desc: 'Identify bugs and issues', color: 'from-red-500 to-rose-500' },
                { icon: ScrollText, action: 'Generate Bug Report', desc: 'Create detailed documentation', color: 'from-indigo-500 to-purple-500' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-4 p-4 border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                    <item.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1 group-hover:text-white transition-colors">
                      {item.action}
                    </div>
                    <div className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      {item.desc}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-300">Simple & Transparent</span>
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Simple Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {[
              {
                name: 'Free',
                price: '₹0',
                period: '/month',
                projects: '1 Project',
                features: ['1 Project', 'Basic Monitoring', 'Community Support'],
                gradient: 'from-gray-500 to-gray-600'
              },
              {
                name: 'Starter',
                price: '₹99',
                period: '/month',
                projects: '5 Projects',
                features: ['10 GB Storage', 'Email Support', 'Advanced Analytics', 'Custom Domain'],
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                name: 'Pro',
                price: '₹299',
                period: '/month',
                projects: '20 Projects',
                popular: true,
                features: ['100 GB Storage', 'Priority Support', 'AI Testing Credits', 'Team Collaboration', 'SSO'],
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                name: 'Team',
                price: '₹999',
                period: '/month',
                projects: 'Unlimited',
                features: ['Unlimited Storage', '24/7 Phone Support', 'Unlimited AI Tests', 'Advanced Security', 'SLA'],
                gradient: 'from-orange-500 to-red-500'
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`group relative border rounded-2xl p-8 backdrop-blur-xl transition-all duration-500 hover:scale-105 ${
                  plan.popular
                    ? 'border-purple-500/50 bg-gradient-to-b from-purple-500/20 to-card/50 shadow-2xl shadow-purple-500/20'
                    : 'border-border/50 bg-card/30 hover:bg-card/50 hover:shadow-xl hover:shadow-purple-500/10'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-semibold text-white shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                {/* Glow effect for popular plan */}
                {plan.popular && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-xl" style={{ zIndex: -1 }} />
                )}

                <div className="text-center mb-8">
                  {/* Plan icon */}
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                    <Rocket className="w-7 h-7 text-white" />
                  </div>

                  <div className="text-2xl font-bold mb-3">{plan.name}</div>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">{plan.projects}</div>
                </div>

                {/* Features list */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  to="/dashboard"
                  className={`block w-full py-3.5 rounded-xl text-center font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105'
                      : 'border-2 border-border hover:bg-accent hover:border-purple-500/50'
                  }`}
                >
                  Get Started
                  <ArrowRight className="inline-block w-4 h-4 ml-2" />
                </Link>
              </div>
            ))}
          </div>

          {/* Additional info */}
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              All plans include SSL certificates, automatic backups, and 99.9% uptime SLA
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-gradient-to-b from-background to-accent/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="grid grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <Rocket className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                </div>
                <div>
                  <div className="font-bold text-xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Opendrap
                  </div>
                  <div className="text-xs text-muted-foreground">DevOps AI Platform</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Deploy, test, and monitor applications with AI-powered automation. Built for developers who ship fast.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { icon: GitBranch, href: '#' },
                  { icon: Terminal, href: '#' },
                  { icon: Globe, href: '#' }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-card/50 border border-border/50 flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-600 hover:border-transparent transition-all duration-300 group/social"
                  >
                    <social.icon className="w-5 h-5 text-muted-foreground group-hover/social:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: 'Product',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'AI Testing', href: '#ai-testing' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Documentation', href: '/docs' }
                ]
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'Careers', href: '#' },
                  { label: 'Contact', href: '#' }
                ]
              },
              {
                title: 'Legal',
                links: [
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'Security', href: '#' },
                  { label: 'Compliance', href: '#' }
                ]
              }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-6 text-sm uppercase tracking-wider">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group/link"
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover/link:opacity-100 group-hover/link:ml-0 transition-all" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 Opendrap DevOps AI. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Status</a>
              <a href="#" className="hover:text-foreground transition-colors">Changelog</a>
              <a href="#" className="hover:text-foreground transition-colors">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
