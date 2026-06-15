import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Play, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Zap, Clock, ChevronDown, ChevronUp, Camera
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { AITestResult, AITest } from '@/lib/types';

const TEST_SUITES = [
  { id: 'homepage', label: 'Homepage Test', description: 'Test home page load, content, and navigation' },
  { id: 'login', label: 'Login Flow', description: 'Test login form, validation, and authentication' },
  { id: 'register', label: 'Registration', description: 'Test signup flow and form validation' },
  { id: 'forms', label: 'Form Testing', description: 'Test all input forms and submit behaviors' },
  { id: 'navigation', label: 'Navigation', description: 'Test all navigation links and routes' },
  { id: 'api', label: 'API Endpoints', description: 'Test REST API responses and status codes' },
];

function generateMockResults(projectUrl: string): AITest[] {
  return TEST_SUITES.map((suite) => ({
    name: suite.label,
    status: Math.random() > 0.2 ? (Math.random() > 0.1 ? 'passed' : 'warning') : 'failed',
    duration: `${(Math.random() * 3 + 0.5).toFixed(1)}s`,
  } as AITest));
}

export function AITestingPage() {
  const { state, dispatch } = useApp();
  const { aiTestResults, projects } = state;
  const [prompt, setPrompt] = useState('');
  const [projectId, setProjectId] = useState('');
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedSuites, setSelectedSuites] = useState<string[]>(['homepage', 'login', 'navigation']);

  const toggleSuite = (id: string) => {
    setSelectedSuites((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const runTests = async () => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
    setRunning(true);
    await new Promise((r) => setTimeout(r, 3000));
    const result: AITestResult = {
      id: Date.now().toString(),
      projectId: projectId || projects[0]?.id || 'demo',
      prompt: prompt || 'Test this application like a real user',
      results: generateMockResults(''),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_AI_RESULT', payload: result });
    setRunning(false);
    setExpanded(result.id);
  };

  const STATUS_CONFIG = {
    passed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">AI Testing</h1>
          <p className="text-gray-400 text-sm">Run AI-powered tests using Playwright</p>
        </div>

        {/* Test Runner */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Run AI Test Suite</h2>
              <p className="text-xs text-gray-500">Describe what to test in plain English</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="demo">Demo App</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Test Prompt</label>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Test this app like a real customer"'
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Test Suites</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEST_SUITES.map((suite) => (
                <button
                  key={suite.id}
                  onClick={() => toggleSuite(suite.id)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    selectedSuites.includes(suite.id)
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('w-2 h-2 rounded-full', selectedSuites.includes(suite.id) ? 'bg-violet-400' : 'bg-gray-600')} />
                    <span className="text-xs font-medium">{suite.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{suite.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={runTests}
            disabled={running}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running Tests...' : `Run ${selectedSuites.length} Test Suite${selectedSuites.length !== 1 ? 's' : ''}`}
          </button>

          {running && (
            <div className="bg-black/20 rounded-lg p-4 font-mono text-sm space-y-1">
              <p className="text-gray-400">Starting Playwright browser...</p>
              <p className="text-violet-400 animate-pulse">Running AI analysis...</p>
              <p className="text-gray-500">Executing test suites...</p>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Test History</h2>
          {aiTestResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 border border-white/10 rounded-xl">
              <Bot className="w-12 h-12 text-gray-600 mb-4" />
              <h3 className="text-gray-400 font-medium mb-2">No test runs yet</h3>
              <p className="text-gray-600 text-sm">Run your first AI test suite above</p>
            </div>
          )}
          {aiTestResults.map((run) => {
            const passed = run.results.filter((r) => r.status === 'passed').length;
            const failed = run.results.filter((r) => r.status === 'failed').length;
            const warned = run.results.filter((r) => r.status === 'warning').length;
            const project = projects.find((p) => p.id === run.projectId);
            return (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                <div
                  className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm mb-1 truncate">{run.prompt}</div>
                    <div className="text-xs text-gray-500">
                      {project?.name || 'Demo'} · {new Date(run.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {passed > 0 && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />{passed}</span>}
                    {warned > 0 && <span className="flex items-center gap-1 text-xs text-yellow-400"><AlertTriangle className="w-3.5 h-3.5" />{warned}</span>}
                    {failed > 0 && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3.5 h-3.5" />{failed}</span>}
                    {expanded === run.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === run.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/10"
                    >
                      <div className="p-5 grid grid-cols-2 gap-3">
                        {run.results.map((test, i) => {
                          const cfg = STATUS_CONFIG[test.status];
                          return (
                            <div key={i} className={cn('flex items-center gap-3 p-3 rounded-lg border', cfg.bg)}>
                              <cfg.icon className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />
                              <div className="flex-1 min-w-0">
                                <div className={cn('text-sm font-medium truncate', cfg.color)}>{test.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />{test.duration}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
