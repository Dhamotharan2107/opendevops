import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Cloud, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiExchangeGoogleCode, apiMe } from '@/lib/api';

type Status = 'loading' | 'success' | 'error';

export function SigninCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    const code = params.get('code');
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setMessage(decodeURIComponent(error));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      apiMe()
        .then(({ user }) => {
          dispatch({ type: 'SET_USER', payload: user });
          setStatus('success');
          setMessage(`Welcome back, ${user.name || user.username}!`);
          setTimeout(() => navigate('/dashboard'), 1200);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setStatus('error');
          setMessage('Session expired. Redirecting...');
          setTimeout(() => navigate('/login'), 2000);
        });
      return;
    }

    if (code) {
      apiExchangeGoogleCode(code)
        .then(({ user }) => {
          dispatch({ type: 'SET_USER', payload: user });
          setStatus('success');
          setMessage(`Welcome, ${user.name || user.username}!`);
          setTimeout(() => navigate('/dashboard'), 1200);
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err.message || 'Authentication failed');
          setTimeout(() => navigate('/login?error=' + encodeURIComponent(err.message || 'OAuth failed')), 2500);
        });
      return;
    }

    navigate('/login');
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative w-full max-w-[400px]"
      >
        <motion.div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0F]/60 backdrop-blur-2xl shadow-2xl shadow-violet-500/5 p-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25"
          >
            <Cloud className="w-9 h-9 text-white" strokeWidth={2.5} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                <p className="text-gray-300 text-sm">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-emerald-400/20"
                  />
                </div>
                <p className="text-emerald-300 font-medium">{message}</p>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5 text-emerald-400/60" />
                </motion.div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center gap-4"
              >
                <XCircle className="w-16 h-16 text-red-400" />
                <p className="text-red-300 text-sm">{message}</p>
                <p className="text-gray-500 text-xs">Redirecting to login...</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}