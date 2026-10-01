import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ExamPortal from './components/ExamPortal';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import FaceEnrollmentModal from './components/FaceEnrollmentModal';
import EmailInboxModal from './components/EmailInboxModal';
import { ShieldAlert } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const { securityAlerts, clearAlert } = useSocket();

  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'exam' | 'admin'
  const [authModalState, setAuthModalState] = useState({ isOpen: false, tab: 'login' });
  const [isEmailInboxOpen, setIsEmailInboxOpen] = useState(false);

  const handleOpenAuth = (tab = 'login') => {
    setAuthModalState({ isOpen: true, tab });
  };

  const handleCloseAuth = () => {
    setAuthModalState({ isOpen: false, tab: 'login' });
  };

  const handleStartExam = () => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
    } else {
      setCurrentView('exam');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-[#111111] flex flex-col font-sans selection:bg-[#ffe600] selection:text-black">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={handleOpenAuth}
        onOpenEmailInbox={() => setIsEmailInboxOpen(true)}
      />

      {/* Global Socket Security Alert Banner (appears live if brute force happens!) */}
      {securityAlerts.length > 0 && (
        <div className="bg-[#fee2e2] border-b-4 border-black px-4 py-3 flex items-center justify-between text-xs text-black font-bold animate-slideDown sticky top-[57px] z-30 shadow-neo-sm">
          <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
            <ShieldAlert className="w-5 h-5 text-[#dc2626] flex-shrink-0 stroke-[2.5]" />
            <span>
              <strong className="uppercase font-black text-[#b91c1c]">{securityAlerts[0].title || 'Security Intrusion Alert:'}</strong> Target account{' '}
              <span className="font-mono bg-[#ffe600] px-1 border border-black rounded">{securityAlerts[0].username}</span> suffered{' '}
              <strong className="text-[#dc2626] underline">{securityAlerts[0].attemptCount} consecutive failed attempts</strong>. Dispatched security email to real account owner!
            </span>
          </div>
          <button
            onClick={() => clearAlert(0)}
            className="w-6 h-6 rounded bg-white border border-black text-black font-black text-xs flex items-center justify-center hover:bg-[#fca5a5]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Page Views */}
      <div className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onStartExam={handleStartExam}
            onOpenAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'exam' && (
          <ExamPortal onExitExam={() => setCurrentView('landing')} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard onOpenEmailViewer={() => setIsEmailInboxOpen(true)} />
        )}
      </div>

      {/* Auth Modal (Password, Face Login, Sign Up) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={handleCloseAuth}
        initialTab={authModalState.tab}
      />

      {/* Post-Registration Optional Face Enrollment Modal */}
      <FaceEnrollmentModal />

      {/* Dispatched Nodemailer Security Emails Viewer Modal */}
      <EmailInboxModal
        isOpen={isEmailInboxOpen}
        onClose={() => setIsEmailInboxOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
