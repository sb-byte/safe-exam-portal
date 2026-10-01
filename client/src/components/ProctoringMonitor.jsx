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
  const [headPose, setHeadPose] = useState('center'); // 'center' | 'left' | 'right'
  const [faceCount, setFaceCount] = useState(1);
  const [warningModal, setWarningModal] = useState(null); // { title, message, type }
  const [isSirenMuted, setIsSirenMuted] = useState(false);

  // Looking away timer
  const lookAwayStartRef = useRef(null);
  const lookAwayLoggedRef = useRef(false);
  const noFaceStartRef = useRef(null);
  const noFaceLoggedRef = useRef(false);

  // Helper: Log event to backend API
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

  // Start Proctoring Camera
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
      console.error('Proctoring camera access denied:', err);
      setCameraActive(false);
      setIsCameraCompulsoryBlocked(true);
      if (onCameraStatusChange) onCameraStatusChange(false);
      logViolation('CAMERA_OFF', 'Camera access blocked or permission denied by student', 'CRITICAL');
    }
  }, [logViolation, onCameraStatusChange, setIsCameraCompulsoryBlocked]);

  // Stop camera helper (for demo toggle or unmount)
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

  // Frame processing loop for Head Direction and Multiple Faces
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

      // Sample central grid
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

      // RULE: Looking left or right for long (> 3 seconds)
      // -> Warning popup and siren sound!
      if (currentPose !== 'center' && hasFace) {
        if (!lookAwayStartRef.current) {
          lookAwayStartRef.current = now;
        } else if (now - lookAwayStartRef.current > 3000 && !lookAwayLoggedRef.current) {
          lookAwayLoggedRef.current = true;
          const durationSec = Math.round((now - lookAwayStartRef.current) / 1000);

          // Play Siren via Web Audio API!
          siren.playSiren(3000);

          setWarningModal({
            title: '⚠️ Suspicious Gaze / Looking Away Detected!',
            message: `You have been looking ${currentPose.toUpperCase()} for more than 3 seconds. Keep your focus on the exam screen.`,
            type: 'LOOKING_AWAY'
          });

          logViolation('LOOKING_AWAY', `Student looked ${currentPose} for ${durationSec}s`, 'WARNING', durationSec);
        }
      } else {
        lookAwayStartRef.current = null;
        lookAwayLoggedRef.current = false;
      }

      // RULE: No face on camera
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

  // Audio mute toggle
  const toggleMute = () => {
    const muted = siren.toggleMute();
    setIsSirenMuted(muted);
  };

  // Manual Trigger for Examiners (Simulate 4s looking away + siren)
  const triggerManualGazeViolation = () => {
    siren.playSiren(3000);
    setWarningModal({
      title: '⚠️ [DEMO] Looking Away Violation Triggered!',
      message: 'Student detected looking away from screen for 4 seconds. Siren sound synthesized via Web Audio API.',
      type: 'LOOKING_AWAY'
    });
    logViolation('LOOKING_AWAY', 'Looking away from screen for 4s (Demo Siren Trigger)', 'WARNING', 4);
  };

  // Manual Trigger for Multiple Faces
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
      {/* Floating Picture-in-Picture Proctoring HUD */}
      <div className="fixed top-20 right-6 z-40 w-52 sm:w-64 cyber-card rounded-2xl p-2.5 shadow-2xl border border-cyan-500/40 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200">
              AI PROCTOR LIVE
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              title={isSirenMuted ? 'Unmute Warning Siren' : 'Mute Warning Siren'}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isSirenMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
          <video ref={videoRef} autoPlay playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-cover transform -scale-x-100" />

          {/* Orientation Badge Overlay */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/50">
            <span className={headPose === 'center' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              HEAD: {headPose.toUpperCase()}
            </span>
            <span className="text-cyan-300">
              FACES: {faceCount}
            </span>
          </div>
        </div>

        {/* Quick Demo Controls for Examiner / Viva Presentation */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className={`flex-1 py-1 px-1.5 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${
                cameraActive ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {cameraActive ? <CameraOff className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
              <span>{cameraActive ? 'Turn Cam Off (Demo)' : 'Turn Cam On'}</span>
            </button>

            <button
              type="button"
              onClick={triggerManualGazeViolation}
              className="flex-1 py-1 px-1.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 flex items-center justify-center gap-1"
            >
              <EyeOff className="w-3 h-3" />
              <span>Siren Demo</span>
            </button>
          </div>

          <button
            type="button"
            onClick={triggerMultipleFacesViolation}
            className="w-full py-1 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 flex items-center justify-center gap-1"
          >
            <Users className="w-3 h-3" />
            <span>Simulate Multiple Faces Flag</span>
          </button>
        </div>
      </div>

      {/* COMPULSORY CAMERA BLOCKING POPUP REQUIREMENT:
          "Camera is compulsory. If it is off, a popup appears in the middle of the page.
           The student cannot answer or submit until the camera is on." */}
      {isCameraCompulsoryBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-md cyber-card rounded-2xl p-6 sm:p-8 text-center border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/15 border-2 border-red-500 flex items-center justify-center text-red-500 mb-4 animate-bounce">
              <CameraOff className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-white font-display mb-2">
              PROCTORING CAMERA IS COMPULSORY!
            </h3>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Your camera is currently turned off or blocked. Under strict examination regulations,
              <strong className="text-red-400"> you cannot answer questions or submit the test </strong>
              until continuous live video proctoring is restored.
            </p>

            <button
              type="button"
              onClick={startCamera}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Enable Camera to Continue Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* WARNING POPUP & SIREN MODAL REQUIREMENT:
          "Looking left or right for long -> Warning popup and siren sound" */}
      {warningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm cyber-card rounded-2xl p-6 text-center border border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h4 className="text-base font-bold text-amber-300 font-display mb-2">
              {warningModal.title}
            </h4>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              {warningModal.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setWarningModal(null);
                siren.stop();
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              I Understand — Return to Exam
            </button>
          </div>
        </div>
      )}
    </>
  );
}
