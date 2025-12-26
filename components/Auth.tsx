/**
 * Authentication Component
 *
 * Handles waitlist signup, login, and account creation
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import {
  joinWaitlist,
  signInWithEmail,
  signUpWithEmail,
  checkWaitlistStatus
} from '../lib/supabase';

type AuthMode = 'waitlist' | 'signin' | 'signup';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('waitlist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await joinWaitlist(email, {
      full_name: fullName,
      company,
      role,
      source: 'app'
    });

    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });

    if (result.success) {
      setEmail('');
      setFullName('');
      setCompany('');
      setRole('');
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await signInWithEmail(email, password);

    if (!result.success) {
      setMessage({
        type: result.approved === false ? 'info' : 'error',
        text: result.message
      });

      // If not approved, suggest joining waitlist
      if (result.approved === false) {
        setTimeout(() => {
          setMode('waitlist');
        }, 3000);
      }
    } else {
      setMessage({
        type: 'success',
        text: result.message
      });
      // Refresh page to trigger auth state change
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Check waitlist status first
    const status = await checkWaitlistStatus(email);
    if (status !== 'approved') {
      setMessage({
        type: 'error',
        text: 'You must be approved on the waitlist before creating an account. Please check your email or contact support.'
      });
      setLoading(false);
      return;
    }

    const result = await signUpWithEmail(email, password, {
      full_name: fullName,
      company,
      role
    });

    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });

    if (result.success) {
      setEmail('');
      setPassword('');
      setFullName('');
      setCompany('');
      setRole('');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AURA OS</h1>
          <p className="text-slate-600">
            {mode === 'waitlist' && 'Join the waitlist for early access'}
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('waitlist')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              mode === 'waitlist'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Mail size={16} />
              Waitlist
            </span>
          </button>
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              mode === 'signin'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <LogIn size={16} />
              Sign In
            </span>
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              mode === 'signup'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlus size={16} />
              Sign Up
            </span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 border border-emerald-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {message.type === 'success' && <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />}
            {message.type === 'error' && <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />}
            {message.type === 'info' && <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-emerald-900' :
              message.type === 'error' ? 'text-red-900' :
              'text-blue-900'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Waitlist Form */}
        {mode === 'waitlist' && (
          <form onSubmit={handleWaitlistSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">Select your role</option>
                  <option value="product_manager">Product Manager</option>
                  <option value="founder">Founder / CEO</option>
                  <option value="engineer">Engineer</option>
                  <option value="designer">Designer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Joining...
                </span>
              ) : (
                'Join Waitlist'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Already approved? <button type="button" onClick={() => setMode('signup')} className="text-slate-900 font-medium hover:underline">Create account</button>
            </p>
          </form>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Don't have an account? <button type="button" onClick={() => setMode('waitlist')} className="text-slate-900 font-medium hover:underline">Join waitlist</button>
            </p>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> You must be approved on the waitlist before creating an account.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Already have an account? <button type="button" onClick={() => setMode('signin')} className="text-slate-900 font-medium hover:underline">Sign in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
