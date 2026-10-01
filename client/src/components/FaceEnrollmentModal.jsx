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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 border-4 border-black shadow-neo-xl overflow-hidden">
        {!isCapturing ? (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ffe600] border-3 border-black shadow-neo flex items-center justify-center text-black">
              <ScanFace className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="neo-badge bg-[#86efac] text-black text-xs px-2.5 py-0.5">Biometric Enrollment</span>
              <h3 className="text-2xl font-black text-black font-display uppercase tracking-tight">
                Add Face Login?
              </h3>
              <p className="text-xs text-slate-700 font-semibold max-w-md mx-auto leading-relaxed">
                Enable instant, secure biometrics for your upcoming exams. Protected by real-time liveness checks and anti-spoof defense.
              </p>
            </div>

            <div className="bg-[#f8f5ee] rounded-xl p-4 border-2 border-black text-left text-xs space-y-1.5 shadow-neo-sm">
              <div className="flex items-center gap-2 text-black font-black">
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span className="uppercase">Biometric Privacy Guarantee (Rule #9):</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-800 font-medium">
                Face data is converted into a 128-dimensional mathematical vector (numbers only). Your original photos are NEVER stored or transmitted.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCapturing(true)}
                className="flex-1 py-3.5 bg-[#ffe600] hover:bg-[#fde047] text-black font-black rounded-xl text-sm neo-btn-lg flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Enable Face Login Now</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFaceEnrollPrompt(false)}
                className="py-3.5 px-5 text-xs font-black text-black rounded-xl hover:bg-slate-100 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-black stroke-[2.5]" />
                <h4 className="text-sm font-black text-black uppercase">Enroll Face Template</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCapturing(false)}
                className="text-xs font-black text-black bg-[#f8f5ee] px-2 py-1 border border-black rounded shadow-[1px_1px_0px_#000]"
              >
                Back
              </button>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#15803d] mx-auto stroke-[3] animate-bounce" />
                <h4 className="text-lg font-black text-black uppercase">Face Enrolled Successfully!</h4>
                <p className="text-xs font-bold text-slate-700">You can now use Face Only login anytime.</p>
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
              <p className="text-xs text-red-600 text-center font-black">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
