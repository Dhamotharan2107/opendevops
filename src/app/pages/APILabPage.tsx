import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Send, Plus, Trash2, ChevronRight, Code2, Globe,
  Clock, CheckCircle2, XCircle, Loader2, FolderOpen
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { APIRequest, APICollection } from '@/lib/types';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-500/10',
  POST: 'text-blue-400 bg-blue-500/10',
  PUT: 'text-yellow-400 bg-yellow-500/10',
  PATCH: 'text-orange-400 bg-orange-500/10',
  DELETE: 'text-red-400 bg-red-500/10',
};

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const EXAMPLE_COLLECTIONS: APICollection[] = [
  {
    id: '1',
    name: 'Opendrap API',
    requests: [
      { id: '1a', method: 'GET', url: 'https://opendrap-api.workers.dev/api/auth/me', headers: { Authorization: 'Bearer {{token}}' }, body: undefined },
      { id: '1b', method: 'GET', url: 'https://opendrap-api.workers.dev/api/projects', headers: { Authorization: 'Bearer {{token}}' }, body: undefined },
      { id: '1c', method: 'POST', url: 'https://opendrap-api.workers.dev/api/projects', headers: { Authorization: 'Bearer {{token}}', 'Content-Type': 'application/json' }, body: '{"name":"My App","repo":"github.com/user/app"}' },
    ],
  },
];

export function APILabPage() {
  const { state, dispatch } = useApp();
  const collections = state.apiCollections.length > 0 ? state.apiCollections : EXAMPLE_COLLECTIONS;

  const [method, setMethod] = useState<typeof METHODS[number]>('GET');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Authorization', value: '' },
  ]);
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'response'>('headers');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; statusText: string; body: string; time: number } | null>(null);
  const [error, setError] = useState('');

  const sendRequest = async () => {
    if (!url.trim()) { setError('Enter a URL'); return; }
    setLoading(true);
    setError('');
    setResponse(null);
    const start = Date.now();
    try {
      const hdrs: Record<string, string> = {};
      for (const h of headers) {
        if (h.key.trim() && h.value.trim()) hdrs[h.key] = h.value;
      }
      const opts: RequestInit = { method, headers: hdrs };
      if (method !== 'GET' && body.trim()) opts.body = body;
      const res = await fetch(url, opts);
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setResponse({ status: res.status, statusText: res.statusText, body: pretty, time: Date.now() - start });
      setActiveTab('response');
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const loadRequest = (req: APIRequest) => {
    setMethod(req.method);
    setUrl(req.url);
    setBody(req.body || '');
    const h: { key: string; value: string }[] = Object.entries(req.headers).map(([key, value]) => ({ key, value }));
    if (h.length > 0) setHeaders(h);
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0F0F14] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-violet-400" />
            Collections
          </h2>
          <button
            onClick={() => {
              const col: APICollection = { id: Date.now().toString(), name: 'New Collection', requests: [] };
              dispatch({ type: 'ADD_API_COLLECTION', payload: col });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Collection
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {collections.map((col) => (
            <div key={col.id}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">{col.name}</div>
              {col.requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => loadRequest(req)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors text-left group"
                >
                  <span className={cn('text-xs font-bold w-12 text-center rounded px-1', METHOD_COLORS[req.method])}>
                    {req.method}
                  </span>
                  <span className="text-xs text-gray-400 truncate group-hover:text-white transition-colors">
                    {req.url.replace(/^https?:\/\/[^/]+/, '')}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">API Lab</h1>
          <p className="text-gray-400 text-sm">Test and explore APIs</p>
        </div>

        {/* URL Bar */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className={cn('px-3 py-2 rounded-lg text-sm font-bold bg-transparent border-0 focus:outline-none cursor-pointer', METHOD_COLORS[method])}
          >
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none font-mono"
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>

        {error && <p className="text-sm text-red-400 px-1">{error}</p>}

        {/* Tabs */}
        <div className="flex border-b border-white/10 gap-1">
          {(['headers', 'body', 'response'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
                activeTab === tab
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              {tab}
              {tab === 'response' && response && (
                <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded', response.status < 400 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
                  {response.status}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'headers' && (
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={h.key}
                    onChange={(e) => setHeaders((prev) => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
                    placeholder="Header name"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none font-mono"
                  />
                  <input
                    value={h.value}
                    onChange={(e) => setHeaders((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none font-mono"
                  />
                  <button onClick={() => setHeaders((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setHeaders((prev) => [...prev, { key: '', value: '' }])}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Header
              </button>
            </div>
          )}

          {activeTab === 'body' && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={'{\n  "key": "value"\n}'}
              rows={14}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none font-mono resize-none"
            />
          )}

          {activeTab === 'response' && (
            <div>
              {!response && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Globe className="w-10 h-10 text-gray-600 mb-3" />
                  <p className="text-gray-500 text-sm">Send a request to see the response</p>
                </div>
              )}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                </div>
              )}
              {response && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className={cn('font-bold', response.status < 400 ? 'text-emerald-400' : 'text-red-400')}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{response.time}ms
                    </span>
                  </div>
                  <pre className="bg-black/30 border border-white/10 rounded-xl p-4 text-xs text-gray-300 font-mono overflow-auto max-h-80 whitespace-pre-wrap">
                    {response.body || '(empty)'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
