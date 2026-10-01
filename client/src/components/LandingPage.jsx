import React from 'react';
import {
  Shield,
  ScanFace,
  Eye,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Bell,
  Users,
  Award,
  Layers,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ onOpenAuth, onStartExam, onOpenAdmin }) {
  return (
    <div className="space-y-20 pb-20 neo-grid-bg">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Top Sticker Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#ffe600] border-2 border-black shadow-neo-sm text-black text-xs font-black font-mono uppercase mb-8">
          <ShieldCheck className="w-4 h-4 text-black stroke-[3]" />
          <span>AI-POWERED PROCTORING & BIOMETRIC GATEWAY</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-black font-display max-w-4xl mx-auto leading-tight uppercase">
          Next-Generation <br />
          <span className="bg-[#38bdf8] px-3 py-1 border-3 border-black shadow-neo inline-block rotate-[-1deg] my-2">
            Secure Online Exam
          </span> <br />
          & Proctoring Portal
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-800 font-medium max-w-2xl mx-auto leading-relaxed">
          Guarding online assessments against stolen identities, unauthorized impersonation, and unobserved cheating with real-time biometric face verification and multi-sensor behavior monitoring.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartExam}
            className="w-full sm:w-auto px-8 py-4 bg-[#ffe600] hover:bg-[#fde047] text-black font-black rounded-xl text-base neo-btn-lg flex items-center justify-center gap-2.5 uppercase tracking-wide"
          >
            <span>Launch Demo Candidate Exam</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>

          <button
            onClick={onOpenAdmin}
            className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-100 text-black border-3 border-black shadow-neo-lg font-black rounded-xl text-base neo-btn-lg flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <span>Open Admin Controller</span>
            <ChevronRight className="w-5 h-5 stroke-[3] text-black" />
          </button>
        </div>

        {/* Real-time Hero Statistics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
          <div className="bg-[#38bdf8] rounded-2xl p-5 border-3 border-black shadow-neo-md flex flex-col justify-between">
            <span className="text-[11px] font-mono text-black font-black uppercase tracking-wider block mb-1">
              01 / LIVENESS
            </span>
            <div className="text-xl font-black text-black">Dynamic Action</div>
            <p className="text-xs font-semibold text-slate-900 mt-1">Rejects printed photo / phone video spoofing</p>
          </div>

          <div className="bg-[#86efac] rounded-2xl p-5 border-3 border-black shadow-neo-md flex flex-col justify-between">
            <span className="text-[11px] font-mono text-black font-black uppercase tracking-wider block mb-1">
              02 / PROCTORING
            </span>
            <div className="text-xl font-black text-black">Compulsory Cam</div>
            <p className="text-xs font-semibold text-slate-900 mt-1">Immediate blocking modal if video feed drops</p>
          </div>

          <div className="bg-[#c084fc] rounded-2xl p-5 border-3 border-black shadow-neo-md flex flex-col justify-between">
            <span className="text-[11px] font-mono text-black font-black uppercase tracking-wider block mb-1">
              03 / ML ENSEMBLE
            </span>
            <div className="text-xl font-black text-black">SMOTE Balanced</div>
            <p className="text-xs font-semibold text-slate-900 mt-1">Random Forest + Gradient Boosted rules</p>
          </div>

          <div className="bg-[#f87171] rounded-2xl p-5 border-3 border-black shadow-neo-md flex flex-col justify-between">
            <span className="text-[11px] font-mono text-black font-black uppercase tracking-wider block mb-1">
              04 / DEFENSE
            </span>
            <div className="text-xl font-black text-black">3-Strike Lock</div>
            <p className="text-xs font-semibold text-slate-900 mt-1">Instant email dispatch & geo-ip logging</p>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE PROBLEM & OUR SOLUTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="neo-badge bg-[#ffe600] text-black px-3 py-1 text-xs">
            Critical Integrity Gaps
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-black font-display mt-3 uppercase tracking-tight">
            The Problem & Our AI Defense
          </h2>
          <p className="text-sm font-semibold text-slate-700 mt-2">
            Traditional online examinations suffer from proxy impersonation, unobserved cheating, and silent password attacks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Identity */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border-3 border-black shadow-neo-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#fee2e2] border-2 border-black shadow-neo-sm flex items-center justify-center text-black mb-4">
                <AlertTriangle className="w-6 h-6 text-[#dc2626] stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 border border-black rounded inline-block">
                Problem #1: Fake Identity
              </span>
              <h3 className="text-lg font-black text-black mt-2 mb-2">
                Credential Theft & Impersonators
              </h3>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Passwords can be stolen, shared, or sold to proxy exam-takers who log in and write tests for the real candidate without detection.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black bg-[#ecfdf5] rounded-xl p-3.5 border-2 border-black shadow-neo-sm">
              <div className="flex items-center gap-1.5 text-black font-black text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#059669] stroke-[3]" />
                <span>SecureExam Solution:</span>
              </div>
              <p className="text-xs text-slate-800 font-medium">
                128-dimensional face embeddings with random dynamic liveness challenges (blinking, head turns) to defeat static photos.
              </p>
            </div>
          </div>

          {/* Card 2: Cheating */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border-3 border-black shadow-neo-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#fef3c7] border-2 border-black shadow-neo-sm flex items-center justify-center text-black mb-4">
                <Eye className="w-6 h-6 text-[#d97706] stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[#92400e] bg-[#fef3c7] px-2 py-0.5 border border-black rounded inline-block">
                Problem #2: Unmonitored Cheating
              </span>
              <h3 className="text-lg font-black text-black mt-2 mb-2">
                Tab Switching & External Coaching
              </h3>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Without constant proctoring, students search solutions on secondary tabs, consult mobile devices, or receive assistance from peers in the room.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black bg-[#eff6ff] rounded-xl p-3.5 border-2 border-black shadow-neo-sm">
              <div className="flex items-center gap-1.5 text-black font-black text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#2563eb] stroke-[3]" />
                <span>SecureExam Solution:</span>
              </div>
              <p className="text-xs text-slate-800 font-medium">
                Compulsory camera lock, gaze deviation tracking with Web Audio warning sirens, visibilitychange tab detection, and multi-face alarms.
              </p>
            </div>
          </div>

          {/* Card 3: Brute Force */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border-3 border-black shadow-neo-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#f3e8ff] border-2 border-black shadow-neo-sm flex items-center justify-center text-black mb-4">
                <Lock className="w-6 h-6 text-[#7e22ce] stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[#6b21a8] bg-[#f3e8ff] px-2 py-0.5 border border-black rounded inline-block">
                Problem #3: Password Guessing
              </span>
              <h3 className="text-lg font-black text-black mt-2 mb-2">
                Silent Dictionary Attacks
              </h3>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Attackers attempt to crack candidate accounts with automated password guesses, and the legitimate account owner never finds out.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black bg-[#fef2f2] rounded-xl p-3.5 border-2 border-black shadow-neo-sm">
              <div className="flex items-center gap-1.5 text-black font-black text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#dc2626] stroke-[3]" />
                <span>SecureExam Solution:</span>
              </div>
              <p className="text-xs text-slate-800 font-medium">
                3-strike lockout threshold triggers immediate Nodemailer security email alerts and broadcasts attacker IP, city, OS, and browser to the Admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COMPREHENSIVE FEATURE MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border-3 border-black shadow-neo-lg">
          <div className="max-w-2xl mb-8">
            <span className="neo-badge bg-[#86efac] text-black px-3 py-1 text-xs">
              System Telemetry Matrix
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-black font-display mt-2 uppercase tracking-tight">
              Autonomous Cheating & Proctoring Rules
            </h2>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Every telemetry signal and browser violation is logged with candidate name, timestamp, and severity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-4 rounded-xl bg-[#fee2e2] border-2 border-black shadow-neo-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-black shadow-[1px_1px_0px_#000] text-black mt-0.5">
                <AlertTriangle className="w-4 h-4 text-[#dc2626] stroke-[3]" />
              </div>
              <div>
                <strong className="text-black text-sm font-black block">Camera Turned Off</strong>
                <span className="text-slate-800">System immediately renders a non-dismissible blocking popup. Candidate cannot answer or submit until video is restored.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#fef3c7] border-2 border-black shadow-neo-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-black shadow-[1px_1px_0px_#000] text-black mt-0.5">
                <Eye className="w-4 h-4 text-[#d97706] stroke-[3]" />
              </div>
              <div>
                <strong className="text-black text-sm font-black block">Looking Left / Right &gt; 3s</strong>
                <span className="text-slate-800">Computer vision measures eye-luma balance. Dispatches an onscreen warning popup and synthesizes an acoustic siren alert via Web Audio API.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#e0f2fe] border-2 border-black shadow-neo-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-black shadow-[1px_1px_0px_#000] text-black mt-0.5">
                <Globe className="w-4 h-4 text-[#0284c7] stroke-[3]" />
              </div>
              <div>
                <strong className="text-black text-sm font-black block">Tab / Application Switching</strong>
                <span className="text-slate-800">Page Visibility API and window blur events detect when the candidate leaves the exam tab. Flagged and incremented on admin dashboard.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f3e8ff] border-2 border-black shadow-neo-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-black shadow-[1px_1px_0px_#000] text-black mt-0.5">
                <Users className="w-4 h-4 text-[#7e22ce] stroke-[3]" />
              </div>
              <div>
                <strong className="text-black text-sm font-black block">Multiple Faces on Camera</strong>
                <span className="text-slate-800">Identifies unauthorized peers or coaches in the testing space. Categorized as critical violation with +28 penalty points.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#fce7f3] border-2 border-black shadow-neo-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-black shadow-[1px_1px_0px_#000] text-black mt-0.5">
                <Lock className="w-4 h-4 text-[#be185d] stroke-[3]" />
              </div>
              <div>
                <strong className="text-black text-sm font-black block">Clipboard & Right-Click Tampering</strong>
                <span className="text-slate-800">Copy, paste, cut, and right-click context menu calls are intercepted with preventDefault(), preventing answer exfiltration.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#dcfce7] border-2 border-black shadow-neo-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-black shadow-[1px_1px_0px_#000] text-black mt-0.5">
                <Activity className="w-4 h-4 text-[#15803d] stroke-[3]" />
              </div>
              <div>
                <strong className="text-black text-sm font-black block">AI Cheating Risk Score (0-100%)</strong>
                <span className="text-slate-800">Ensemble model computes a weighted score classifying students into Clean/Honest (0-25%), Suspicious (26-60%), or Likely Cheating (&gt;60%).</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ACADEMIC SYLLABUS MAPPING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="neo-badge bg-[#c084fc] text-black px-3 py-1 text-xs">
            AIACS Curriculum Mapping
          </span>
          <h2 className="text-3xl font-black text-black font-display mt-2 uppercase tracking-tight">
            Syllabus Experiments 1 through 8
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            Every required laboratory experiment is implemented as an active feature in the project codebase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#38bdf8] px-2 py-0.5 border border-black rounded inline-block">EXP 1: LOGIN ANALYSIS</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">3 wrong tries, attacker geolocation, device parsing, and automated Nodemailer security email alert.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#86efac] px-2 py-0.5 border border-black rounded inline-block">EXP 2: KEYSTROKE DYNAMICS</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">Captures key dwell and flight times during candidate password entry for typing rhythm validation.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#ffe600] px-2 py-0.5 border border-black rounded inline-block">EXP 3: FACIAL RECOGNITION</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">128-dimensional Euclidean biometric embeddings with threshold &le; 0.45.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#fb923c] px-2 py-0.5 border border-black rounded inline-block">EXP 4: ML FRAUD DETECTION</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">Telemetry anomaly detection across multi-sensor inputs to flag candidate exam cheating.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#c084fc] px-2 py-0.5 border border-black rounded inline-block">EXP 5: ENSEMBLE CLASSIFIERS</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">Combines Random Forest and Gradient Boosting in a Voting Ensemble for robust risk score prediction.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#f472b6] px-2 py-0.5 border border-black rounded inline-block">EXP 6: SMOTE RESAMPLING</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">Synthesizes minority cheating data to rebalance 85:5 honest vs cheating data to 1:1:1 ratio.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#93c5fd] px-2 py-0.5 border border-black rounded inline-block">EXP 7: GAN (SYNTHETIC FACES)</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">Generative synthetic face embedding perturbations tested against biometric matching boundaries.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-black shadow-neo-sm">
            <span className="text-black font-black block mb-1 bg-[#f87171] px-2 py-0.5 border border-black rounded inline-block">EXP 8: FGSM ATTACK & DEFENSE</span>
            <p className="text-slate-800 font-sans font-medium text-xs mt-2">Fast Gradient Sign Method noise defeated by active dynamic liveness and multi-layer thresholding.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4: MADE BY SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-2xl p-8 border-3 border-black shadow-neo-lg">
          <div className="w-14 h-14 rounded-xl bg-[#ffe600] border-2 border-black shadow-neo-sm flex items-center justify-center text-black mx-auto mb-4">
            <Award className="w-7 h-7 stroke-[2.5]" />
          </div>

          <span className="neo-badge bg-[#ffe600] text-black px-3 py-1 text-xs">
            Project Credits & Team
          </span>
          <h3 className="text-2xl font-black text-black font-display mt-2 mb-1 uppercase tracking-tight">
            SecureExam Academic Capstone Project
          </h3>
          <p className="text-xs font-semibold text-slate-700 max-w-xl mx-auto mb-6">
            Developed for the AI & Cybersecurity Course Mini-Project curriculum.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto text-xs font-mono">
            <div className="bg-[#f8f5ee] p-4 rounded-xl border-2 border-black shadow-neo-sm">
              <span className="text-slate-700 block text-[10px] font-bold">DEVELOPED BY:</span>
              <strong className="text-black text-sm font-black font-sans block mt-0.5">Sai Bhadane & Project Team</strong>
              <span className="text-slate-800 font-bold text-[11px]">AI & Cybersecurity Engineering</span>
            </div>

            <div className="bg-[#f8f5ee] p-4 rounded-xl border-2 border-black shadow-neo-sm">
              <span className="text-slate-700 block text-[10px] font-bold">DOMAIN FOCUS:</span>
              <strong className="text-black text-sm font-black font-sans block mt-0.5">AI Biometrics & Proctoring</strong>
              <span className="text-slate-800 font-bold text-[11px]">Ensemble ML • Web Audio • FGSM</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
