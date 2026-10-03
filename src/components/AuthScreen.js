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
  Boxes,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  Key
} from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';

export default function AuthScreen({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Warehouse Manager');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Demo / Quick Login
  const handleDemoLogin = (demoRole = 'Warehouse Administrator') => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('Authenticating as Demo Admin...');
    
    setTimeout(() => {
      const demoUser = {
        id: 'demo-admin-id-01',
        email: 'admin@velora-wms.com',
        user_metadata: {
          full_name: 'Demo Administrator',
          role: demoRole
        },
        app_metadata: {
          provider: 'demo'
        }
      };

      if (rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('velora_auth_user', JSON.stringify(demoUser));
      }

      setLoading(false);
      onLoginSuccess(demoUser);
    }, 450);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
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
        const { data, error } = await signInWithEmail(email, password);

        if (error) {
          // If Supabase credentials failed or user does not exist yet
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. If you do not have an account, click "Create Account" above.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email address in your inbox before signing in, or use Quick Demo Access.');
          }
          throw error;
        }

        if (data?.user) {
          if (rememberMe && typeof window !== 'undefined') {
            localStorage.setItem('velora_auth_user', JSON.stringify(data.user));
          }
          setSuccessMsg('Login successful! Redirecting to dashboard...');
          setTimeout(() => {
            onLoginSuccess(data.user);
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
          // Check if email confirmation is required or already signed in
          if (data.session) {
            if (rememberMe && typeof window !== 'undefined') {
              localStorage.setItem('velora_auth_user', JSON.stringify(data.user));
            }
            setSuccessMsg('Account created successfully! Welcome to Velora WMS.');
            setTimeout(() => {
              onLoginSuccess(data.user);
            }, 600);
          } else {
            setSuccessMsg('Registration successful! Please check your email to confirm your account, or sign in now.');
            setAuthMode('signin');
          }
        }
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
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
              {authMode === 'signin' && (
                <span
                  className="auth-forgot-link"
                  onClick={() => handleDemoLogin('Warehouse Administrator')}
                  title="Click for instant admin access"
                >
                  Need quick access?
                </span>
              )}
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
                tabIndex="-1"
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

        {/* Divider */}
        <div className="auth-divider">
          <span>OR QUICK ACCESS</span>
        </div>

        {/* 1-Click Instant Demo Login */}
        <button
          type="button"
          className="auth-demo-btn"
          onClick={() => handleDemoLogin('Warehouse Administrator')}
          disabled={loading}
        >
          <div className="auth-demo-left">
            <div className="auth-demo-icon-wrap">
              <Sparkles size={16} />
            </div>
            <div className="auth-demo-text">
              <div className="auth-demo-title">⚡ Instant Demo Access (Admin)</div>
              <div className="auth-demo-subtitle">One-click login with full manager privileges</div>
            </div>
          </div>
          <ArrowRight size={16} className="auth-demo-arrow" />
        </button>

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
