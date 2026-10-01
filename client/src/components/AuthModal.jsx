import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import FaceCamera from './FaceCamera';
import { Shield, KeyRound, User, Mail, Lock, AlertCircle, CheckCircle2, ScanFace, ArrowRight, ShieldAlert, Sparkles, Activity } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [identifier, setIdentifier] = useState('student1');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [emailAlertNotice, setEmailAlertNotice] = useState(null);

  const keyPressTimestamps = useRef([]);
  const handlePasswordKeyDown = (e) => {
    keyPressTimestamps.current.push({
      key: e.key,
      time: Date.now()
    });
  };

  if (!isOpen) return null;

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setEmailAlertNotice(null);

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
        login(res.user, res.token, true);
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 border-4 border-black shadow-neo-xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ffe600] border-2 border-black shadow-neo-sm text-black">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black font-display uppercase tracking-tight">SecureExam Gateway</h2>
              <p className="text-xs font-bold text-slate-700">Identity & Biometrics Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#fee2e2] border-2 border-black shadow-neo-sm font-black text-black hover:bg-[#fca5a5] flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#f8f5ee] border-2 border-black shadow-neo-sm mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login'
                ? 'bg-[#ffe600] text-black border-2 border-black shadow-neo-sm'
                : 'text-black hover:bg-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('face-login'); setErrorMsg(null); }}
            className={`py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'face-login'
                ? 'bg-[#38bdf8] text-black border-2 border-black shadow-neo-sm'
                : 'text-black hover:bg-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Face Only</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMsg(null); }}
            className={`py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'signup'
                ? 'bg-[#86efac] text-black border-2 border-black shadow-neo-sm'
                : 'text-black hover:bg-white'
            }`}
          >
            <User className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Global Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#fee2e2] border-2 border-black shadow-neo-sm flex items-start gap-2.5 text-xs font-bold text-black">
            <AlertCircle className="w-4 h-4 text-[#dc2626] flex-shrink-0 mt-0.5 stroke-[3]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#dcfce7] border-2 border-black shadow-neo-sm flex items-start gap-2.5 text-xs font-bold text-black">
            <CheckCircle2 className="w-4 h-4 text-[#15803d] flex-shrink-0 mt-0.5 stroke-[3]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Brute Force Security Email Alert Banner */}
        {emailAlertNotice && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#fef2f2] border-3 border-black shadow-neo text-xs text-black">
            <div className="flex items-center gap-2 font-black text-[#dc2626] mb-1">
              <ShieldAlert className="w-4 h-4 stroke-[3]" />
              <span className="uppercase">3+ FAILED PASSWORDS DETECTED ({emailAlertNotice.count} TRIES)</span>
            </div>
            <p className="font-semibold text-slate-800 leading-snug mb-2">
              {emailAlertNotice.message}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-900 bg-white p-2 rounded-lg border border-black">
              <span>📧 Email Alert Dispatched</span>
              <span>•</span>
              <span>📍 Geolocation Sent to Admin</span>
            </div>
          </div>
        )}

        {/* TAB 1: Password Login */}
        {tab === 'login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3.5 text-black stroke-[2.5]" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. student1 or admin"
                  className="w-full pl-9 pr-3 py-2.5 neo-input rounded-xl text-sm font-semibold text-black"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase text-black">
                  Password
                </label>
                <span className="text-[11px] font-mono font-bold bg-[#ffe600] px-1.5 py-0.5 border border-black rounded shadow-[1px_1px_0px_#000]">
                  Default: student123
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-black stroke-[2.5]" />
                <input
                  type="password"
                  required
                  value={password}
                  onKeyDown={handlePasswordKeyDown}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2.5 neo-input rounded-xl text-sm font-semibold text-black"
                />
              </div>
            </div>

            {/* Keystroke dynamics badge (Syllabus Exp 2) */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f8f5ee] border-2 border-black text-xs font-bold text-black">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Keystroke Dynamics (Exp 2)</span>
              </span>
              <span className="font-mono bg-[#86efac] px-2 py-0.5 border border-black rounded text-[10px]">
                ACTIVE
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#ffe600] hover:bg-[#fde047] text-black font-black rounded-xl text-sm neo-btn-lg flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              {loading ? 'Authenticating...' : 'Sign In with Password'}
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Demo Helper: 4 Wrong Passwords Button */}
            <div className="pt-2 border-t-2 border-black flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Examiner Demo:</span>
              <button
                type="button"
                onClick={handleDemoBruteForce}
                className="text-black font-black underline bg-[#fed7aa] px-2 py-1 rounded border border-black shadow-[1px_1px_0px_#000]"
              >
                ⚡ Trigger 4 Wrong Passwords
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Face Only Login */}
        {tab === 'face-login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1.5">
                Target Username for Face Match
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. student1"
                className="w-full px-3 py-2 neo-input rounded-xl text-sm font-semibold text-black mb-3"
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
              <label className="block text-xs font-black uppercase text-black mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-3 py-2 neo-input rounded-xl text-sm font-semibold text-black"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-3 py-2 neo-input rounded-xl text-sm font-semibold text-black"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                className="w-full px-3 py-2 neo-input rounded-xl text-sm font-semibold text-black"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                className="w-full px-3 py-2 neo-input rounded-xl text-sm font-semibold text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#86efac] hover:bg-[#4ade80] text-black font-black rounded-xl text-sm neo-btn-lg flex items-center justify-center gap-2 mt-4 uppercase tracking-wide"
            >
              {loading ? 'Creating Account...' : 'Register & Auto Log In'}
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
