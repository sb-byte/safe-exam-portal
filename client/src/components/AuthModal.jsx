import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import FaceCamera from './FaceCamera';
import {
  Shield,
  KeyRound,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ScanFace,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Activity,
  GraduationCap,
  Building2
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [identifier, setIdentifier] = useState('student1');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student');

  // Google SSO Modal State
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleRole, setCustomGoogleRole] = useState('faculty');

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
        fullName,
        role
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        login(res.user, res.token, role === 'student');
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSOLogin = async (profile) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authApi.googleLogin({
        googleProfile: profile,
        requestedRole: profile.role
      });
      setSuccessMsg(`Authenticated successfully as ${res.user.fullName} (${res.user.role.toUpperCase()})`);
      setTimeout(() => {
        login(res.user, res.token, false);
        setShowGooglePicker(false);
        onClose();
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || 'Google SSO authentication failed.');
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

      setSuccessMsg(`Face Biometric Verified! Distance: ${res.distance}`);
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

  const handleIntrusionSimulation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authApi.simulateIntrusion(identifier || 'student1');
      setFailedAttempts(4);
      setEmailAlertNotice({
        count: 4,
        message: `🚨 Brute force threshold exceeded! 4 failed password attempts simulated on ${identifier}. Security alert email sent via Nodemailer to account owner.`
      });
    } catch (err) {
      setErrorMsg(err.message || 'Intrusion simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 border-4 border-black shadow-neo-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ffe600] border-2 border-black shadow-neo-sm text-black">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black font-display uppercase tracking-tight">
                SecureExam Gateway
              </h2>
              <p className="text-xs font-bold text-slate-700">Enterprise Identity & Biometrics Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#fee2e2] border-2 border-black shadow-neo-sm font-black text-black hover:bg-[#fca5a5] flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Google Workspace SSO Quick Action */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowGooglePicker(true)}
            className="w-full py-3 px-4 bg-white hover:bg-[#f8f5ee] text-black font-black rounded-xl text-xs neo-btn flex items-center justify-center gap-2.5 uppercase tracking-wide border-3 border-black"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google Workspace SSO</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 font-mono font-black text-slate-800">
                Or Sign In with Credentials
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#f8f5ee] border-2 border-black shadow-neo-sm mb-5">
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
              <span>📧 Real-Time Email Dispatched</span>
              <span>•</span>
              <span>📍 Geolocation Forensic Saved</span>
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
                  placeholder="e.g. student1, prof_sharma, or admin"
                  className="w-full pl-9 pr-3 py-2.5 neo-input rounded-xl text-sm font-semibold text-black"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase text-black">
                  Password
                </label>
                <div className="flex gap-1.5 text-[10px] font-mono font-bold">
                  <span className="bg-[#ffe600] px-1.5 py-0.5 border border-black rounded shadow-[1px_1px_0px_#000]">
                    Student: student123
                  </span>
                  <span className="bg-[#c084fc] px-1.5 py-0.5 border border-black rounded shadow-[1px_1px_0px_#000]">
                    Faculty: faculty123
                  </span>
                </div>
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

            {/* Keystroke dynamics badge */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f8f5ee] border-2 border-black text-xs font-bold text-black">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Keystroke Dynamics Biometrics</span>
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

            {/* Intrusion Simulation Shortcut */}
            <div className="pt-2 border-t-2 border-black flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Security Intrusion Test:</span>
              <button
                type="button"
                onClick={handleIntrusionSimulation}
                className="text-black font-black underline bg-[#fed7aa] px-2 py-1 rounded border border-black shadow-[1px_1px_0px_#000] hover:bg-[#fca5a5]"
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
                Target Username for Biometric Match
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

        {/* TAB 3: Sign Up with Role Selector */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-3 rounded-xl border-2 border-black text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    role === 'student'
                      ? 'bg-[#4ade80] text-black shadow-neo-sm'
                      : 'bg-white text-slate-700 hover:bg-[#f8f5ee]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 stroke-[2.5]" />
                  <span>Student / Candidate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`py-2 px-3 rounded-xl border-2 border-black text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    role === 'faculty'
                      ? 'bg-[#c084fc] text-black shadow-neo-sm'
                      : 'bg-white text-slate-700 hover:bg-[#f8f5ee]'
                  }`}
                >
                  <Building2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Faculty / Examiner</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Prof. Maya Lin or Alex Mercer"
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
                placeholder="Choose a unique username"
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
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 neo-input rounded-xl text-sm font-semibold text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#86efac] hover:bg-[#4ade80] text-black font-black rounded-xl text-sm neo-btn-lg flex items-center justify-center gap-2 mt-4 uppercase tracking-wide"
            >
              {loading ? 'Registering...' : `Register as ${role === 'faculty' ? 'Faculty Proctor' : 'Candidate'}`}
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        )}

        {/* Google SSO Account Chooser Dialog */}
        {showGooglePicker && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 border-4 border-black shadow-neo-xl">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <h3 className="font-black text-sm uppercase text-black font-display">
                    Google Workspace SSO Gateway
                  </h3>
                </div>
                <button
                  onClick={() => setShowGooglePicker(false)}
                  className="w-7 h-7 rounded bg-[#fee2e2] border border-black font-black text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs font-bold text-slate-700 mb-3">
                Select your verified organization profile to sign in with single sign-on:
              </p>

              <div className="space-y-2 mb-4">
                {/* Profile 1: Faculty */}
                <button
                  type="button"
                  onClick={() => handleGoogleSSOLogin({
                    email: 'faculty@university.edu',
                    name: 'Prof. Rajesh Sharma',
                    picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=sharma',
                    role: 'faculty'
                  })}
                  className="w-full p-2.5 rounded-xl border-2 border-black bg-white hover:bg-[#c084fc]/20 text-left flex items-center justify-between shadow-neo-sm transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=sharma"
                      alt="Prof Sharma"
                      className="w-8 h-8 rounded-full border border-black bg-[#c084fc]"
                    />
                    <div>
                      <div className="font-extrabold text-xs text-black">Prof. Rajesh Sharma</div>
                      <div className="text-[10px] text-slate-600 font-mono">faculty@university.edu</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#c084fc] text-black border border-black rounded">
                    FACULTY
                  </span>
                </button>

                {/* Profile 2: Enterprise Admin */}
                <button
                  type="button"
                  onClick={() => handleGoogleSSOLogin({
                    email: 'admin@secureexam.edu',
                    name: 'Dr. Sarah Connor',
                    picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah',
                    role: 'admin'
                  })}
                  className="w-full p-2.5 rounded-xl border-2 border-black bg-white hover:bg-[#ffe600]/20 text-left flex items-center justify-between shadow-neo-sm transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=sarah"
                      alt="Sarah Connor"
                      className="w-8 h-8 rounded-full border border-black bg-[#ffe600]"
                    />
                    <div>
                      <div className="font-extrabold text-xs text-black">Dr. Sarah Connor</div>
                      <div className="text-[10px] text-slate-600 font-mono">admin@secureexam.edu</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#ffe600] text-black border border-black rounded">
                    ADMIN
                  </span>
                </button>

                {/* Profile 3: Student Candidate */}
                <button
                  type="button"
                  onClick={() => handleGoogleSSOLogin({
                    email: 'student1@secureexam.edu',
                    name: 'Alex Mercer',
                    picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
                    role: 'student'
                  })}
                  className="w-full p-2.5 rounded-xl border-2 border-black bg-white hover:bg-[#4ade80]/20 text-left flex items-center justify-between shadow-neo-sm transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=alex"
                      alt="Alex Mercer"
                      className="w-8 h-8 rounded-full border border-black bg-[#4ade80]"
                    />
                    <div>
                      <div className="font-extrabold text-xs text-black">Alex Mercer</div>
                      <div className="text-[10px] text-slate-600 font-mono">student1@secureexam.edu</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#4ade80] text-black border border-black rounded">
                    CANDIDATE
                  </span>
                </button>
              </div>

              {/* Or Custom Google Account */}
              <div className="p-3 rounded-xl bg-[#f8f5ee] border-2 border-black">
                <span className="block text-[11px] font-black uppercase text-black mb-2">
                  Or Sign In with Another Google Email
                </span>
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="name@organization.edu"
                  className="w-full px-2.5 py-1.5 neo-input rounded-lg text-xs font-semibold text-black mb-2"
                />
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Your Full Name"
                    className="flex-1 px-2.5 py-1.5 neo-input rounded-lg text-xs font-semibold text-black"
                  />
                  <select
                    value={customGoogleRole}
                    onChange={(e) => setCustomGoogleRole(e.target.value)}
                    className="neo-input rounded-lg text-xs font-bold px-2"
                  >
                    <option value="faculty">Faculty</option>
                    <option value="student">Candidate</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!customGoogleEmail}
                  onClick={() => handleGoogleSSOLogin({
                    email: customGoogleEmail,
                    name: customGoogleName || customGoogleEmail.split('@')[0],
                    picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${customGoogleEmail}`,
                    role: customGoogleRole
                  })}
                  className="w-full py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-black font-black rounded-lg text-xs neo-btn uppercase disabled:opacity-50"
                >
                  Sign In with Custom Google ID
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
