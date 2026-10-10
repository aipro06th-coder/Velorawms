'use client';

import React, { useState } from 'react';
import {
  Layers,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
  Key
} from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { AuthScreenProps, AuthUser } from '../types';

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Warehouse Manager');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'signin') {
        const cleanEmail = (email || '').trim().toLowerCase();

        // 1. Built-in Admin Account (Instant Access)
        if ((cleanEmail === 'admin@velora.com' || cleanEmail === 'admin@wms.com') && password === 'admin123') {
          const adminUser: AuthUser = {
            id: 'admin-wms-001',
            email: cleanEmail,
            user_metadata: {
              full_name: 'Warehouse Administrator',
              role: 'Warehouse Administrator'
            }
          };
          if (rememberMe && typeof window !== 'undefined') {
            localStorage.setItem('velora_auth_user', JSON.stringify(adminUser));
          }
          setSuccessMsg('Login successful! Redirecting to dashboard...');
          setTimeout(() => {
            onLoginSuccess(adminUser);
          }, 300);
          return;
        }

        // 2. Supabase Auth Sign In
        const { data, error } = await signInWithEmail(email, password);

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Default Admin: admin@velora.com / admin123, or click "Create Account" above.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email address, or use default Admin: admin@velora.com / admin123');
          }
          throw error;
        }

        if (data?.user) {
          if (rememberMe && typeof window !== 'undefined') {
            localStorage.setItem('velora_auth_user', JSON.stringify(data.user));
          }
          setSuccessMsg('Login successful! Redirecting to dashboard...');
          setTimeout(() => {
            onLoginSuccess(data.user as AuthUser);
          }, 300);
        }
      } else {
        // Sign Up Mode
        const { data, error } = await signUpWithEmail(email, password, {
          full_name: fullName || 'WMS Specialist',
          role: role
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          const newUser: AuthUser = {
            ...data.user,
            user_metadata: {
              full_name: fullName || 'WMS Specialist',
              role: role
            }
          };
          if (rememberMe && typeof window !== 'undefined') {
            localStorage.setItem('velora_auth_user', JSON.stringify(newUser));
          }
          setSuccessMsg('Account created successfully! Welcome to Velora WMS.');
          setTimeout(() => {
            onLoginSuccess(newUser);
          }, 600);
        }
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      setErrorMsg(err?.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Background ambient lighting effects */}
      <div className="auth-ambient-glow auth-glow-1" />
      <div className="auth-ambient-glow auth-glow-2" />

      <div className="auth-card-container">
        {/* Top Brand Banner */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <Layers size={28} className="auth-logo-icon" />
          </div>
          <h1 className="auth-title">Velora WMS</h1>
          <p className="auth-subtitle">Enterprise Warehouse & Inventory Control Portal</p>
          <div className="auth-cloud-badge">
            <Database size={12} />
            <span>Supabase Cloud Connected</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="auth-alert error">
            <AlertCircle size={18} className="auth-alert-icon" />
            <div className="auth-alert-text">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success">
            <CheckCircle2 size={18} className="auth-alert-icon" />
            <div className="auth-alert-text">{successMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {authMode === 'signup' && (
            <>
              <div className="auth-field-group">
                <label className="auth-label">Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Asad Khan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Designated Role</label>
                <div className="auth-input-wrapper">
                  <ShieldCheck size={18} className="auth-input-icon" />
                  <select
                    className="auth-input auth-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Warehouse Administrator">Warehouse Administrator</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Inventory Specialist">Inventory Specialist</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="auth-field-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field-group">
            <div className="auth-label-row">
              <label className="auth-label">Password</label>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-options-row">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-checkbox"
              />
              <span>Remember this session</span>
            </label>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-loading-spinner" />
            ) : (
              <>
                <span>{authMode === 'signin' ? 'Sign In to Portal' : 'Create WMS Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badges */}
        <div className="auth-security-footer">
          <div className="auth-security-item">
            <ShieldCheck size={14} className="auth-sec-icon" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="auth-security-dot">•</div>
          <div className="auth-security-item">
            <Key size={14} className="auth-sec-icon" />
            <span>Role-Based Permissions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
