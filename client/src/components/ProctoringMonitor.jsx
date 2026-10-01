import React, { useRef, useEffect, useState, useCallback } from 'react';
import { examApi } from '../services/api';
import { siren } from '../utils/AudioSiren';
import { Camera, CameraOff, AlertTriangle, ShieldAlert, Volume2, VolumeX, Eye, UserX, Users, EyeOff } from 'lucide-react';

export default function ProctoringMonitor({
  studentId,
  studentName,
  onCameraStatusChange,
  isCameraCompulsoryBlocked,
  setIsCameraCompulsoryBlocked
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [headPose, setHeadPose] = useState('center');
  const [faceCount, setFaceCount] = useState(1);
  const [warningModal, setWarningModal] = useState(null);
  const [isSirenMuted, setIsSirenMuted] = useState(false);

  const lookAwayStartRef = useRef(null);
  const lookAwayLoggedRef = useRef(false);
  const noFaceStartRef = useRef(null);
  const noFaceLoggedRef = useRef(false);

  const logViolation = useCallback(async (type, details, severity = 'WARNING', duration = null) => {
    try {
      await examApi.logEvent({
        studentId,
        studentName,
        type,
        details,
        severity,
        duration
      });
    } catch (err) {
      console.warn('Failed to log proctoring violation:', err);
    }
  }, [studentId, studentName]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      setCameraActive(true);
      setIsCameraCompulsoryBlocked(false);
      if (onCameraStatusChange) onCameraStatusChange(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraActive(false);
      setIsCameraCompulsoryBlocked(true);
      if (onCameraStatusChange) onCameraStatusChange(false);
      logViolation('CAMERA_OFF', 'Camera access blocked or permission denied by student', 'CRITICAL');
    }
  }, [logViolation, onCameraStatusChange, setIsCameraCompulsoryBlocked]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraActive(false);
    setIsCameraCompulsoryBlocked(true);
    if (onCameraStatusChange) onCameraStatusChange(false);
    logViolation('CAMERA_OFF', 'Camera turned off or disconnected during exam', 'CRITICAL');
  }, [stream, logViolation, onCameraStatusChange, setIsCameraCompulsoryBlocked]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      siren.stop();
    };
  }, []);

  useEffect(() => {
    if (!stream || !cameraActive) return;

    let isSubscribed = true;

    const process = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(process);
        return;
      }

      const w = 320;
      const h = 240;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);

      const frameData = ctx.getImageData(0, 0, w, h);
      const data = frameData.data;

      let facePixels = 0;
      let leftLuma = 0;
      let rightLuma = 0;

      const cx = w / 2;
      const cy = h / 2;
      for (let y = 30; y < h - 30; y += 4) {
        for (let x = 30; x < w - 30; x += 4) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
            facePixels++;
            if (x < cx) leftLuma += luma;
            else rightLuma += luma;
          }
        }
      }

      const hasFace = facePixels > 240;
      const lumaBalance = (leftLuma - rightLuma) / ((leftLuma + rightLuma) || 1);

      let currentPose = 'center';
      if (lumaBalance > 0.18) currentPose = 'left';
      else if (lumaBalance < -0.18) currentPose = 'right';

      setHeadPose(currentPose);

      const now = Date.now();

      // Looking left or right for long (> 3 seconds)
      if (currentPose !== 'center' && hasFace) {
        if (!lookAwayStartRef.current) {
          lookAwayStartRef.current = now;
        } else if (now - lookAwayStartRef.current > 3000 && !lookAwayLoggedRef.current) {
          lookAwayLoggedRef.current = true;
          const durationSec = Math.round((now - lookAwayStartRef.current) / 1000);

          siren.playSiren(3000);

          setWarningModal({
            title: '⚠️ Gaze Deviation / Looking Away Detected!',
            message: `You have been looking ${currentPose.toUpperCase()} for more than 3 seconds. Focus on the screen.`,
            type: 'LOOKING_AWAY'
          });

          logViolation('LOOKING_AWAY', `Student looked ${currentPose} for ${durationSec}s`, 'WARNING', durationSec);
        }
      } else {
        lookAwayStartRef.current = null;
        lookAwayLoggedRef.current = false;
      }

      // No face on camera
      if (!hasFace) {
        if (!noFaceStartRef.current) {
          noFaceStartRef.current = now;
        } else if (now - noFaceStartRef.current > 3500 && !noFaceLoggedRef.current) {
          noFaceLoggedRef.current = true;
          logViolation('NO_FACE', 'No face detected in video frame for over 3.5s', 'WARNING');
        }
      } else {
        noFaceStartRef.current = null;
        noFaceLoggedRef.current = false;
      }

      if (isSubscribed) {
        animFrameRef.current = requestAnimationFrame(process);
      }
    };

    animFrameRef.current = requestAnimationFrame(process);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stream, cameraActive, logViolation]);

  const toggleMute = () => {
    const muted = siren.toggleMute();
    setIsSirenMuted(muted);
  };

  const triggerManualGazeViolation = () => {
    siren.playSiren(3000);
    setWarningModal({
      title: '⚠️ [DEMO] Looking Away Violation Triggered!',
      message: 'Student detected looking away from screen for 4 seconds. Siren sound synthesized via Web Audio API.',
      type: 'LOOKING_AWAY'
    });
    logViolation('LOOKING_AWAY', 'Looking away from screen for 4s (Demo Siren Trigger)', 'WARNING', 4);
  };

  const triggerMultipleFacesViolation = () => {
    setFaceCount(2);
    setWarningModal({
      title: '🚨 Multiple Faces Detected on Camera!',
      message: 'More than one person detected in the webcam view. Unauthorized assistance flagged.',
      type: 'MULTIPLE_FACES'
    });
    logViolation('MULTIPLE_FACES', 'Second face detected in candidate environment', 'CRITICAL');
    setTimeout(() => setFaceCount(1), 5000);
  };

  return (
    <>
      {/* Floating Picture-in-Picture Proctoring Widget */}
      <div className="fixed top-20 right-6 z-40 w-56 sm:w-64 bg-white rounded-2xl p-3 border-3 border-black shadow-neo-lg text-black">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-black">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full border border-black ${cameraActive ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
            <span className="text-[11px] font-mono font-black tracking-wider uppercase">
              AI PROCTOR LIVE
            </span>
          </div>

          <button
            onClick={toggleMute}
            title={isSirenMuted ? 'Unmute Siren' : 'Mute Siren'}
            className="p-1 rounded bg-[#f8f5ee] border border-black shadow-[1px_1px_0px_#000] text-black hover:bg-[#ffe600] transition-colors"
          >
            {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border-2 border-black shadow-neo-sm">
          <video ref={videoRef} autoPlay playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-cover transform -scale-x-100" />

          {/* Orientation Badge Overlay */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-mono font-black px-2 py-1 rounded bg-white border border-black shadow-[1px_1px_0px_#000]">
            <span className={headPose === 'center' ? 'text-[#059669]' : 'text-[#d97706]'}>
              HEAD: {headPose.toUpperCase()}
            </span>
            <span className="text-black">
              FACES: {faceCount}
            </span>
          </div>
        </div>

        {/* Quick Demo Controls for Examiner */}
        <div className="mt-2.5 pt-2 border-t-2 border-black flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black border-2 border-black shadow-neo-sm flex items-center justify-center gap-1 transition-all ${
                cameraActive ? 'bg-[#fca5a5] hover:bg-[#ef4444] text-black' : 'bg-[#86efac] text-black'
              }`}
            >
              {cameraActive ? <CameraOff className="w-3 h-3 stroke-[2.5]" /> : <Camera className="w-3 h-3 stroke-[2.5]" />}
              <span>{cameraActive ? 'Cam Off (Demo)' : 'Turn Cam On'}</span>
            </button>

            <button
              type="button"
              onClick={triggerManualGazeViolation}
              className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black bg-[#fde047] hover:bg-[#facc15] text-black border-2 border-black shadow-neo-sm flex items-center justify-center gap-1 transition-all"
            >
              <EyeOff className="w-3 h-3 stroke-[2.5]" />
              <span>Siren Demo</span>
            </button>
          </div>

          <button
            type="button"
            onClick={triggerMultipleFacesViolation}
            className="w-full py-1 rounded-lg text-[10px] font-black bg-[#e9d5ff] hover:bg-[#d8b4fe] text-black border-2 border-black shadow-neo-sm flex items-center justify-center gap-1 transition-all"
          >
            <Users className="w-3 h-3 stroke-[2.5]" />
            <span>Simulate Multiple Faces Flag</span>
          </button>
        </div>
      </div>

      {/* COMPULSORY CAMERA BLOCKING POPUP */}
      {isCameraCompulsoryBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 text-center border-4 border-black shadow-neo-xl">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#fee2e2] border-3 border-black shadow-neo flex items-center justify-center text-[#dc2626] mb-5 animate-bounce">
              <CameraOff className="w-10 h-10 stroke-[2.5]" />
            </div>

            <span className="neo-badge bg-[#ef4444] text-white text-xs px-3 py-1 mb-2 inline-block">
              CRITICAL PROCTORING VIOLATION
            </span>

            <h3 className="text-2xl font-black text-black font-display uppercase tracking-tight mb-2">
              CAMERA IS COMPULSORY!
            </h3>

            <p className="text-sm font-semibold text-slate-800 mb-6 leading-relaxed">
              Your camera is turned off or blocked. Under strict examination rules,
              <strong className="text-[#b91c1c] underline"> you cannot answer questions or submit the test </strong>
              until continuous live video proctoring is enabled.
            </p>

            <button
              type="button"
              onClick={startCamera}
              className="w-full py-4 bg-[#86efac] hover:bg-[#4ade80] text-black font-black rounded-xl text-base neo-btn-lg flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Camera className="w-5 h-5 stroke-[3]" />
              <span>Enable Camera to Continue Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* WARNING POPUP & SIREN MODAL */}
      {warningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-[#fef3c7] rounded-2xl p-6 text-center border-4 border-black shadow-neo-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-3 border-black shadow-neo flex items-center justify-center text-[#d97706] mb-3">
              <AlertTriangle className="w-9 h-9 stroke-[3]" />
            </div>

            <h4 className="text-lg font-black text-black font-display uppercase tracking-tight mb-2">
              {warningModal.title}
            </h4>

            <p className="text-xs font-bold text-slate-800 mb-5 leading-snug">
              {warningModal.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setWarningModal(null);
                siren.stop();
              }}
              className="w-full py-3 bg-[#ffe600] hover:bg-[#fde047] text-black font-black rounded-xl text-xs neo-btn uppercase tracking-wide"
            >
              I Understand — Return to Exam
            </button>
          </div>
        </div>
      )}
    </>
  );
}
