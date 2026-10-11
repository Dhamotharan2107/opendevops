import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Github, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { apiLogin, apiDemoLogin, getOAuthUrl, DEMO_PROJECTS, DEMO_DEPLOYMENTS, DEMO_ERRORS } from '@/lib/api';
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
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
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

export function LoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const executeRecaptcha = async (): Promise<string> => {
    if (!siteKey || typeof grecaptcha === 'undefined') return '';
    try {
      return await grecaptcha.execute(siteKey, { action: 'login' });
    } catch {
      return '';
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    const { user } = await apiDemoLogin();
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'SET_PROJECTS', payload: DEMO_PROJECTS as any });
    dispatch({ type: 'SET_DEPLOYMENTS', payload: DEMO_DEPLOYMENTS as any });
    dispatch({ type: 'SET_ERRORS', payload: DEMO_ERRORS as any });
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const token = await executeRecaptcha();
      const { user } = await apiLogin(email, password, token || undefined);
      dispatch({ type: 'SET_USER', payload: user });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center overflow-hidden p-4">
      {/* Animated Background — theme-aware */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--primary)/0.06_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,var(--primary)/0.04_0%,transparent_50%)]" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-aurora" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-primary/3 rounded-full blur-[120px] animate-aurora-reverse" />
        <div className="absolute inset-0 grid-fade bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-[420px]"
      >
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-2xl shadow-2xl shadow-primary/5 p-8"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-8">
            <Link to="/" className="flex items-center gap-3 group mb-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow"
              >
                <img src={Logo} alt="Opendevops Logo" className="w-7 h-7" />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg text-foreground leading-none">Opendevops</span>
                <span className="text-[11px] text-muted-foreground leading-none mt-0.5">DevOps Platform</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">Sign in to your account to continue</p>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-accent border-border text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">Password</Label>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-accent border-border text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-primary/10 hover:shadow-primary/20 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </motion.form>

          <motion.div variants={itemVariants} className="mt-3">
            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading}
              className="w-full h-11 rounded-xl border border-border bg-accent hover:bg-accent/80 text-foreground hover:text-foreground font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {demoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Try Demo — No account needed
                </>
              )}
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card/60 px-4 text-xs text-muted-foreground">or continue with</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <a
              href={getOAuthUrl('google')}
              className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-border bg-accent hover:bg-accent/80 transition-all duration-200 text-sm font-medium text-muted-foreground hover:text-foreground"
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
              className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-border bg-accent hover:bg-accent/80 transition-all duration-200 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-foreground hover:text-muted-foreground font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}