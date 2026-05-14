import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/shared/LoadingStates';

export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/workspace');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#0F1117] text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,88,252,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,211,238,0.18),transparent_24%)]" />
      
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_28px_80px_rgba(15,17,23,0.55)] backdrop-blur-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mb-6 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src="/assets/logo.png" alt="Logo" className="h-16 w-auto" />
            </div>
            
            <h1 className="mt-2 text-3xl font-semibold text-white">Welcome Back</h1>
            <p className="mt-1 text-sm text-slate-400">Login to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </motion.button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-medium text-white transition hover:text-cyan-300"
            >
              Register
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
