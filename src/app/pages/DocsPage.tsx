import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Book, Search, ChevronDown, ChevronRight, Check, Info,
  Terminal, Code, Rocket, Bot, Globe, Users, Settings,
  Shield, MessageSquare, Bug, BarChart3, FileCode, Activity,
  GitBranch, FolderKanban, Play, Network, CreditCard,
  User, Building2, ExternalLink, Menu, Bell
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon?: typeof Book;
}

interface DocGroup {
  title: string;
  icon: typeof Book;
  sections: DocSection[];
}

const docGroups: DocGroup[] = [
  {
    title: 'Getting Started',
    icon: Book,
    sections: [
      { id: 'introduction', title: 'Introduction', icon: Info },
      { id: 'quick-start', title: 'Quick Start', icon: Rocket },
      { id: 'installation', title: 'Installation', icon: Terminal },
    ],
  },
  {
    title: 'Platform',
    icon: Globe,
    sections: [
      { id: 'projects', title: 'Projects', icon: FolderKanban },
      { id: 'deployments', title: 'Deployments', icon: Rocket },
      { id: 'terminal', title: 'Terminal', icon: Terminal },
      { id: 'logs-errors', title: 'Logs & Errors', icon: Bug },
    ],
  },
  {
    title: 'AI & Testing',
    icon: Bot,
    sections: [
      { id: 'ai-testing', title: 'AI Testing', icon: Bot },
      { id: 'bug-analysis', title: 'Bug Analysis', icon: Bug },
      { id: 'api-lab', title: 'API Lab', icon: Code },
    ],
  },
  {
    title: 'Collaboration',
    icon: Users,
    sections: [
      { id: 'chat', title: 'Chat', icon: MessageSquare },
      { id: 'tasks', title: 'Tasks', icon: FileCode },
      { id: 'connections', title: 'Connections', icon: Network },
      { id: 'companies', title: 'Companies', icon: Building2 },
    ],
  },
  {
    title: 'Account',
    icon: User,
    sections: [
      { id: 'profile', title: 'Profile', icon: User },
      { id: 'settings', title: 'Settings', icon: Settings },
      { id: 'billing', title: 'Billing', icon: CreditCard },
    ],
  },
];

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function CodeBlock({ children }: { children: string }) {
  const parts = children.split(/(?=\$ )/);
  return (
    <div className="bg-black rounded-xl border border-white/10 font-mono text-sm overflow-x-auto shadow-lg">
      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-gray-600">terminal</span>
      </div>
      <div className="p-4 space-y-1.5">
        {parts.map((part, i) => {
          if (part.startsWith('$ ')) {
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-emerald-400 select-none">$</span>
                <span className="text-gray-100">{part.slice(2)}</span>
              </div>
            );
          }
          if (part.startsWith('#')) {
            return <div key={i} className="text-gray-500 italic">{part}</div>;
          }
          return <div key={i} className="text-gray-400">{part}</div>;
        })}
      </div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
      <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Bot; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="group bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] hover:border-violet-500/30 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-3 shadow-lg shadow-violet-500/20">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  );
}

function StepCard({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] hover:border-violet-500/20 transition-all duration-300"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold mb-1">{title}</h4>
        <div className="text-sm text-gray-400">{children}</div>
      </div>
    </motion.div>
  );
}

function FolderTree({ items, depth = 0 }: { items: { name: string; children?: { name: string; children?: { name: string }[] }[] }[]; depth?: number }) {
  return (
    <div className="font-mono text-sm space-y-1">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
            {depth > 0 && <div className="w-4 h-px bg-white/10" />}
            <FolderKanban className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="text-gray-300">{item.name}</span>
          </div>
          {item.children && item.children.map((child, j) => (
            <div key={j}>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${(depth + 1) * 20}px` }}>
                <div className="w-4 h-px bg-white/10" />
                <FolderKanban className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-gray-300">{child.name}</span>
              </div>
              {child.children && child.children.map((leaf, k) => (
                <div className="flex items-center gap-2" style={{ paddingLeft: `${(depth + 2) * 20}px` }} key={k}>
                  <div className="w-4 h-px bg-white/10" />
                  <FileCode className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="text-gray-400">{leaf.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const sectionContent: Record<string, { title: string; description: string; content: React.ReactNode }> = {
  'introduction': {
    title: 'Introduction',
    description: 'Welcome to Opendrap DevOps AI',
    content: (
      <div className="space-y-8">
        <p className="text-gray-300 leading-relaxed text-lg">
          Opendrap is a unified developer ecosystem combining deployment, testing, monitoring, and collaboration in one AI-powered platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureCard icon={Bot} title="AI-Powered Testing" description="Let AI test your app like a real user with Playwright-powered automation that understands your UI." />
          <FeatureCard icon={Rocket} title="One-Click Deploys" description="Deploy from any Git repository with auto-scaling, SSL, and global CDN distribution." />
          <FeatureCard icon={Activity} title="Real-Time Monitoring" description="Track logs, errors, and performance metrics with instant alerts and AI-driven insights." />
          <FeatureCard icon={Users} title="Team Collaboration" description="Chat, share tasks, and manage projects together with built-in collaboration tools." />
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Quick Install</h3>
          <CodeBlock>{'$ # See https://opendrap-api.tert.workers.dev/api for API docs'}</CodeBlock>
        </div>

        <Callout>
          Opendrap works with any language or framework. Deploy Node.js, Python, Go, Rust, and more with zero configuration.
        </Callout>
      </div>
    ),
  },
  'quick-start': {
    title: 'Quick Start',
    description: 'Get your first project live in minutes',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Follow these steps to go from zero to your first deployed application.
        </p>
        <div className="space-y-3">
          <StepCard number="1" title="Create an Account">
            <p>Sign up at{' '}
              <a href="/register" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">opendrap-api.tert.workers.dev</a>
              {' '}with your email or GitHub account. No credit card required.</p>
          </StepCard>
          <StepCard number="2" title="Connect GitHub">
            <p>Link your GitHub account to import repositories. Opendrap will request read access to your public and private repos.</p>
          </StepCard>
          <StepCard number="3" title="Install the Agent">
            <p>Run the install script to set up the Opendrap CLI agent on your machine:</p>
            <div className="mt-2">
              <CodeBlock>{'$ # See https://opendrap-api.tert.workers.dev/api for API docs'}</CodeBlock>
            </div>
          </StepCard>
          <StepCard number="4" title="Create a Project">
            <p>From the dashboard, click "New Project". Select a repository from your connected GitHub account.</p>
          </StepCard>
          <StepCard number="5" title="Deploy">
            <p>Configure your build settings and hit deploy. Opendrap will build, optimize, and deploy your app.</p>
          </StepCard>
          <StepCard number="6" title="Run AI Tests">
            <p>Navigate to the AI Testing tab and let Opendrap automatically explore your app, click through flows, and generate a comprehensive test report.</p>
          </StepCard>
        </div>

        <Callout>
          Your first deployment typically takes under 2 minutes. AI testing runs in the background and results appear as they complete.
        </Callout>
      </div>
    ),
  },
  'installation': {
    title: 'Installation',
    description: 'Set up the Opendrap CLI on your machine',
    content: (
      <div className="space-y-8">
        <p className="text-gray-300 leading-relaxed">
          The Opendrap agent is a lightweight CLI tool that connects your local environment to the platform.
        </p>

        <div>
          <h3 className="text-white font-semibold mb-3">System Requirements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Terminal, name: 'Python', version: '3.9+' },
              { icon: Code, name: 'Node.js', version: '18+' },
              { icon: GitBranch, name: 'Git', version: '2.30+' },
            ].map((req) => (
              <div key={req.name} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                  <req.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{req.name}</div>
                  <div className="text-xs text-gray-500">{req.version}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Install via curl</h3>
          <CodeBlock>
            {`$ # Download and run the install script
$ # See https://opendrap-api.tert.workers.dev/api for API docs

$ # Verify installation
$ opendrap --version
# Opendrap CLI v1.0.0`}
          </CodeBlock>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Install via npm</h3>
          <CodeBlock>
            {`$ # Install globally with npm
$ npm install -g @opendrap/cli

$ # Verify installation
$ opendrap --help`}
          </CodeBlock>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Project Structure</h3>
          <p className="text-sm text-gray-400 mb-4">After initializing, your project will follow this structure:</p>
          <div className="bg-black border border-white/10 rounded-xl p-5">
            <FolderTree items={[
              { name: 'my-project', children: [
                { name: '.opendrap', children: [
                  { name: 'config.yml' },
                  { name: 'deploy.yml' },
                  { name: 'tests/' },
                ]},
                { name: 'src', children: [
                  { name: 'components/' },
                  { name: 'pages/' },
                ]},
                { name: 'opendrap.json' },
              ]},
            ]} />
          </div>
        </div>

        <Callout>
          The agent runs in the background and automatically syncs your local changes to the platform. No manual uploads needed.
        </Callout>
      </div>
    ),
  },
  'projects': {
    title: 'Projects',
    description: 'Organize your work into projects',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Projects are the core organizational unit in Opendrap. Each project contains deployments, tests, team members, and configuration.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Creating a Project</h3>
          <ul className="space-y-2">
            {[
              'Click "New Project" from the dashboard sidebar',
              'Connect a GitHub repository or start fresh',
              'Configure build settings, environment variables, and secrets',
              'Set team permissions and visibility',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Managing Members</h3>
          <p className="text-sm text-gray-400 mb-3">
            Invite team members with role-based access control:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { role: 'Admin', perms: 'Full access, billing, delete' },
              { role: 'Developer', perms: 'Deploy, test, view logs' },
              { role: 'Viewer', perms: 'Read-only access' },
            ].map((role) => (
              <div key={role.role} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white font-medium text-sm">{role.role}</div>
                <div className="text-xs text-gray-500 mt-1">{role.perms}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  'deployments': {
    title: 'Deployments',
    description: 'Ship code with confidence',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Opendrap auto-deploys from your connected Git repository. Every push triggers a build and deploy pipeline.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Deployment Flow</h3>
          <div className="space-y-3">
            {[
              { step: 'Build', desc: 'Opendrap runs your build script in a sandboxed environment' },
              { step: 'Test', desc: 'Optional pre-deploy tests run automatically' },
              { step: 'Deploy', desc: 'Artifacts are distributed to edge nodes worldwide' },
              { step: 'Verify', desc: 'Health checks confirm the deployment is live' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{item.step}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Environments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'Preview', desc: 'Auto-generated for PRs and branches' },
              { name: 'Staging', desc: 'Pre-production testing' },
              { name: 'Production', desc: 'Live public deployment' },
            ].map((env) => (
              <div key={env.name} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-white font-medium text-sm">{env.name}</div>
                <div className="text-xs text-gray-500 mt-1">{env.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <Callout>
          Rollbacks are instant. If a deployment fails health checks, Opendrap automatically reverts to the last known good version.
        </Callout>
      </div>
    ),
  },
  'terminal': {
    title: 'Terminal',
    description: 'Browser-based command line',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Access a full-featured terminal directly in your browser. Run commands, view logs, and interact with your deployment in real time.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Common Commands</h3>
          <CodeBlock>
            {`$ # View deployment logs
$ opendrap logs --tail

$ # Run a one-off command
$ opendrap run npm test

$ # Open an interactive shell
$ opendrap shell

$ # View environment variables
$ opendrap env`}
          </CodeBlock>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Features</h3>
          <ul className="space-y-2">
            {[
              'Persistent shell sessions across page refreshes',
              'Command history with search',
              'Tab autocompletion',
              'File system access to your deployment',
              'Multiple concurrent terminal tabs',
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  'logs-errors': {
    title: 'Logs & Errors',
    description: 'Real-time monitoring and debugging',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Opendrap streams logs from your deployment in real time and automatically detects and categorizes errors.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Log Streaming</h3>
          <CodeBlock>
            {`$ # Tail live logs
$ opendrap logs --tail

$ # Filter by severity
$ opendrap logs --level error

$ # Search within logs
$ opendrap logs --search "database timeout"

$ # Export logs
$ opendrap logs --since 24h --format json > logs.json`}
          </CodeBlock>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Error Monitoring</h3>
          <p className="text-sm text-gray-400 mb-3">
            Errors are automatically captured with full stack traces and contextual data:
          </p>
          <ul className="space-y-2">
            {[
              'Real-time error alerts with severity levels',
              'Full stack traces with source maps',
              'Browser and device information for client-side errors',
              'AI-powered root cause analysis suggestions',
              'Integration with Slack, Discord, and email',
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
        <Callout>
          The AI Bug Analyzer can automatically scan error patterns and suggest fixes. Enable it in project settings.
        </Callout>
      </div>
    ),
  },
  'ai-testing': {
    title: 'AI Testing',
    description: 'Automated testing powered by AI',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Opendrap uses Playwright-based AI agents that explore your application like a real user, clicking buttons, filling forms, and reporting issues.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">How It Works</h3>
          <div className="space-y-3">
            {[
              { title: 'Discovery', desc: 'The AI agent crawls your app and maps all pages and interactions' },
              { title: 'Exploration', desc: 'It navigates through flows, fills forms, and triggers actions' },
              { title: 'Validation', desc: 'Expected states are verified against actual behavior' },
              { title: 'Reporting', desc: 'A detailed report with screenshots, logs, and bug reports is generated' },
            ].map((step) => (
              <div key={step.title} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Interpreting Results</h3>
          <ul className="space-y-2">
            {[
              'Pass/Fail status for each test case',
              'Screenshots at each step of the test',
              'Console logs and network request captures',
              'AI-generated bug report with reproduction steps',
              'Performance metrics for page loads and interactions',
            ].map((result, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{result}</span>
              </li>
            ))}
          </ul>
        </div>
        <Callout>
          AI Testing credits are consumed per test run. Free plan includes 100 credits/month. Pro plan includes 1000 credits/month.
        </Callout>
      </div>
    ),
  },
  'bug-analysis': {
    title: 'Bug Analysis',
    description: 'AI-powered debugging and root cause analysis',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          The Bug Analyzer automatically examines error logs, stack traces, and application state to identify the root cause of issues.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Analysis Pipeline</h3>
          <div className="space-y-3">
            {[
              { step: 'Collect', desc: 'Errors are gathered from logs, crash reports, and user reports' },
              { step: 'Analyze', desc: 'AI correlates errors with code changes, deployments, and environment factors' },
              { step: 'Diagnose', desc: 'Root cause is identified with confidence score' },
              { step: 'Suggest', desc: 'Fix recommendations and affected areas are reported' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <BarChart3 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium text-sm">{item.step}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Callout>
          Bug analysis runs automatically on new errors. You can also manually trigger analysis on any error from the logs page.
        </Callout>
      </div>
    ),
  },
  'api-lab': {
    title: 'API Lab',
    description: 'Postman-style API testing and exploration',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          The API Lab provides a full-featured API client right in your browser. Test endpoints, inspect responses, and build collections.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Features</h3>
          <ul className="space-y-2">
            {[
              'Send GET, POST, PUT, PATCH, DELETE, and HEAD requests',
              'Environment variables for dynamic request values',
              'Request history and saved collections',
              'Code snippet generation for multiple languages',
              'WebSocket testing and real-time message inspection',
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
        <CodeBlock>
          {`$ # Test a local endpoint
$ curl -X POST https://opendrap-api.tert.workers.dev/api/test \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"query": "test"}'`}
        </CodeBlock>
      </div>
    ),
  },
  'chat': {
    title: 'Chat',
    description: 'Team communication built in',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Opendrap Chat lets you communicate with your team in private messages, group chats, and project-specific channels.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Chat Types</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: MessageSquare, name: 'Direct Messages', desc: 'Private one-on-one conversations' },
              { icon: Users, name: 'Group Chats', desc: 'Team-wide discussions' },
              { icon: FolderKanban, name: 'Project Chats', desc: 'Auto-linked to projects' },
            ].map((chat) => (
              <div key={chat.name} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <chat.icon className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <div className="text-white font-medium text-sm">{chat.name}</div>
                <div className="text-xs text-gray-500 mt-1">{chat.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Features</h3>
          <ul className="space-y-2">
            {[
              'Real-time messaging with typing indicators',
              'Markdown support in messages',
              'Code snippet sharing with syntax highlighting',
              'File and image sharing',
              'Notification preferences per channel',
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  'tasks': {
    title: 'Tasks',
    description: 'Kanban-style project management',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Manage your project workflow with a built-in Kanban board. Create tasks, assign team members, and track progress.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Board Columns</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { name: 'Backlog', desc: 'Tasks to be done' },
              { name: 'To Do', desc: 'Ready to start' },
              { name: 'In Progress', desc: 'Currently being worked on' },
              { name: 'Done', desc: 'Completed tasks' },
            ].map((col) => (
              <div key={col.name} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-white font-medium text-sm">{col.name}</div>
                <div className="text-xs text-gray-500 mt-1">{col.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Task Features</h3>
          <ul className="space-y-2">
            {[
              'Drag-and-drop between columns',
              'Assign tasks to team members',
              'Labels, due dates, and priority levels',
              'Task comments and activity history',
              'GitHub issue integration',
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  'connections': {
    title: 'Connections',
    description: 'Link external services and integrations',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Connect Opendrap to your favorite tools and services. Integrations include GitHub, Slack, Discord, Docker, and more.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Available Integrations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: GitBranch, name: 'GitHub', desc: 'Auto-deploy on push, PR previews' },
              { icon: Globe, name: 'Slack', desc: 'Deploy notifications and alerts' },
              { icon: MessageSquare, name: 'Discord', desc: 'Webhook notifications' },
              { icon: Shield, name: 'Docker', desc: 'Custom container builds' },
            ].map((int) => (
              <div key={int.name} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <int.icon className="w-8 h-8 text-violet-400 shrink-0" />
                <div>
                  <div className="text-white font-medium text-sm">{int.name}</div>
                  <div className="text-xs text-gray-500">{int.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  'companies': {
    title: 'Companies',
    description: 'Organization management',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Companies let you organize teams and manage billing at the organization level. Invite team members and control access.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Company Management</h3>
          <ul className="space-y-2">
            {[
              'Create and manage multiple companies',
              'Invite members with role-based permissions',
              'Shared billing and usage across team projects',
              'Audit logs for all team activities',
              'SSO and SAML authentication support',
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  'profile': {
    title: 'Profile',
    description: 'Manage your personal account',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Your profile is your identity on Opendrap. Manage personal details, skills, and connected accounts.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Profile Settings</h3>
          <ul className="space-y-2">
            {[
              'Update your name, bio, and profile picture',
              'Add skills and technologies you work with',
              'Link your GitHub and social accounts',
              'Set your company and work experience',
              'Manage notification preferences',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  'settings': {
    title: 'Settings',
    description: 'Account and platform configuration',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Configure your account settings, security preferences, and platform defaults.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Settings Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Shield, name: 'Security', desc: '2FA, API keys, sessions' },
              { icon: Bell, name: 'Notifications', desc: 'Email, Slack, webhooks' },
              { icon: Globe, name: 'Preferences', desc: 'Theme, language, timezone' },
              { icon: Terminal, name: 'CLI', desc: 'Agent configuration' },
            ].map((cat) => (
              <div key={cat.name} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <cat.icon className="w-8 h-8 text-violet-400 shrink-0" />
                <div>
                  <div className="text-white font-medium text-sm">{cat.name}</div>
                  <div className="text-xs text-gray-500">{cat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  'billing': {
    title: 'Billing',
    description: 'Manage your subscription and usage',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          View your current plan, usage statistics, and manage billing information.
        </p>
        <div>
          <h3 className="text-white font-semibold mb-3">Available Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Free', price: '₹0', includes: '1 project, 1 GB storage' },
              { name: 'Starter', price: '₹99/mo', includes: '5 projects, 10 GB storage' },
              { name: 'Pro', price: '₹299/mo', includes: '20 projects, AI testing credits' },
              { name: 'Team', price: '₹999/mo', includes: 'Unlimited projects, priority support' },
            ].map((plan) => (
              <div key={plan.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white font-semibold">{plan.name}</div>
                <div className="text-lg font-bold text-white mt-1">{plan.price}</div>
                <div className="text-xs text-gray-500 mt-1">{plan.includes}</div>
              </div>
            ))}
          </div>
        </div>
        <Callout>
          Upgrade or downgrade at any time. Charges are prorated for the current billing period.
        </Callout>
      </div>
    ),
  },
};

function SidebarItem({
  section,
  isActive,
  currentSection,
  isCollapsed,
  onToggleCollapse,
  onSelect,
  searchQuery,
}: {
  section: DocGroup;
  isActive: boolean;
  currentSection: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelect: (id: string) => void;
  searchQuery: string;
}) {
  const hasMatchingSections = section.sections.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  if (searchQuery && !hasMatchingSections) return null;

  return (
    <div>
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
      >
        <section.icon className="w-4 h-4" />
        <span className="flex-1 text-left">{section.title}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
        <div className="ml-2 mt-1 space-y-0.5">
          {section.sections.map((sub) => {
            if (searchQuery && !sub.title.toLowerCase().includes(searchQuery.toLowerCase())) return null;
            return (
              <button
                key={sub.id}
                onClick={() => onSelect(sub.id)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  currentSection === sub.id
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {sub.icon && <sub.icon className="w-3.5 h-3.5" />}
                <span>{sub.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DocsPage() {
  const [currentSection, setCurrentSection] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleCollapse = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const section = sectionContent[currentSection];

  // Auto-expand group of active section
  const activeGroup = useMemo(() => {
    return docGroups.find(g => g.sections.some(s => s.id === currentSection));
  }, [currentSection]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-[280px] h-screen border-r border-white/5 bg-[#0A0A0F] overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 space-y-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Book className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white">Documentation</div>
              <div className="text-[10px] text-gray-500">Opendrap Platform</div>
            </div>
          </a>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {docGroups.map((group) => (
              <SidebarItem
                key={group.title}
                section={group}
                isActive={activeGroup?.title === group.title}
                currentSection={currentSection}
                isCollapsed={collapsedGroups[group.title] ?? false}
                onToggleCollapse={() => toggleCollapse(group.title)}
                onSelect={(id) => {
                  setCurrentSection(id);
                  setSidebarOpen(false);
                }}
                searchQuery={searchQuery}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-violet-400">Docs</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-300">{section?.title}</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">{section?.title}</h1>
            <p className="text-lg text-gray-400">{section?.description}</p>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {section?.content}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a href="/dashboard/chat" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">Contact support</a>
              {' '}or{' '}
              <a href="https://github.com/opendrap/docs" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline underline-offset-2 inline-flex items-center gap-1">
                open an issue <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
