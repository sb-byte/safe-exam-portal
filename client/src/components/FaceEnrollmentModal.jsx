import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import FaceCamera from './FaceCamera';
import { ScanFace, ShieldCheck, Sparkles, CheckCircle2, Lock } from 'lucide-react';

export default function FaceEnrollmentModal() {
  const { user, showFaceEnrollPrompt, setShowFaceEnrollPrompt, updateUser } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!showFaceEnrollPrompt || !user) return null;

  const handleEnrollVerified = async ({ descriptor }) => {
    try {
      setError(null);
      const res = await authApi.enrollFace({
        userId: user.id,
        faceDescriptor: descriptor
      });

      updateUser({ faceEnrolled: true, faceDescriptor: descriptor });
      setSuccess(true);
      setTimeout(() => {
        setShowFaceEnrollPrompt(false);
      }, 1400);
    } catch (err) {
      setError(err.message || 'Failed to enroll face.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg cyber-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-cyan-500/40 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500" />

        {!isCapturing ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow">
              <ScanFace className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white font-display">
                Do you want to add Face Login?
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Enable instant, secure biometrics for your upcoming exams. Protected by real-time liveness checks and anti-spoof defense.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-left text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2 text-cyan-300 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Strict Biometric Privacy (Syllabus Requirement #9):</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Face data is converted into a 128-dimensional mathematical vector (numbers only). Your original photos are NEVER stored or transmitted.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCapturing(true)}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enable Face Login Now</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFaceEnrollPrompt(false)}
                className="py-3 px-5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Enroll Your Face Biometric Template</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCapturing(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">Face Biometrics Enrolled Successfully!</h4>
                <p className="text-xs text-slate-400">You can now use Face Only login anytime.</p>
              </div>
            ) : (
              <FaceCamera
                mode="enroll"
                username={user.username}
                onVerified={handleEnrollVerified}
                onCancel={() => setIsCapturing(false)}
                onError={(err) => setError(err)}
              />
            )}

            {error && (
              <p className="text-xs text-red-400 text-center font-medium">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
