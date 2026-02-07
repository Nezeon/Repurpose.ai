import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login, register } from '../services/auth';
import useAppStore from '../store';
import { ROUTES } from '../utils/constants';
import Button from '../components/common/Button';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
  });

  const { setUser } = useAppStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await login(formData.email, formData.password);
        setUser(user);
      } else {
        const user = await register({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          username: formData.username || formData.email.split('@')[0],
        });
        setUser(user);
      }
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">
        {isLogin ? 'Welcome back' : 'Create account'}
      </h2>
      <p className="text-text-secondary text-center mb-6">
        {isLogin
          ? 'Sign in to access your dashboard'
          : 'Get started with drug repurposing'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="input pl-11"
                required={!isLogin}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="input pl-11"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input pl-11 pr-11"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          fullWidth
          loading={loading}
          className="mt-6"
        >
          {isLogin ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-text-secondary hover:text-brand-yellow transition-colors"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-brand-slate text-text-muted">or</span>
          </div>
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={handleSkip}
          className="mt-4"
        >
          Continue as Guest
        </Button>
      </div>
    </div>
  );
};

export default Login;
