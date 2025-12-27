/**
 * Password Reset Component
 *
 * Handles password reset flow after user clicks email link
 */

import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setMessage({
          type: 'error',
          text: 'Invalid or expired password reset link. Please request a new one.'
        });
      }
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match. Please try again.'
      });
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long.'
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Password updated successfully! Redirecting to sign in...'
        });

        // Sign out and redirect to login after 2 seconds
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to reset password. Please try again.'
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
          <p className="text-slate-600">
            Enter your new password below
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' && <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />}
            {message.type === 'error' && <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-emerald-900' : 'text-red-900'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Reset Password Form */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                New Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Enter new password (min 8 characters)"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Reset Password
                </>
              )}
            </button>
          </div>
        </form>

        {/* Back to Sign In */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
