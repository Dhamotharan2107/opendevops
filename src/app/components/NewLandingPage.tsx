import { Link } from 'react-router';
import {
  ArrowRight, Check, Zap, Shield, Globe, GitBranch, Terminal,
  Cloud, Lock, Gauge, PackageCheck, Workflow, Bot, Database,
  Code2, BarChart3, Users, TrendingUp, Star, Github, Twitter
} from 'lucide-react';

export function NewLandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Cloud className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base text-white leading-none">Opendrap</span>
                <span className="text-[10px] text-gray-500 leading-none mt-0.5">DevOps Platform</span>
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full p-1">
              {['Platform', 'Solutions', 'Developers', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all flex items-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-8 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/30 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-[120px]" />

        <div className="max-w-[1400px] mx-auto relative">
          {/* Announcement Badge */}
          <div className="flex justify-center mb-8">
            <a href="#" className="group inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Announcing $10M Series A funding</span>
              <ArrowRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-[900px] mx-auto mb-16">
            <h1 className="text-[64px] leading-[1.1] font-bold mb-6 tracking-tight">
              Ship faster with
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                AI-powered DevOps
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-[600px] mx-auto leading-relaxed">
              Deploy, test, and monitor applications in minutes. Trusted by 10,000+ developers at companies like Shopify, Stripe, and Notion.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register" className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-2 text-base">
                Start building free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2 text-base">
                <Terminal className="w-5 h-5" />
                View demo
              </Link>
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-12 mb-16 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border-2 border-[#0A0A0F]" />
                ))}
              </div>
              <span>10,000+ developers</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span>4.9/5 rating on G2</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>SOC 2 Type II certified</span>
            </div>
          </div>

          {/* Hero Image - Terminal/Dashboard Preview */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative border border-white/10 rounded-2xl bg-[#0F0F14] p-1 shadow-2xl">
              <div className="rounded-xl bg-gradient-to-b from-[#1A1A24] to-[#0F0F14] overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-sm text-gray-500 font-mono">opendrap-deploy</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">Deployed</span>
                  </div>
                </div>

                {/* Terminal Content */}
                <div className="p-6 font-mono text-sm space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">$</span>
                    <span className="text-violet-400">opendrap deploy</span>
                  </div>
                  <div className="text-gray-500 pl-6">⚡ Analyzing repository...</div>
                  <div className="flex items-center gap-2 pl-6">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-400">Dependencies installed (2.3s)</span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-400">Build completed (8.1s)</span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-400">AI tests passed (15 checks)</span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-400">Deployed to production</span>
                  </div>
                  <div className="pl-6 text-violet-400 flex items-center gap-2 mt-4">
                    <Globe className="w-4 h-4" />
                    <span>https://your-app.opendrap.app</span>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-4 gap-px bg-white/5 border-t border-white/5">
                  {[
                    { label: 'Deploy Time', value: '12.4s', icon: Zap, color: 'text-yellow-400' },
                    { label: 'Response Time', value: '42ms', icon: Gauge, color: 'text-green-400' },
                    { label: 'Success Rate', value: '99.9%', icon: TrendingUp, color: 'text-blue-400' },
                    { label: 'AI Tests', value: '15/15', icon: Bot, color: 'text-violet-400' }
                  ].map((metric, i) => (
                    <div key={i} className="bg-[#0F0F14] px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <metric.icon className={`w-3 h-3 ${metric.color}`} />
                        <span className="text-xs text-gray-500">{metric.label}</span>
                      </div>
                      <div className="text-base font-semibold text-white">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="py-16 px-8 border-y border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-center text-sm text-gray-500 mb-8">Trusted by teams at</p>
          <div className="flex items-center justify-center gap-12 opacity-50">
            {['Shopify', 'Stripe', 'Notion', 'GitHub', 'Vercel', 'Linear'].map((company) => (
              <div key={company} className="text-2xl font-bold text-gray-400">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-8" id="platform">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Platform</span>
            </div>
            <h2 className="text-5xl font-bold mb-6">Everything you need to ship</h2>
            <p className="text-xl text-gray-400 max-w-[600px] mx-auto">
              A complete DevOps platform with deployment, testing, monitoring, and collaboration tools built in.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
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
              <div
                key={i}
                className="group relative p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-4 gap-12">
            {[
              { value: '10,000+', label: 'Active Developers' },
              { value: '500K+', label: 'Deployments/Month' },
              { value: '99.99%', label: 'Uptime SLA' },
              { value: '42ms', label: 'Avg. Response Time' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-32 px-8" id="solutions">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Solutions</span>
            </div>
            <h2 className="text-5xl font-bold mb-6">Built for every workflow</h2>
            <p className="text-xl text-gray-400 max-w-[600px] mx-auto">
              From indie developers to enterprise teams, Opendrap scales with your needs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: Zap, title: 'Startup Launchpad', description: 'Deploy your MVP in minutes. Built-in hosting, CI/CD, and monitoring.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Shield, title: 'Enterprise Suite', description: 'SOC 2 compliant with RBAC, audit logs, and dedicated support.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Users, title: 'Agency Platform', description: 'Manage multiple client projects with team collaboration and white-label options.', gradient: 'from-violet-500 to-purple-500' },
              { icon: Code2, title: 'Open Source', description: 'Free for public repositories. Community templates and plugins.', gradient: 'from-orange-500 to-red-500' }
            ].map((item, i) => (
              <div key={i} className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developers Section */}
      <section className="py-32 px-8 bg-white/[0.02]" id="developers">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <Code2 className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Developers</span>
            </div>
            <h2 className="text-5xl font-bold mb-6">Built for developers, by developers</h2>
            <p className="text-xl text-gray-400 max-w-[600px] mx-auto">
              Everything you need to ship fast, from CLI to API
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-16">
            {[
              { icon: Terminal, title: 'CLI & Agent', description: 'Install with one command. Deploy, test, and monitor from your terminal.' },
              { icon: Code2, title: 'API First', description: 'RESTful API for everything. Integrate Opendrap into your existing workflows.' },
              { icon: PackageCheck, title: 'Open Ecosystem', description: 'Extend with plugins, webhooks, and custom actions. Full TypeScript support.' }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Terminal Preview */}
          <div className="max-w-[700px] mx-auto">
            <div className="bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-sm text-gray-600 font-mono ml-3">terminal</span>
              </div>
              <div className="p-6 font-mono text-sm space-y-3">
                <div><span className="text-green-500">$ </span><span className="text-gray-500"># Install the Opendrap agent</span></div>
                <div><span className="text-green-500">$ </span><span className="text-white">curl -fsSL https://opendrap.dev/install.sh | bash</span></div>
                <div className="pt-2"><span className="text-green-500">$ </span><span className="text-gray-500"># Deploy your project</span></div>
                <div><span className="text-green-500">$ </span><span className="text-white">opendrap deploy --project my-app</span></div>
                <div className="pt-2"><span className="text-green-500">$ </span><span className="text-gray-500"># Run AI tests</span></div>
                <div><span className="text-green-500">$ </span><span className="text-white">opendrap test --ai</span></div>
                <div className="pt-2"><span className="text-green-500">$ </span><span className="text-gray-500"># View real-time logs</span></div>
                <div><span className="text-green-500">$ </span><span className="text-white">opendrap logs --follow</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-8" id="pricing">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <Star className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Pricing</span>
            </div>
            <h2 className="text-5xl font-bold mb-6">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-400 max-w-[600px] mx-auto">
              Start free, upgrade when you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-[1100px] mx-auto">
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-2xl font-bold mb-1">Free</h3>
              <div className="text-4xl font-bold mb-8">$0<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-10">
                {['1 project', 'Basic monitoring', 'Community support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /><span>{f}</span></li>
                ))}
              </ul>
              <Link to="/register" className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center">Get started free</Link>
            </div>

            <div className="relative p-8 bg-white/10 border border-violet-500/30 rounded-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-xs font-semibold">Popular</div>
              <h3 className="text-2xl font-bold mb-1">Pro</h3>
              <div className="text-4xl font-bold mb-8">$29<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-10">
                {['Unlimited projects', '10 team members', 'Unlimited AI tests', 'Advanced monitoring', 'Priority support', 'Custom domains'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /><span>{f}</span></li>
                ))}
              </ul>
              <Link to="/register" className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center">Start Pro trial</Link>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-2xl font-bold mb-1">Enterprise</h3>
              <div className="text-4xl font-bold mb-8">Custom</div>
              <ul className="space-y-3 mb-10">
                {['Everything in Pro', 'Unlimited team members', 'Dedicated support', 'SSO/SAML', 'Audit logs', 'SLA guarantee'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /><span>{f}</span></li>
                ))}
              </ul>
              <button className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all">Contact sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">Start shipping today</h2>
          <p className="text-xl text-gray-400 mb-10">
            Join 10,000+ developers building the future with Opendrap.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all text-base"
          >
            Get started for free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-5 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">Opendrap</span>
                  <span className="text-xs text-gray-500">DevOps Platform</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                The modern DevOps platform for teams that ship fast.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Docs'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Status'] }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4 text-sm">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => {
                    const href = link === 'Docs' ? '/docs' : '#';
                    return (
                      <li key={link}>
                        {link === 'Docs' ? (
                          <Link to={href} className="text-sm text-gray-500 hover:text-white transition-colors">
                            {link}
                          </Link>
                        ) : (
                          <a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">
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

          <div className="pt-8 border-t border-white/5 flex items-center justify-between text-sm text-gray-500">
            <p>© 2024 Opendrap, Inc. All rights reserved.</p>
            <p>Made with ❤️ for developers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
