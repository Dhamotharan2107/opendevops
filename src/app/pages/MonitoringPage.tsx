import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Cpu, HardDrive, MemoryStick, Wifi, Activity,
  TrendingUp, TrendingDown, Circle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

function generatePoint(prev: number, min: number, max: number) {
  const delta = (Math.random() - 0.5) * 15;
  return Math.max(min, Math.min(max, prev + delta));
}

function buildHistory(count: number, base: number, min: number, max: number) {
  const now = Date.now();
  const data: { time: string; value: number }[] = [];
  let v = base;
  for (let i = count; i >= 0; i--) {
    v = generatePoint(v, min, max);
    data.push({
      time: new Date(now - i * 10000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: Math.round(v),
    });
  }
  return data;
}

const METRICS = [
  { key: 'cpu', label: 'CPU Usage', icon: Cpu, color: '#8b5cf6', gradientFrom: 'rgba(139,92,246,0.3)', gradientTo: 'rgba(139,92,246,0)', unit: '%', base: 45, min: 10, max: 95 },
  { key: 'memory', label: 'Memory Usage', icon: MemoryStick, color: '#06b6d4', gradientFrom: 'rgba(6,182,212,0.3)', gradientTo: 'rgba(6,182,212,0)', unit: '%', base: 60, min: 30, max: 90 },
  { key: 'disk', label: 'Disk I/O', icon: HardDrive, color: '#10b981', gradientFrom: 'rgba(16,185,129,0.3)', gradientTo: 'rgba(16,185,129,0)', unit: 'MB/s', base: 20, min: 0, max: 100 },
  { key: 'network', label: 'Network', icon: Wifi, color: '#f59e0b', gradientFrom: 'rgba(245,158,11,0.3)', gradientTo: 'rgba(245,158,11,0)', unit: 'Mbps', base: 35, min: 0, max: 150 },
];

type MetricData = { time: string; value: number }[];

export function MonitoringPage() {
  const [data, setData] = useState<Record<string, MetricData>>(() => {
    const init: Record<string, MetricData> = {};
    for (const m of METRICS) init[m.key] = buildHistory(30, m.base, m.min, m.max);
    return init;
  });
  const [agentStatus] = useState<'online' | 'offline'>('online');
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    rafRef.current = setInterval(() => {
      setData((prev) => {
        const next: Record<string, MetricData> = {};
        for (const m of METRICS) {
          const history = prev[m.key];
          const last = history[history.length - 1].value;
          const newVal = Math.round(generatePoint(last, m.min, m.max));
          const newPoint = {
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            value: newVal,
          };
          next[m.key] = [...history.slice(-29), newPoint];
        }
        return next;
      });
    }, 2000);
    return () => { if (rafRef.current) clearInterval(rafRef.current); };
  }, []);

  const currentValues: Record<string, number> = {};
  for (const m of METRICS) {
    const history = data[m.key];
    currentValues[m.key] = history[history.length - 1]?.value ?? 0;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#0F0F14] border border-white/10 rounded-lg px-3 py-2 text-xs">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="text-white font-mono">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Monitoring</h1>
            <p className="text-gray-400 text-sm">Real-time system metrics</p>
          </div>
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium',
            agentStatus === 'online'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          )}>
            <Circle className={cn('w-2 h-2 fill-current', agentStatus === 'online' && 'animate-pulse')} />
            Agent {agentStatus === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Current Values Row */}
        <div className="grid grid-cols-4 gap-4">
          {METRICS.map((m) => {
            const val = currentValues[m.key];
            const prev = data[m.key]?.[data[m.key].length - 2]?.value ?? val;
            const up = val >= prev;
            return (
              <motion.div
                key={m.key}
                whileHover={{ y: -4 }}
                className="p-6 bg-white/5 border border-white/10 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <m.icon className="w-5 h-5" style={{ color: m.color }} />
                  </div>
                  <div className={cn('flex items-center gap-1 text-xs', up ? 'text-red-400' : 'text-emerald-400')}>
                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white font-mono mb-1">
                  {val}<span className="text-sm text-gray-500 font-sans ml-1">{m.unit}</span>
                </div>
                <div className="text-sm text-gray-500">{m.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6">
          {METRICS.map((m) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  <h3 className="font-semibold text-white text-sm">{m.label}</h3>
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Live
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data[m.key]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} unit={m.unit === '%' ? '%' : ''} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke={m.color} strokeWidth={2} fill={`url(#grad-${m.key})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
