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
  ShieldAlert
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

  const handleQuickBruteForce = async () => {
    setShowDemoMenu(false);
    try {
      const res = await authApi.triggerDemoBruteForce(user?.username || 'student1');
      setDemoNotice(`🚨 4 Wrong Passwords Triggered! Security alert email dispatched to ${res.emailSentTo} and logged to Admin.`);
      setTimeout(() => setDemoNotice(null), 5000);
    } catch (e) {
      setDemoNotice('Demo trigger failed.');
    }
  };

  const handleQuickSiren = () => {
    setShowDemoMenu(false);
    siren.playSiren(3000);
    setDemoNotice('🔊 Warning Siren Synthesized via Web Audio API (Simulating Looking Away violation).');
    setTimeout(() => setDemoNotice(null), 4000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b-4 border-black px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#ffe600] border-2 border-black shadow-neo flex items-center justify-center text-black font-black group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-neo-md transition-all">
              <Shield className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-black font-display uppercase">
                  Secure<span className="bg-[#ffe600] px-1 border border-black shadow-[1px_1px_0px_#000]">Exam</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-black animate-pulse" />
              </div>
              <p className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">
                AI PROCTORING & BIOMETRICS
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 bg-[#f8f5ee] p-1.5 rounded-xl border-2 border-black shadow-neo-sm text-xs font-bold">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                currentView === 'landing'
                  ? 'bg-[#ffe600] text-black border-2 border-black shadow-neo-sm font-black'
                  : 'text-black hover:bg-white hover:border-black'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setCurrentView('exam')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                currentView === 'exam'
                  ? 'bg-[#38bdf8] text-black border-2 border-black shadow-neo-sm font-black'
                  : 'text-black hover:bg-white hover:border-black'
              }`}
            >
              Candidate Exam
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                currentView === 'admin'
                  ? 'bg-[#f472b6] text-black border-2 border-black shadow-neo-sm font-black'
                  : 'text-black hover:bg-white hover:border-black'
              }`}
            >
              Admin Dashboard
            </button>
          </nav>

          {/* Right Action Tools & Auth */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="px-3.5 py-2 rounded-xl bg-[#fb923c] text-black text-xs font-black neo-btn flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-black fill-black" />
                <span className="hidden sm:inline">⚡ Viva Demo Tools</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl p-2.5 border-3 border-black shadow-neo-lg z-50 text-xs space-y-1.5 animate-fadeIn font-bold">
                  <div className="px-2 py-1 text-[10px] font-mono text-black font-black uppercase border-b-2 border-black bg-[#ffe600] rounded mb-1">
                    Instant Demo Shortcuts
                  </div>
                  <button
                    onClick={handleQuickBruteForce}
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-[#fed7aa] border-2 border-black shadow-neo-sm text-black flex items-center gap-2 transition-all"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
                    <span>Trigger 4 Wrong Passwords (Email Alert)</span>
                  </button>
                  <button
                    onClick={handleQuickSiren}
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-[#fef08a] border-2 border-black shadow-neo-sm text-black flex items-center gap-2 transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-[#eab308]" />
                    <span>Play Proctoring Warning Siren</span>
                  </button>
                  <button
                    onClick={() => { setShowDemoMenu(false); onOpenAuth('face-login'); }}
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-[#bae6fd] border-2 border-black shadow-neo-sm text-black flex items-center gap-2 transition-all"
                  >
                    <ScanFace className="w-4 h-4 text-[#0284c7]" />
                    <span>Test Face Login & Liveness</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dispatched Emails Bell Button */}
            <button
              onClick={onOpenEmailInbox}
              title="View Dispatched Security Alert Emails"
              className="p-2.5 rounded-xl bg-white text-black neo-btn relative"
            >
              <Mail className="w-4 h-4 text-black stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ef4444] border-2 border-black rounded-full" />
            </button>

            {/* User Profile or Login Trigger */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#86efac] border-2 border-black shadow-neo-sm text-xs font-bold">
                  <div className="w-6 h-6 rounded bg-white border border-black flex items-center justify-center font-black text-xs text-black">
                    {user.fullName?.charAt(0) || user.username?.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="font-extrabold text-black block leading-none">{user.username}</span>
                    <span className="text-[10px] text-slate-800 font-mono uppercase font-bold">{user.role}</span>
                  </div>
                  {user.faceEnrolled && (
                    <ScanFace className="w-4 h-4 text-black stroke-[2.5]" title="Face Login Enabled" />
                  )}
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-[#fca5a5] text-black neo-btn"
                >
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 bg-[#ffe600] text-black font-black rounded-xl text-xs neo-btn flex items-center gap-1.5 uppercase tracking-wide"
              >
                <User className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Demo Feedback Notice */}
      {demoNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-[#ffe600] border-3 border-black shadow-neo-lg text-xs font-bold text-black animate-slideUp flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-black flex-shrink-0 mt-0.5 fill-black" />
          <div className="flex-1 leading-snug">{demoNotice}</div>
          <button onClick={() => setDemoNotice(null)} className="text-black font-black text-sm hover:scale-125 transition-transform">✕</button>
        </div>
      )}
    </>
  );
}
