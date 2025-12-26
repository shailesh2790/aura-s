/**
 * Supabase Client Configuration
 *
 * Provides authentication and database access
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase credentials not configured. Authentication is disabled.');
  console.warn('📝 To enable authentication:');
  console.warn('   1. Create a .env file in the project root');
  console.warn('   2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.warn('   3. See docs/DEPLOYMENT_GUIDE.md for setup instructions');
  console.warn('');
  console.warn('💡 The app will run without authentication for local development.');
}

// Create client only if configured, otherwise use a mock
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null as any; // Mock client for local dev without auth

// Database types
export interface WaitlistUser {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role?: string;
  waitlist_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Waitlist functions
export async function checkWaitlistStatus(email: string): Promise<'approved' | 'pending' | 'not_found'> {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('status')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return 'not_found';
    }

    return data.status === 'approved' ? 'approved' : 'pending';
  } catch (error) {
    console.error('Error checking waitlist status:', error);
    return 'not_found';
  }
}

export async function joinWaitlist(email: string, metadata?: Record<string, any>): Promise<{ success: boolean; message: string }> {
  try {
    // Check if already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === 'approved') {
        return { success: true, message: 'You are already approved! Please sign in.' };
      }
      return { success: true, message: 'You are already on the waitlist. We will notify you when approved.' };
    }

    // Add to waitlist
    const { error } = await supabase
      .from('waitlist')
      .insert([{
        email: email.toLowerCase(),
        status: 'pending',
        metadata: metadata || {},
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error joining waitlist:', error);
      return { success: false, message: 'Failed to join waitlist. Please try again.' };
    }

    return { success: true, message: 'Successfully joined the waitlist! We will notify you when approved.' };
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; message: string; approved?: boolean }> {
  try {
    // Check waitlist status first
    const waitlistStatus = await checkWaitlistStatus(email);

    if (waitlistStatus === 'not_found') {
      return {
        success: false,
        message: 'Email not on waitlist. Please join the waitlist first.',
        approved: false
      };
    }

    if (waitlistStatus === 'pending') {
      return {
        success: false,
        message: 'Your waitlist request is pending approval. We will notify you when approved.',
        approved: false
      };
    }

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (error) {
      return { success: false, message: error.message, approved: true };
    }

    if (!data.user) {
      return { success: false, message: 'Sign in failed. Please try again.', approved: true };
    }

    return { success: true, message: 'Successfully signed in!', approved: true };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { success: false, message: error.message || 'An error occurred during sign in.' };
  }
}

export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, any>): Promise<{ success: boolean; message: string }> {
  try {
    // Check waitlist status
    const waitlistStatus = await checkWaitlistStatus(email);

    if (waitlistStatus !== 'approved') {
      return {
        success: false,
        message: 'You must be approved on the waitlist before signing up. Please join the waitlist first.'
      };
    }

    // Create account
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          ...metadata,
          waitlist_approved: true
        }
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data.user) {
      return { success: false, message: 'Sign up failed. Please try again.' };
    }

    // Update waitlist record
    await supabase
      .from('waitlist')
      .update({ approved_at: new Date().toISOString() })
      .eq('email', email.toLowerCase());

    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.'
    };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { success: false, message: error.message || 'An error occurred during sign up.' };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isUserApproved(email: string): Promise<boolean> {
  const status = await checkWaitlistStatus(email);
  return status === 'approved';
}
