import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import useAuthStore from '../store/useAuthStore';
import { AnimatedGridPattern } from '../components/magicui/AnimatedGridPattern';
import { ShimmerButton } from '../components/magicui/ShimmerButton';

const REMEMBERED_AUTH_KEY = 'bookmarkvault-remembered-auth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem(REMEMBERED_AUTH_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.email === 'string') setEmail(parsed.email);
      if (typeof parsed?.isLogin === 'boolean') setIsLogin(parsed.isLogin);
      setRememberMe(true);
    } catch {
      localStorage.removeItem(REMEMBERED_AUTH_KEY);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }

      if (rememberMe) {
        localStorage.setItem(
          REMEMBERED_AUTH_KEY,
          JSON.stringify({ email, isLogin })
        );
      } else {
        localStorage.removeItem(REMEMBERED_AUTH_KEY);
      }

      navigate('/');
    } catch {
      // Error is set in store
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh relative overflow-hidden">
      {/* Background decorative elements */}
      <AnimatedGridPattern className="opacity-40 z-0 pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-container/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4 glow-border">
            <Bookmark className="w-7 h-7 text-accent-light" />
          </div>
          <h1 className="font-display text-display-lg text-text-primary">
            Bookmarkvault
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Your personal AI bookmark sanctuary
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl bg-bg-secondary/80 backdrop-blur-xl border border-border p-8 shadow-ambient">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-text-muted select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border bg-bg-elevated accent-accent"
              />
              Remember email on this device
            </label>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-md"
              >
                {error}
              </motion.p>
            )}

            <ShimmerButton type="submit" className="w-full" disabled={isLoading} background="var(--accent)">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white dark:text-white" />
              ) : isLogin ? (
                <span className="text-white dark:text-white">Sign In</span>
              ) : (
                <span className="text-white dark:text-white">Create Account</span>
              )}
            </ShimmerButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-text-muted hover:text-accent-light transition-colors"
            >
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span className="text-accent-light font-medium">
                {isLogin ? 'Create one' : 'Sign in'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
