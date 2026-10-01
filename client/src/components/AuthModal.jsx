import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import FaceCamera from './FaceCamera';
import { Shield, KeyRound, User, Mail, Lock, AlertCircle, CheckCircle2, ScanFace, ArrowRight, ShieldAlert, Sparkles, Activity } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login } = useAuth();
  const [tab, setTab] = useState(initialTab); // 'login' | 'signup' | 'face-login'
  const [identifier, setIdentifier] = useState('student1');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  // Status & states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [emailAlertNotice, setEmailAlertNotice] = useState(null);

  // Keystroke dynamics tracking (Syllabus Exp 2)
  const keyPressTimestamps = useRef([]);
  const handlePasswordKeyDown = (e) => {
    keyPressTimestamps.current.push({
      key: e.key,
      time: Date.now()
    });
  };

  if (!isOpen) return null;

  // Handle Standard Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setEmailAlertNotice(null);

    // Compute keystroke intervals (dwell/flight times)
    const keystrokeIntervals = [];
    for (let i = 1; i < keyPressTimestamps.current.length; i++) {
      keystrokeIntervals.push(keyPressTimestamps.current[i].time - keyPressTimestamps.current[i - 1].time);
    }
    const avgTypingSpeedMs = keystrokeIntervals.length > 0
      ? Math.round(keystrokeIntervals.reduce((a, b) => a + b, 0) / keystrokeIntervals.length)
      : 120;

    try {
      const res = await authApi.login({
        identifier,
        password,
        keystrokeMetrics: { avgTypingSpeedMs, totalKeystrokes: keyPressTimestamps.current.length }
      });

      setSuccessMsg(res.message);
      setFailedAttempts(0);
      setTimeout(() => {
        login(res.user, res.token, false);
        onClose();
      }, 600);
    } catch (err) {
      const data = err.data || {};
      const count = data.failedAttempts || failedAttempts + 1;
      setFailedAttempts(count);

      if (data.thresholdExceeded) {
        setEmailAlertNotice({
          count,
          message: data.message
        });
      }
      setErrorMsg(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
      keyPressTimestamps.current = [];
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authApi.register({
        username,
        email,
        password,
        fullName
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        // Logged in automatically + promptFaceEnrollment: true
        login(res.user, res.token, true);
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Face Only Login
  const handleFaceLoginVerified = async ({ descriptor, livenessVerified, livenessAction }) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authApi.faceLogin({
        username: identifier || 'student1',
        faceDescriptor: descriptor,
        livenessVerified,
        livenessAction
      });

      setSuccessMsg(`Face Authentication Verified! Biometric distance: ${res.distance}`);
      setTimeout(() => {
        login(res.user, res.token, false);
        onClose();
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Face authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Trigger: Simulate 4 Wrong Passwords
  const handleDemoBruteForce = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authApi.triggerDemoBruteForce(identifier || 'student1');
      setFailedAttempts(4);
      setEmailAlertNotice({
        count: 4,
        message: `🚨 Brute force threshold exceeded! ${res.message}. Real account owner notified via Nodemailer.`
      });
    } catch (err) {
      setErrorMsg(err.message || 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg cyber-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-cyan-500/30 overflow-hidden">
        {/* Glowing cyber header line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">SecureExam Portal</h2>
              <p className="text-xs text-slate-400">AI Identity & Biometric Verification Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password Login</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('face-login'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'face-login' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Face Only Login</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'signup' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Global Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Brute Force Security Email Alert Banner */}
        {emailAlertNotice && (
          <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-red-950 to-amber-950 border border-red-500/60 text-xs text-red-200">
            <div className="flex items-center gap-2 font-bold text-red-300 mb-1">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span>3+ FAILED PASSWORDS DETECTED ({emailAlertNotice.count} TRIES)</span>
            </div>
            <p className="text-slate-300 leading-relaxed mb-2">
              {emailAlertNotice.message}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-300 font-mono">
              <span>📧 Security Email Alert Sent</span>
              <span>•</span>
              <span>📍 Attacker Geolocation Logged to Admin</span>
            </div>
          </div>
        )}

        {/* TAB 1: Password Login */}
        {tab === 'login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username or Email Address
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. student1 or admin"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Default: <span className="text-cyan-400">student123</span> / <span className="text-cyan-400">admin123</span>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onKeyDown={handlePasswordKeyDown}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Keystroke dynamics badge (Syllabus Exp 2) */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Keystroke Dynamics (Exp 2)</span>
              </span>
              <span className="font-mono text-cyan-300">Active Monitor</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In with Password'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Demo Helper: 4 Wrong Passwords Button */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Examiner Demo Tool:</span>
              <button
                type="button"
                onClick={handleDemoBruteForce}
                className="text-amber-400 hover:text-amber-300 underline font-medium"
              >
                ⚡ Trigger 4 Wrong Passwords (Test Alert & Email)
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Face Only Login */}
        {tab === 'face-login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Enter Username to Match Face Biometrics
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. student1"
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-3"
              />
            </div>

            <FaceCamera
              mode="login"
              username={identifier}
              onVerified={handleFaceLoginVerified}
              onError={(err) => setErrorMsg(err)}
            />
          </div>
        )}

        {/* TAB 3: Sign Up */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a secure password"
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Creating Account...' : 'Register & Auto Log In'}
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
