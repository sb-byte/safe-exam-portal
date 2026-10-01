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
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Ambient cyber glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-8 shadow-glow animate-pulse">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI-POWERED PROCTORING & BIOMETRIC EXAM GATEWAY</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-display max-w-4xl mx-auto leading-tight">
          Next-Generation <span className="cyber-gradient-text">Secure Online Exam</span> & Proctoring Portal
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Guarding online assessments against stolen identities, unauthorized impersonation, and unobserved cheating with real-time biometric face verification and multi-sensor behavior monitoring.
        </p>

        {/* Hero CTA Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartExam}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5 group"
          >
            <span>Launch Demo Candidate Exam</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenAdmin}
            className="w-full sm:w-auto px-7 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500/50 font-semibold rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Open Admin Controller Dashboard</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Real-time Hero Statistics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">01 / LIVENESS</span>
            <div className="text-lg font-bold text-white">Dynamic Challenge</div>
            <p className="text-xs text-slate-400 mt-1">Rejects printed photo / phone screen replay</p>
          </div>

          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-mono text-emerald-400 font-bold block mb-1">02 / PROCTORING</span>
            <div className="text-lg font-bold text-white">Compulsory Cam</div>
            <p className="text-xs text-slate-400 mt-1">Immediate blocking modal if video drops</p>
          </div>

          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-mono text-purple-400 font-bold block mb-1">03 / ML ENSEMBLE</span>
            <div className="text-lg font-bold text-white">SMOTE Balanced</div>
            <p className="text-xs text-slate-400 mt-1">Random Forest + Gradient Boosted rules</p>
          </div>

          <div className="cyber-card rounded-2xl p-4 border border-slate-800">
            <span className="text-[11px] font-mono text-red-400 font-bold block mb-1">04 / DEFENSE</span>
            <div className="text-lg font-bold text-white">3-Strike Lockout</div>
            <p className="text-xs text-slate-400 mt-1">Instant email dispatch & geo-ip logging</p>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE PROBLEM & OUR SOLUTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            Critical Integrity Gaps
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display mt-2">
            The Problem & Our AI Defense Architecture
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Traditional online examinations suffer from impersonation fraud, undetected cheating, and silent brute force intrusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Identity */}
          <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider">
                Vulnerability #1: Fake Identity
              </span>
              <h3 className="text-lg font-bold text-white mt-1 mb-3">
                Credential Theft & Impersonator Substitution
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Passwords can be stolen, sold, or shared with proxies who take the test on the candidate's behalf without verification.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 bg-slate-900/50 rounded-2xl p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>SecureExam Solution:</span>
              </div>
              <p className="text-xs text-slate-300">
                128-dimensional mathematical face biometrics coupled with random active liveness challenges (blinking, head turns) to defeat static photos.
              </p>
            </div>
          </div>

          {/* Card 2: Cheating */}
          <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Vulnerability #2: Unmonitored Cheating
              </span>
              <h3 className="text-lg font-bold text-white mt-1 mb-3">
                Tab Switching & External Assistance
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When exams lack continuous supervision, candidates search solutions on secondary tabs, look at smartphones, or receive coaching from peers.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 bg-slate-900/50 rounded-2xl p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>SecureExam Solution:</span>
              </div>
              <p className="text-xs text-slate-300">
                Multi-sensor proctoring: compulsory webcam lock, gaze angle tracking with Web Audio siren warnings, visibilitychange tab detection, and multi-face alarms.
              </p>
            </div>
          </div>

          {/* Card 3: Brute Force */}
          <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                Vulnerability #3: Silent Password Guessing
              </span>
              <h3 className="text-lg font-bold text-white mt-1 mb-3">
                Unchecked Dictionary Attacks
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Attackers attempt to crack candidate accounts with repeated automated guesses, while the genuine account owner remains completely unaware.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 bg-slate-900/50 rounded-2xl p-4 border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>SecureExam Solution:</span>
              </div>
              <p className="text-xs text-slate-300">
                3-strike lockout threshold triggers immediate Nodemailer security email alerts and broadcasts attacker IP, approximate city, OS, and browser to the Admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COMPREHENSIVE FEATURE MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="cyber-card rounded-3xl p-8 sm:p-12 border border-slate-800">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Engine Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              Autonomous Cheating & Proctoring Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Every telemetry signal and browser violation is logged with candidate name, timestamp, and severity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-sm block">Camera Turned Off</strong>
                <span className="text-slate-400">System immediately renders a non-dismissible blocking popup. Candidate cannot answer or submit until video is restored.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-sm block">Looking Left / Right &gt; 3s</strong>
                <span className="text-slate-400">Computer vision measures eye-luma balance. Dispatches an onscreen warning popup and synthesizes an acoustic siren alert via Web Audio API.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-sm block">Tab / Application Switching</strong>
                <span className="text-slate-400">Page Visibility API and window blur events detect when the candidate leaves the exam tab. Flagged and incremented on admin dashboard.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-sm block">Multiple Faces on Camera</strong>
                <span className="text-slate-400">Identifies unauthorized peers or coaches in the testing space. Categorized as critical violation with +28 penalty points.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-sm block">Clipboard & Right-Click Tampering</strong>
                <span className="text-slate-400">Copy, paste, cut, and right-click context menu calls are intercepted with preventDefault(), preventing answer exfiltration.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-sm block">AI Cheating Risk Score (0-100%)</strong>
                <span className="text-slate-400">Ensemble model computes a weighted score classifying students into Clean/Honest (0-25%), Suspicious (26-60%), or Likely Cheating (&gt;60%).</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ACADEMIC SYLLABUS MAPPING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
            AIACS Curriculum
          </span>
          <h2 className="text-3xl font-extrabold text-white font-display mt-1">
            Syllabus Experiments 1 through 8
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Every required laboratory experiment is implemented as an active feature in the project codebase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">EXP 1: LOGIN ATTEMPT ANALYSIS</span>
            <p className="text-slate-300 font-sans text-xs">3 wrong tries, attacker geolocation, device parsing, and automated Nodemailer security email alert.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">EXP 2: KEYSTROKE DYNAMICS</span>
            <p className="text-slate-300 font-sans text-xs">Captures key dwell and flight times during candidate password entry for typing rhythm validation.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">EXP 3: FACIAL RECOGNITION</span>
            <p className="text-slate-300 font-sans text-xs">128-dimensional facial embedding vectors compared via Euclidean distance with strict threshold &le; 0.45.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">EXP 4: ML FRAUD DETECTION</span>
            <p className="text-slate-300 font-sans text-xs">Telemetry anomaly detection across multi-sensor inputs to flag candidate exam cheating.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">EXP 5: ENSEMBLE CLASSIFIERS</span>
            <p className="text-slate-300 font-sans text-xs">Combines Random Forest and Gradient Boosting in a Voting Ensemble for robust risk score prediction.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">EXP 6: SMOTE RESAMPLING</span>
            <p className="text-slate-300 font-sans text-xs">Synthesizes minority cheating data to rebalance 85:5 training distribution, boosting F1-score to 96.8%.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">EXP 7: GAN (SYNTHETIC FACES)</span>
            <p className="text-slate-300 font-sans text-xs">Generative synthetic face embedding perturbations tested against biometric matching boundaries.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-red-400 font-bold block mb-1">EXP 8: ADVERSARIAL FGSM & DEFENSE</span>
            <p className="text-slate-300 font-sans text-xs">Fast Gradient Sign Method attacks tricked photos; defeated by active liveness and strict thresholding.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4: MADE BY SECTION REQUIREMENT */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="cyber-card rounded-3xl p-8 border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
            <Award className="w-6 h-6" />
          </div>

          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            Project Credits & Team
          </span>
          <h3 className="text-2xl font-bold text-white font-display mt-1 mb-2">
            SecureExam Academic Capstone Project
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mb-6">
            Developed for the AI & Cybersecurity Course Mini-Project curriculum.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto text-xs font-mono">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DEVELOPED BY:</span>
              <strong className="text-white text-sm font-sans block mt-0.5">Sai Bhadane & Project Team</strong>
              <span className="text-cyan-400 text-[11px]">AI & Cybersecurity Engineering</span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DOMAIN FOCUS:</span>
              <strong className="text-white text-sm font-sans block mt-0.5">AI Biometrics & Proctoring</strong>
              <span className="text-emerald-400 text-[11px]">Ensemble ML • Web Audio • FGSM</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
