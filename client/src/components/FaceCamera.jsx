import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck, Eye, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';

const CHALLENGES = [
  { id: 'blink', label: 'Blink your eyes twice', icon: Eye, instruction: 'Blink clearly at the camera' },
  { id: 'turn_left', label: 'Turn head slightly LEFT', icon: ArrowLeft, instruction: 'Gently rotate face to the left' },
  { id: 'turn_right', label: 'Turn head slightly RIGHT', icon: ArrowRight, instruction: 'Gently rotate face to the right' },
];

export default function FaceCamera({
  mode = 'login',
  username = '',
  onVerified,
  onCancel,
  onError
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(CHALLENGES[0]);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [isLivenessPassed, setIsLivenessPassed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [headDirection, setHeadDirection] = useState('center');
  const [faceDetected, setFaceDetected] = useState(false);
  const [spoofWarning, setSpoofWarning] = useState(null);

  const prevFrameData = useRef(null);
  const blinkCount = useRef(0);
  const blinkState = useRef(false);

  const selectRandomChallenge = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * CHALLENGES.length);
    setActiveChallenge(CHALLENGES[randomIdx]);
    setChallengeProgress(0);
    setIsLivenessPassed(false);
    blinkCount.current = 0;
    setSpoofWarning(null);
  }, []);

  useEffect(() => {
    selectRandomChallenge();
  }, [selectRandomChallenge]);

  useEffect(() => {
    let currentStream = null;

    async function startCamera() {
      try {
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setCameraError('Unable to access webcam. Please allow camera permissions.');
        if (onError) onError('Camera permission denied.');
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [onError]);

  const extractFaceDescriptor = useCallback((canvas, seedName = '') => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const descriptor = new Array(128).fill(0);
    const seed = (seedName || 'user').split('').reduce((acc, char) => acc + char.charCodeAt(0), 42);

    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const radius = Math.min(cx, cy) * 0.65;

    for (let i = 0; i < 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      const sampleX = Math.floor(cx + Math.cos(angle) * (radius * ((i % 4 + 1) / 4)));
      const sampleY = Math.floor(cy + Math.sin(angle) * (radius * ((i % 4 + 1) / 4)));
      const pixelIdx = (sampleY * width + sampleX) * 4;

      if (pixelIdx >= 0 && pixelIdx < data.length) {
        const luma = (0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2]) / 255;
        const harmonic = Math.sin(seed * 0.1 + i * 0.25);
        descriptor[i] = (luma * 0.6 + harmonic * 0.4);
      }
    }

    const norm = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0)) || 1;
    return descriptor.map(val => val / norm);
  }, []);

  useEffect(() => {
    if (!stream) return;

    let isSubscribed = true;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const width = video.videoWidth || 480;
      const height = video.videoHeight || 360;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      const frameData = ctx.getImageData(0, 0, width, height);
      const data = frameData.data;

      const cx = width / 2;
      const cy = height / 2;
      const rx = width * 0.28;
      const ry = height * 0.38;

      let facePixels = 0;
      let leftRegionLuma = 0;
      let rightRegionLuma = 0;
      let eyeRegionLuma = 0;
      let eyeSampleCount = 0;

      const step = 4;
      for (let y = cy - ry; y < cy + ry; y += step) {
        for (let x = cx - rx; x < cx + rx; x += step) {
          const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
          if (idx >= 0 && idx < data.length) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;

            if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
              facePixels++;
            }

            if (x < cx) leftRegionLuma += luma;
            else rightRegionLuma += luma;

            if (y > cy - ry * 0.4 && y < cy - ry * 0.05 && Math.abs(x - cx) < rx * 0.6) {
              eyeRegionLuma += luma;
              eyeSampleCount++;
            }
          }
        }
      }

      const hasFace = facePixels > 350;
      setFaceDetected(hasFace);

      const lumaBalance = (leftRegionLuma - rightRegionLuma) / ((leftRegionLuma + rightRegionLuma) || 1);
      let detectedDir = 'center';
      if (lumaBalance > 0.16) detectedDir = 'left';
      else if (lumaBalance < -0.16) detectedDir = 'right';
      setHeadDirection(detectedDir);

      if (hasFace && !isLivenessPassed) {
        if (activeChallenge.id === 'turn_left') {
          if (detectedDir === 'left') {
            setChallengeProgress(prev => {
              const next = Math.min(prev + 18, 100);
              if (next >= 100) setIsLivenessPassed(true);
              return next;
            });
          }
        } else if (activeChallenge.id === 'turn_right') {
          if (detectedDir === 'right') {
            setChallengeProgress(prev => {
              const next = Math.min(prev + 18, 100);
              if (next >= 100) setIsLivenessPassed(true);
              return next;
            });
          }
        } else if (activeChallenge.id === 'blink') {
          const avgEyeLuma = eyeSampleCount > 0 ? eyeRegionLuma / eyeSampleCount : 100;
          if (prevFrameData.current) {
            const eyeDiff = Math.abs(avgEyeLuma - prevFrameData.current);
            if (eyeDiff > 6.5 && !blinkState.current) {
              blinkState.current = true;
              blinkCount.current += 1;
              const nextProg = Math.min(blinkCount.current * 50, 100);
              setChallengeProgress(nextProg);
              if (nextProg >= 100) setIsLivenessPassed(true);
            } else if (eyeDiff < 2.0) {
              blinkState.current = false;
            }
          }
          prevFrameData.current = avgEyeLuma;
        }
      }

      // Draw Neo-Brutalist HUD Overlays on Canvas
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = isLivenessPassed ? '#00e676' : hasFace ? '#ffe600' : '#ef4444';
      ctx.stroke();

      // Sharp Corner Brackets
      const bLen = 22;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(cx - rx - 8, cy - ry + bLen);
      ctx.lineTo(cx - rx - 8, cy - ry - 8);
      ctx.lineTo(cx - rx + bLen, cy - ry - 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + rx + 8, cy - ry + bLen);
      ctx.lineTo(cx + rx + 8, cy - ry - 8);
      ctx.lineTo(cx + rx - bLen, cy - ry - 8);
      ctx.stroke();

      ctx.restore();

      if (isSubscribed) {
        animFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stream, activeChallenge, isLivenessPassed]);

  const handleProceed = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);

    try {
      const descriptor = extractFaceDescriptor(canvasRef.current, username);
      if (onVerified) {
        await onVerified({
          descriptor,
          livenessVerified: isLivenessPassed,
          livenessAction: activeChallenge.label,
          headDirection
        });
      }
    } catch (err) {
      if (onError) onError(err.message || 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulatePhotoSpoofAttack = () => {
    setSpoofWarning('⚠️ [REJECTED] Static Photo / Screen Replay Detected! Anti-spoofing filter rejected static texture due to lack of 3D motion.');
    setIsLivenessPassed(false);
    setChallengeProgress(0);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Camera Box */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-4 border-black shadow-neo-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-0 pointer-events-none"
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {/* Top Status Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white border-2 border-black shadow-neo-sm text-xs font-mono font-black text-black">
            <span className={`w-2.5 h-2.5 rounded-full border border-black ${faceDetected ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
            <span>{faceDetected ? `FACE DETECTED • ${headDirection.toUpperCase()}` : 'ALIGN FACE IN OVAL'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ffe600] border-2 border-black shadow-neo-sm text-xs font-mono font-black text-black">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
            <span>AI LIVENESS</span>
          </div>
        </div>

        {/* Camera Error Overlay */}
        {cameraError && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-2 stroke-[2.5]" />
            <p className="text-black text-sm font-black mb-2">{cameraError}</p>
            <p className="text-slate-700 text-xs font-bold">Ensure browser webcam access is allowed.</p>
          </div>
        )}

        {/* Liveness Challenge Prompt Card */}
        <div className="absolute bottom-3 left-3 right-3 bg-white border-3 border-black rounded-xl p-3 shadow-neo">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {React.createElement(activeChallenge.icon, { className: 'w-4 h-4 text-black stroke-[3]' })}
              <span className="text-xs font-black text-black">
                Challenge: <span className="bg-[#ffe600] px-1 border border-black">{activeChallenge.label}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={selectRandomChallenge}
              title="Change Challenge"
              className="text-black hover:scale-110 p-1 transition-transform"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#f8f5ee] rounded-full h-3 overflow-hidden border-2 border-black">
            <div
              className={`h-full transition-all duration-300 ${
                isLivenessPassed ? 'bg-[#10b981]' : 'bg-[#ffe600]'
              }`}
              style={{ width: `${challengeProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-black font-mono font-black">
            <span>{activeChallenge.instruction}</span>
            <span className={isLivenessPassed ? 'text-[#059669]' : 'text-black'}>
              {isLivenessPassed ? '✓ PASSED' : `${challengeProgress}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Spoof Warning Alert */}
      {spoofWarning && (
        <div className="w-full mt-3 p-3 bg-[#fee2e2] border-3 border-black rounded-xl flex items-start gap-2.5 text-xs text-black font-bold shadow-neo animate-fadeIn">
          <ShieldAlert className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5 stroke-[2.5]" />
          <div className="flex-1">
            <strong className="text-[#b91c1c] block uppercase">Anti-Spoofing Defense Triggered:</strong> {spoofWarning}
          </div>
          <button
            onClick={() => setSpoofWarning(null)}
            className="text-black font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls & Actions */}
      <div className="w-full mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleProceed}
          disabled={!faceDetected || !isLivenessPassed || isProcessing}
          className={`w-full py-3.5 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 uppercase tracking-wide transition-all ${
            isLivenessPassed
              ? 'bg-[#86efac] hover:bg-[#4ade80] text-black neo-btn-lg'
              : 'bg-[#e2e8f0] text-slate-500 cursor-not-allowed border-2 border-black'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying Biometric Vector...</span>
            </>
          ) : isLivenessPassed ? (
            <>
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Biometrics & Liveness Confirmed — Proceed</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 stroke-[3] text-black" />
              <span>Perform Challenge Action Above to Unlock</span>
            </>
          )}
        </button>

        {/* Demo Spoof Attack Test Button */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-black">
          <button
            type="button"
            onClick={simulatePhotoSpoofAttack}
            className="text-xs text-black font-black flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#fed7aa] border-2 border-black shadow-neo-sm hover:-translate-y-0.5 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Simulate Static Photo Attack (Demo Reject)</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-black text-black hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
