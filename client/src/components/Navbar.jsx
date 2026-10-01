import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import {
  Shield,
  ScanFace,
  Lock,
  Mail,
  ShieldAlert,
  LogOut,
  UserCheck,
  GraduationCap,
  Building2,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  onOpenAuth,
  onOpenEmailInbox
}) {
  const { user, isAuthenticated, isAdmin, isFaculty, canAccessAdmin, logout } = useAuth();
  const [securityNotice, setSecurityNotice] = useState(null);

  const handleSimulateIntrusion = async () => {
    try {
      const res = await authApi.simulateIntrusion(user?.username || 'student1');
      setSecurityNotice(`🚨 Enterprise Intrusion Alert Dispatched: Security notification sent to ${res.emailSentTo} and logged to SOC.`);
      setTimeout(() => setSecurityNotice(null), 5000);
    } catch (e) {
      setSecurityNotice('Security simulation failed.');
    }
  };

  const handleAdminStudioClick = () => {
    if (!isAuthenticated) {
      onOpenAuth('login');
    } else if (canAccessAdmin) {
      setCurrentView('admin');
    } else {
      setSecurityNotice('⚠️ Access Restricted: Administrative & Question Studio is reserved for Faculty and Organization Admins.');
      setTimeout(() => setSecurityNotice(null), 4000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b-4 border-black px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Enterprise Brand */}
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#ffe600] border-3 border-black shadow-neo flex items-center justify-center text-black font-black group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-neo-md transition-all">
              <Shield className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-black font-display uppercase">
                  Secure<span className="bg-[#ffe600] px-1.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_#000] rounded-sm">Exam</span>
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-[#4ade80] text-black border border-black rounded shadow-[1px_1px_0px_#000]">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">
                AI PROCTORING & BIOMETRICS
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 bg-[#f8f5ee] p-1.5 rounded-xl border-3 border-black shadow-neo-sm text-xs font-bold">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                currentView === 'landing'
                  ? 'bg-[#ffe600] text-black border-2 border-black shadow-neo-sm font-black'
                  : 'text-black hover:bg-white'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setCurrentView('exam')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                currentView === 'exam'
                  ? 'bg-[#38bdf8] text-black border-2 border-black shadow-neo-sm font-black'
                  : 'text-black hover:bg-white'
              }`}
            >
              Examination Gateway
            </button>

            <button
              onClick={handleAdminStudioClick}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'bg-[#c084fc] text-black border-2 border-black shadow-neo-sm font-black'
                  : 'text-black hover:bg-white'
              }`}
            >
              {!canAccessAdmin && <Lock className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>Admin & Question Studio</span>
            </button>
          </nav>

          {/* Right Action Tools & Auth Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Security Intrusion Test for Admins/Faculty */}
            {canAccessAdmin && (
              <button
                type="button"
                onClick={handleSimulateIntrusion}
                title="Simulate intrusion attack to test brute force lockout and email alert"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fb923c] text-black text-xs font-black neo-btn"
              >
                <ShieldAlert className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Test Intrusion Lock</span>
              </button>
            )}

            {/* Dispatched Emails Bell Button */}
            <button
              onClick={onOpenEmailInbox}
              title="View Security Alerts & Dispatched Emails"
              className="p-2.5 rounded-xl bg-white text-black neo-btn relative"
            >
              <Mail className="w-4 h-4 text-black stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#fb7185] border-2 border-black rounded-full" />
            </button>

            {/* User Profile or Login Trigger */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-neo-sm text-xs font-bold">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || user.username}
                      className="w-6 h-6 rounded-full border border-black object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#ffe600] border border-black flex items-center justify-center font-black text-xs text-black">
                      {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="hidden sm:block text-left">
                    <span className="font-extrabold text-black block leading-none truncate max-w-[120px]">
                      {user.fullName || user.username}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase font-black px-1 rounded border border-black inline-block mt-0.5 ${
                        user.role === 'admin'
                          ? 'bg-[#ffe600] text-black'
                          : user.role === 'faculty'
                          ? 'bg-[#c084fc] text-black'
                          : 'bg-[#4ade80] text-black'
                      }`}
                    >
                      {user.role === 'admin' ? 'ADMIN' : user.role === 'faculty' ? 'FACULTY' : 'CANDIDATE'}
                    </span>
                  </div>

                  {user.faceEnrolled && (
                    <ScanFace className="w-4 h-4 text-black stroke-[2.5]" title="Face Biometrics Verified" />
                  )}
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-[#fb7185] text-black neo-btn"
                >
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 bg-[#ffe600] text-black font-black rounded-xl text-xs neo-btn flex items-center gap-2 uppercase tracking-wide"
              >
                {/* Google G icon indicator */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign In / SSO</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Alert / Security Notice */}
      {securityNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-[#ffe600] border-3 border-black shadow-neo-lg text-xs font-bold text-black animate-slideUp flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-black flex-shrink-0 mt-0.5 fill-black" />
          <div className="flex-1 leading-snug">{securityNotice}</div>
          <button
            onClick={() => setSecurityNotice(null)}
            className="text-black font-black text-sm hover:scale-125 transition-transform"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
