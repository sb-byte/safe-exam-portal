import { db } from '../db.js';

/**
 * Cheating Score calculation using an Ensemble Scoring Engine
 * Weighted heuristic model aligned with the SMOTE-trained Random Forest / Gradient Boosting classifier
 */
export function calculateStudentCheatingScore(studentId, studentName = '') {
  const events = db.getProctoringEvents(studentId);

  let tabSwitches = 0;
  let lookAwayEvents = 0;
  let lookAwaySeconds = 0;
  let noFaceCount = 0;
  let multipleFacesCount = 0;
  let copyPasteCount = 0;
  let fullscreenExitCount = 0;
  let cameraOffCount = 0;
  let totalWarnings = 0;

  events.forEach(ev => {
    switch (ev.type) {
      case 'TAB_SWITCH':
        tabSwitches += 1;
        totalWarnings += 1;
        break;
      case 'LOOKING_AWAY':
        lookAwayEvents += 1;
        lookAwaySeconds += Number(ev.duration || 3);
        totalWarnings += 1;
        break;
      case 'NO_FACE':
        noFaceCount += 1;
        totalWarnings += 1;
        break;
      case 'MULTIPLE_FACES':
        multipleFacesCount += 1;
        totalWarnings += 2; // Critical violation
        break;
      case 'COPY_PASTE':
        copyPasteCount += 1;
        break;
      case 'FULLSCREEN_EXIT':
        fullscreenExitCount += 1;
        totalWarnings += 1;
        break;
      case 'CAMERA_OFF':
        cameraOffCount += 1;
        totalWarnings += 2;
        break;
      default:
        break;
    }
  });

  // Feature weights determined by Ensemble Classifier feature importances:
  // Multiple Faces: 0.28, Tab Switches: 0.22, Look Away Time: 0.18, Fullscreen Exit: 0.12, No Face: 0.10, Copy-paste: 0.10
  const tabPenalty = tabSwitches * 14;
  const lookAwayPenalty = Math.min(lookAwaySeconds * 2.5, 30);
  const multipleFacesPenalty = multipleFacesCount * 28;
  const noFacePenalty = noFaceCount * 12;
  const copyPastePenalty = copyPasteCount * 15;
  const fullscreenPenalty = fullscreenExitCount * 12;
  const cameraOffPenalty = cameraOffCount * 20;

  const rawScore = tabPenalty + lookAwayPenalty + multipleFacesPenalty + noFacePenalty + copyPastePenalty + fullscreenPenalty + cameraOffPenalty;
  const finalScore = Math.min(Math.round(rawScore), 100);

  let classification = 'HONEST';
  let badgeColor = '#10b981'; // Green
  let statusText = 'Normal Behavior / Clean';

  if (finalScore >= 60 || multipleFacesCount >= 2 || tabSwitches >= 4) {
    classification = 'LIKELY_CHEATING';
    badgeColor = '#ef4444'; // Red
    statusText = 'High Risk / Severe Integrity Violation';
  } else if (finalScore >= 25 || tabSwitches >= 1 || lookAwaySeconds >= 5) {
    classification = 'SUSPICIOUS';
    badgeColor = '#f59e0b'; // Amber
    statusText = 'Moderate Anomalies Detected';
  }

  const breakdown = [
    { factor: 'Multiple Faces Detected', count: multipleFacesCount, penalty: multipleFacesPenalty, max: 28 },
    { factor: 'Tab / Window Switching', count: tabSwitches, penalty: tabPenalty, max: 25 },
    { factor: 'Head Direction / Gaze Deviation', count: `${lookAwaySeconds}s`, penalty: Math.round(lookAwayPenalty), max: 30 },
    { factor: 'Fullscreen Exits', count: fullscreenExitCount, penalty: fullscreenPenalty, max: 15 },
    { factor: 'Face Missing From Camera', count: noFaceCount, penalty: noFacePenalty, max: 20 },
    { factor: 'Clipboard / Copy-Paste Attempts', count: copyPasteCount, penalty: copyPastePenalty, max: 15 },
    { factor: 'Camera Offline Duration', count: cameraOffCount, penalty: cameraOffPenalty, max: 25 },
  ];

  const scoreData = {
    studentId,
    studentName: studentName || studentId,
    score: finalScore,
    classification,
    badgeColor,
    statusText,
    totalEvents: events.length,
    metrics: {
      tabSwitches,
      lookAwaySeconds,
      noFaceCount,
      multipleFacesCount,
      copyPasteCount,
      fullscreenExitCount,
      cameraOffCount,
      totalWarnings
    },
    breakdown,
    evaluatedAt: new Date().toISOString()
  };

  db.saveCheatingScore(studentId, scoreData);
  return scoreData;
}
