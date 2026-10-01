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
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={handleOpenAuth}
        onOpenEmailInbox={() => setIsEmailInboxOpen(true)}
      />

      {/* Global Socket Security Alert Banner (appears live if brute force happens!) */}
      {securityAlerts.length > 0 && (
        <div className="bg-red-950/90 border-b border-red-500/60 px-4 py-2.5 flex items-center justify-between text-xs text-red-200 animate-slideDown sticky top-[57px] z-30 backdrop-blur-md">
          <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
            <span>
              <strong>{securityAlerts[0].title || 'Security Intrusion Alert:'}</strong> Target account{' '}
              <span className="font-mono text-cyan-300 font-bold">{securityAlerts[0].username}</span> suffered{' '}
              <span className="text-red-300 font-bold">{securityAlerts[0].attemptCount} consecutive failed attempts</span>. Dispatched security email to real account owner!
            </span>
          </div>
          <button
            onClick={() => clearAlert(0)}
            className="text-red-400 hover:text-white font-bold text-xs p-1"
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
