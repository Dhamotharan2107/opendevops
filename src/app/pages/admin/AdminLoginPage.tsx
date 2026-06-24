import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { Cloud, User, Lock, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { apiLogin } from '../../../lib/api';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Authenticate as a normal user, then require the admin role (enforced
      // server-side on every admin request). No client-side secret.
      const { user } = await apiLogin(username.trim(), password);
      if (user?.role !== 'admin') {
        localStorage.removeItem('token');
        throw new Error('This account does not have admin access');
      }
      localStorage.setItem('opendrap_admin_session', 'true');
      navigate('/admin-prd/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid admin credentials');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] flex items-center justify-center overflow-hidden p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-red-600 rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-orange-600 rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-[400px]"
      >
        <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0F]/70 backdrop-blur-2xl shadow-2xl p-8">
          {/* Logo + badge */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link to="/" className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Cloud className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-white leading-none">Opendrap</span>
                <span className="text-[10px] text-gray-500 leading-none mt-0.5">DevOps Platform</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full mb-4">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Admin Panel</span>
            </div>

            <h1 className="text-xl font-bold text-white">Restricted Access</h1>
            <p className="text-sm text-gray-500 mt-1">Admin credentials required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@opendrap.dev"
                  className="w-full pl-9 pr-4 h-11 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 transition-colors"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-9 pr-10 h-11 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              ← Back to main site
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
