import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FolderGit2, Users, Building2 } from 'lucide-react';
import { useApp } from '../../lib/store';
import type { Project, Connection, Company } from '../../lib/types';

interface SearchResult {
  id: string;
  category: 'Projects' | 'Connections' | 'Companies';
  label: string;
  description?: string;
  link: string;
  matchField: string;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <span key={i} className="text-violet-400 bg-violet-500/10 rounded px-0.5">{part}</span>
      : part
  );
}

const categoryIcons: Record<string, typeof FolderGit2> = {
  Projects: FolderGit2,
  Connections: Users,
  Companies: Building2,
};

export function GlobalSearch() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const performSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const lower = q.toLowerCase();
    const found: SearchResult[] = [];
    const seen = new Set<string>();

    state.projects.forEach((p: Project) => {
      if (p.name.toLowerCase().includes(lower)) {
        const key = `project-name-${p.id}`;
        if (!seen.has(key)) { seen.add(key); found.push({ id: p.id, category: 'Projects', label: p.name, description: p.repo, link: `/dashboard/project/${p.id}`, matchField: p.name }); }
      }
      if (p.repo.toLowerCase().includes(lower)) {
        const key = `project-repo-${p.id}`;
        if (!seen.has(key)) { seen.add(key); found.push({ id: p.id, category: 'Projects', label: p.name, description: p.repo, link: `/dashboard/project/${p.id}`, matchField: p.repo }); }
      }
    });

    state.connections.forEach((c: Connection) => {
      const u = c.user;
      if (!u) return;
      if (u.name.toLowerCase().includes(lower)) {
        const key = `conn-name-${c.id}`;
        if (!seen.has(key)) { seen.add(key); found.push({ id: c.id, category: 'Connections', label: u.name, description: u.username, link: '/dashboard/connections', matchField: u.name }); }
      }
      if (u.username.toLowerCase().includes(lower)) {
        const key = `conn-user-${c.id}`;
        if (!seen.has(key)) { seen.add(key); found.push({ id: c.id, category: 'Connections', label: u.name, description: u.username, link: '/dashboard/connections', matchField: u.username }); }
      }
      if (u.skills.some(s => s.toLowerCase().includes(lower))) {
        const key = `conn-skills-${c.id}-${c.id}`;
        if (!seen.has(key)) { seen.add(key); found.push({ id: c.id, category: 'Connections', label: u.name, description: `Skills: ${u.skills.join(', ')}`, link: '/dashboard/connections', matchField: u.skills.find(s => s.toLowerCase().includes(lower)) || '' }); }
      }
    });

    state.companies.forEach((comp: Company) => {
      if (comp.name.toLowerCase().includes(lower)) {
        const key = `comp-${comp.id}`;
        if (!seen.has(key)) { seen.add(key); found.push({ id: comp.id, category: 'Companies', label: comp.name, description: comp.description, link: '/dashboard/companies', matchField: comp.name }); }
      }
    });

    setResults(found);
    setSelectedIndex(-1);
    setOpen(true);
  }, [state]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery('');
    navigate(result.link);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;

    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
      return;
    }

    if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
      return;
    }
  }

  function groupResults() {
    const groups: { category: string; items: SearchResult[] }[] = [];
    const order = ['Projects', 'Connections', 'Companies'] as const;
    for (const cat of order) {
      const items = results.filter(r => r.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, connections..."
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#0F0F14] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            {results.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                No results found
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto py-2">
                {groupResults().map((group, gi) => {
                  const Icon = categoryIcons[group.category] || Search;
                  return (
                    <div key={group.category}>
                      <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Icon className="w-3.5 h-3.5" />
                        {group.category}
                      </div>
                      {group.items.map((result, ri) => {
                        const globalIndex = results.indexOf(result);
                        return (
                          <button
                            key={`${result.category}-${result.id}-${ri}`}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                              globalIndex === selectedIndex
                                ? 'bg-white/10'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white truncate">
                                {highlightText(result.label, query)}
                              </div>
                              {result.description && (
                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                  {highlightText(result.description, query)}
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-600 uppercase shrink-0">
                              {result.category.slice(0, -1)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
