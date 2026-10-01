import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { siren } from '../utils/AudioSiren';
import { authApi } from '../services/api';
import {
  Shield,
  ScanFace,
  Lock,
  Mail,
  Zap,
  Volume2,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Laptop
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  onOpenAuth,
  onOpenEmailInbox
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [demoNotice, setDemoNotice] = useState(null);

  // Quick 1-Click Demo Trigger: 4 Wrong Passwords
  const handleQuickBruteForce = async () => {
    setShowDemoMenu(false);
    try {
      const res = await authApi.triggerDemoBruteForce(user?.username || 'student1');
      setDemoNotice(`🚨 4 Wrong Passwords Triggered! Nodemailer security alert sent to ${res.emailSentTo} and logged to Admin.`);
      setTimeout(() => setDemoNotice(null), 5000);
    } catch (e) {
      setDemoNotice('Demo trigger failed.');
    }
  };

  // Quick 1-Click Demo Trigger: Siren
  const handleQuickSiren = () => {
    setShowDemoMenu(false);
    siren.playSiren(3000);
    setDemoNotice('🔊 Warning Siren Synthesized via Web Audio API (Simulating Looking Away violation).');
    setTimeout(() => setDemoNotice(null), 4000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 cyber-glass border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-display">
                  Secure<span className="text-cyan-400">Exam</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] font-mono text-slate-400 -mt-0.5">
                AI PROCTORING & BIOMETRIC AUTH
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                currentView === 'landing' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setCurrentView('exam')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                currentView === 'exam' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Candidate Exam
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                currentView === 'admin' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Admin Dashboard
            </button>
          </nav>

          {/* Right Action Tools & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Quick Demo Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">⚡ Viva Demo Tools</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-64 cyber-card rounded-2xl p-2 border border-slate-700 shadow-2xl z-50 text-xs space-y-1 animate-fadeIn">
                  <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800">
                    Instant Demo Shortcuts
                  </div>
                  <button
                    onClick={handleQuickBruteForce}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Trigger 4 Wrong Passwords (Email Alert)</span>
                  </button>
                  <button
                    onClick={handleQuickSiren}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Play Proctoring Warning Siren</span>
                  </button>
                  <button
                    onClick={() => { setShowDemoMenu(false); onOpenAuth('face-login'); }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                  >
                    <ScanFace className="w-4 h-4 text-cyan-400" />
                    <span>Test Face Login & Liveness</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dispatched Emails Bell Button */}
            <button
              onClick={onOpenEmailInbox}
              title="View Dispatched Security Alert Emails"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors relative"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* User Profile or Login Trigger */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                    {user.fullName?.charAt(0) || user.username?.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="font-semibold text-slate-200 block leading-none">{user.username}</span>
                    <span className="text-[10px] text-cyan-400 font-mono">{user.role}</span>
                  </div>
                  {user.faceEnrolled && (
                    <ScanFace className="w-3.5 h-3.5 text-emerald-400" title="Face Login Enabled" />
                  )}
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Demo Feedback Notice */}
      {demoNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-3.5 rounded-2xl cyber-card border border-cyan-500/50 shadow-2xl text-xs text-cyan-200 animate-slideUp flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{demoNotice}</div>
          <button onClick={() => setDemoNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </>
  );
}
