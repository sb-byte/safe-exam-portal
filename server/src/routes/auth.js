import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { getGeoLocation, parseDeviceInfo } from '../services/geo.js';
import { sendSecurityAlertEmail } from '../services/mailer.js';
import { broadcastSecurityAlert, broadcastUserUpdate } from '../services/socket.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secure-exam-cyber-jwt-key-2026';

// Helper: Calculate Euclidean distance between two face embedding vectors
function calculateEuclideanDistance(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 999;
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, keystrokeMetrics } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    if (db.findUserByUsername(username)) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    if (db.findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.createUser({
      username,
      email,
      passwordHash,
      fullName: fullName || username,
      role: 'student',
      keystrokeProfile: keystrokeMetrics || null // Experiment 2: Keystroke dynamics
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    broadcastUserUpdate(newUser);

    return res.status(201).json({
      message: 'Account created successfully! You are now logged in.',
      user: newUser,
      token,
      promptFaceEnrollment: true // Triggers requirement: "After the first login, an optional popup asks: Do you want to add face login?"
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Standard Login (Email or Username + Password)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, keystrokeMetrics } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Modern Web Browser';

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and Password are required.' });
    }

    // Find by username or email
    const user = db.findUserByUsername(identifier) || db.findUserByEmail(identifier);
    const targetUsername = user ? user.username : identifier;

    // Check password
    let isMatch = false;
    if (user) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    const location = await getGeoLocation(ip);
    const device = parseDeviceInfo(userAgent);

    if (!isMatch) {
      // Increment failed password count for this account
      const failedCount = db.incrementFailedAttempts(targetUsername);

      const attemptRecord = {
        username: targetUsername,
        success: false,
        reason: 'Invalid password entered',
        ip: location.ip || ip,
        location,
        device,
        attemptCount: failedCount,
        keystrokeMetrics: keystrokeMetrics || null
      };

      const savedAttempt = db.addLoginAttempt(attemptRecord);

      // WRONG PASSWORD PROTECTION REQUIREMENT:
      // If someone types a wrong password more than 3 times for a username:
      // 1. The real account owner gets an email: "Someone is trying to log in to your account."
      // 2. The attempt is saved and shown in the admin dashboard.
      // 3. Admin can see: IP, approx location, device name, browser, time, attempt count.
      let emailDispatched = false;
      if (failedCount > 3 && user) {
        try {
          await sendSecurityAlertEmail({
            user,
            attemptDetails: attemptRecord,
            attemptCount: failedCount
          });
          emailDispatched = true;
        } catch (emailErr) {
          console.error('Email dispatch error:', emailErr);
        }

        // Live alert via Socket.io
        broadcastSecurityAlert({
          type: 'BRUTE_FORCE_THRESHOLD_EXCEEDED',
          title: '🚨 Suspicious Brute Force Attack Detected!',
          username: targetUsername,
          attemptCount: failedCount,
          location,
          device,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(401).json({
        error: 'Invalid username or password.',
        failedAttempts: failedCount,
        thresholdExceeded: failedCount > 3,
        emailDispatched,
        message: failedCount > 3
          ? `⚠️ Warning: ${failedCount} failed attempts logged! Security alert email dispatched to ${user?.email || 'account owner'} and reported to Admin.`
          : `Invalid credentials. (${failedCount}/3 attempts before security alert is dispatched).`
      });
    }

    // Success - reset failed counter
    db.resetFailedAttempts(targetUsername);

    // Record successful login
    db.addLoginAttempt({
      username: targetUsername,
      success: true,
      reason: 'Successful password authentication',
      ip: location.ip || ip,
      location,
      device,
      attemptCount: 1
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash, ...safeUser } = user;
    return res.json({
      message: 'Logged in successfully.',
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Face Enrollment
router.post('/enroll-face', async (req, res) => {
  try {
    const { userId, faceDescriptor } = req.body;

    if (!userId || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ error: 'Valid userId and 128-d face descriptor vector are required.' });
    }

    const user = db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Save as numbers, not photos (Privacy requirement #9!)
    const updatedUser = db.updateUser(userId, {
      faceEnrolled: true,
      faceDescriptor: faceDescriptor.slice(0, 128)
    });

    broadcastUserUpdate(updatedUser);

    return res.json({
      message: 'Face biometric template successfully enrolled!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Face enrollment error:', err);
    return res.status(500).json({ error: 'Failed to enroll face descriptor.' });
  }
});

// Face Only Login (with Liveness Check)
router.post('/face-login', async (req, res) => {
  try {
    const { username, faceDescriptor, livenessVerified, livenessAction } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Modern Web Browser';

    if (!username || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ error: 'Username and face descriptor are required.' });
    }

    const user = db.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User does not exist.' });
    }

    if (!user.faceEnrolled || !user.faceDescriptor) {
      return res.status(400).json({
        error: 'Face login is not enabled for this account yet. Please log in with password first to enroll.'
      });
    }

    const location = await getGeoLocation(ip);
    const device = parseDeviceInfo(userAgent);

    // LIVENESS CHECK REQUIREMENT:
    // "The system asks for a random action, like blink or turn head left.
    // A photo or video on phone cannot do this, so it is rejected."
    if (!livenessVerified) {
      db.addLoginAttempt({
        username: user.username,
        success: false,
        reason: 'Liveness test failed (Spoof / static photo rejected)',
        ip: location.ip || ip,
        location,
        device,
        attemptCount: 1
      });

      return res.status(403).json({
        error: 'Liveness verification failed! Static photo or unauthorized video replay detected.',
        spoofDetected: true
      });
    }

    // Compute Euclidean distance with stored biometric template
    const distance = calculateEuclideanDistance(user.faceDescriptor, faceDescriptor);
    // Strict match threshold (Euclidean distance <= 0.50)
    const STRICT_THRESHOLD = 0.50;
    const isMatch = distance <= STRICT_THRESHOLD;

    if (!isMatch) {
      db.addLoginAttempt({
        username: user.username,
        success: false,
        reason: `Face biometric mismatch (Distance: ${distance.toFixed(3)} > ${STRICT_THRESHOLD})`,
        ip: location.ip || ip,
        location,
        device,
        attemptCount: 1
      });

      return res.status(401).json({
        error: `Face does not match registered owner. Biometric distance: ${distance.toFixed(3)} (Threshold: ${STRICT_THRESHOLD})`,
        distance
      });
    }

    // Success
    db.addLoginAttempt({
      username: user.username,
      success: true,
      reason: `Face login authenticated with verified liveness (${livenessAction})`,
      ip: location.ip || ip,
      location,
      device,
      attemptCount: 1
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash, ...safeUser } = user;
    return res.json({
      message: 'Face verified successfully with active liveness!',
      user: safeUser,
      token,
      distance: distance.toFixed(3),
      livenessAction
    });
  } catch (err) {
    console.error('Face login error:', err);
    return res.status(500).json({ error: 'Internal server error during face login.' });
  }
});

// Demo Helper: Trigger 4 wrong password attempts instantly for live viva demo
router.post('/demo-brute-force', async (req, res) => {
  try {
    const { targetUsername = 'student1' } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Modern Web Browser';

    const user = db.findUserByUsername(targetUsername);
    if (!user) {
      return res.status(404).json({ error: `User ${targetUsername} not found.` });
    }

    const location = await getGeoLocation(ip);
    const device = parseDeviceInfo(userAgent);

    let finalAttemptRecord = null;

    // Simulate 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const count = db.incrementFailedAttempts(targetUsername);
      finalAttemptRecord = db.addLoginAttempt({
        username: targetUsername,
        success: false,
        reason: `Brute force simulation attempt #${i} (dictionary attack)`,
        ip: location.ip || ip,
        location: {
          ...location,
          city: i > 2 ? 'Pune' : 'Mumbai'
        },
        device,
        attemptCount: count,
        timestamp: new Date().toISOString()
      });
    }

    // Send email alert for >3 attempts
    const emailRecord = await sendSecurityAlertEmail({
      user,
      attemptDetails: finalAttemptRecord,
      attemptCount: 4
    });

    // Broadcast live socket alert to Admin
    broadcastSecurityAlert({
      type: 'BRUTE_FORCE_THRESHOLD_EXCEEDED',
      title: '🚨 [DEMO] Multi-Factor Brute Force Alert Triggered!',
      username: targetUsername,
      attemptCount: 4,
      location,
      device,
      timestamp: new Date().toISOString()
    });

    return res.json({
      message: `Simulated 4 consecutive wrong password attempts on ${targetUsername}!`,
      alertDispatched: true,
      emailSentTo: user.email,
      emailId: emailRecord.id,
      previewUrl: emailRecord.previewUrl,
      attackerProfile: {
        ip: location.ip,
        city: location.city,
        device: device.device,
        browser: device.browser
      }
    });
  } catch (err) {
    console.error('Demo brute force error:', err);
    return res.status(500).json({ error: 'Failed to simulate brute force.' });
  }
});

export default router;
