import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Copy, Check, Wifi, ChevronRight, Shield, FolderOpen, Cpu } from 'lucide-react';
import { useApp } from '@/lib/store';

const INSTALL_CMD = 'curl -sSL https://opendrap-api.tert.workers.dev/api/install.sh | bash';

const STEPS = [
  { icon: Terminal, text: 'Open your Cloud Shell or terminal' },
  { icon: Copy, text: 'Paste and run the install command below' },
  { icon: Cpu, text: 'Agent auto-starts and connects to Opendrap' },
  { icon: Wifi, text: 'Dashboard unlocks — start creating projects' },
];

const WORKSPACE = [
  '~/opendrap-agent/agent.py   — Agent runtime script',
  '~/opendrap-agent/agent.log  — Agent connection logs',
  '~/opendrap-agent/agent.pid  — Process ID file',
];

export function AgentInstallModal() {
  const { dispatch } = useApp();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL_CMD).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const markInstalled = () => {
    setVerifying(true);
    // Simulate a brief check then mark as installed
    setTimeout(() => {
      const fakeAgentId = 'agent-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('opendrap_agent_id', fakeAgentId);
      dispatch({ type: 'SET_AGENT_INSTALLED', payload: true });
      dispatch({
        type: 'SET_AGENT_STATUS',
        payload: { connected: false, agentId: fakeAgentId, lastSeen: new Date().toISOString() },
      });
      setVerifying(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative w-full max-w-[580px] bg-[#0F0F14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

        <div className="p-8">
          {/* Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Connect Your Development Environment</h2>
              <p className="text-sm text-gray-400 mt-0.5">Required to create and manage projects</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            To use Opendrap DevOps AI, install the Opendrap Agent in your{' '}
            terminal. The agent creates an isolated workspace and connects your environment to this dashboard.
          </p>

          {/* Steps */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-violet-400">{i + 1}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Install command */}
          <div className="mb-6">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
              Install Command
            </label>
            <div className="flex items-center gap-2 p-3.5 bg-[#060608] border border-white/10 rounded-xl">
              <code className="flex-1 text-emerald-300 font-mono text-sm truncate">{INSTALL_CMD}</code>
              <button
                onClick={copy}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Workspace info */}
          <div className="mb-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
            <div className="flex items-center gap-2 mb-2.5">
              <FolderOpen className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">Workspace Created at ~/opendrap-agent</span>
            </div>
            <div className="space-y-1">
              {WORKSPACE.map((w) => (
                <p key={w} className="text-xs text-gray-500 font-mono">{w}</p>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-7">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              The agent runs in <span className="font-mono">~/opendrap-agent</span> with no root or sudo access. All activity is logged.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={copy}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Command Copied!' : 'Copy Install Command'}
            </button>

            <button
              onClick={markInstalled}
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {verifying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Verifying connection...
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  I've Installed It — Continue to Dashboard
                </>
              )}
            </button>

            <button
              onClick={() => dispatch({ type: 'SET_AGENT_INSTALLED', payload: true })}
              className="w-full h-9 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip for now — I'll install the agent later
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
