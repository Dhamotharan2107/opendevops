import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, Github, Loader2, UserRound } from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiRegister, getOAuthUrl } from '@/lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Logo from '../components/Logo.svg';

declare const grecaptcha: { ready: (cb: () => void) => void; execute: (key: string, opts: { action: string }) => Promise<string>; };
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
if (siteKey && typeof window !== 'undefined' && !(window as any).recaptchaLoaded) {
  (window as any).recaptchaLoaded = true;
  const s = document.createElement('script');
  s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
  s.async = true; s.defer = true;
  document.head.appendChild(s);
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const executeRecaptcha = async (): Promise<string> => {
    if (!siteKey || typeof grecaptcha === 'undefined') return '';
    try {
      return await grecaptcha.execute(siteKey, { action: 'register' });
    } catch {
      return '';
    }
  };

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return;
    setIsLoading(true);
    setError('');
    try {
      const token = await executeRecaptcha();
      const { user } = await apiRegister(form.username, form.name, form.email, form.password, token || undefined);
      dispatch({ type: 'SET_USER', payload: user });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden p-4">
      {/* Animated Background — pure monochrome */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(255,255,255,0.04)_0%,transparent_50%)]" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-white/[0.04] rounded-full blur-[120px] animate-aurora" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-white/[0.03] rounded-full blur-[120px] animate-aurora-reverse" />
        <div className="absolute inset-0 grid-fade bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-[420px]"
      >
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl shadow-2xl shadow-white/5 p-8"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-7">
            <Link to="/" className="flex items-center gap-3 group mb-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 hover:shadow-white/20 transition-shadow"
              >
                <img src={Logo} alt="Opendevops Logo" className="w-7 h-7 invert" />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg text-white leading-none">Opendevops</span>
                <span className="text-[11px] text-gray-500 leading-none mt-0.5">DevOps Platform</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-white">
              Create an account
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">Get started with your free account</p>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={form.username}
                    onChange={updateField('username')}
                    className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-white/40 focus-visible:ring-white/20 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-300">Name</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={updateField('name')}
                    className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-white/40 focus-visible:ring-white/20 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={updateField('email')}
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-white/40 focus-visible:ring-white/20 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 chars"
                    value={form.password}
                    onChange={updateField('password')}
                    className="pl-10 pr-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-white/40 focus-visible:ring-white/20 rounded-xl"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">Confirm</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    className="pl-10 pr-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-white/40 focus-visible:ring-white/20 rounded-xl"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-400 pl-1">Passwords do not match</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-white text-black hover:bg-white/90 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-white/10 hover:shadow-white/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </motion.form>

          <motion.div variants={itemVariants} className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-black/60 px-4 text-xs text-gray-500">or continue with</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <a
              href={getOAuthUrl('google')}
              className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 transition-all duration-200 text-sm font-medium text-gray-300 hover:text-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </a>
            <a
              href={getOAuthUrl('github')}
              className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 transition-all duration-200 text-sm font-medium text-gray-300 hover:text-white"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-gray-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
