import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { getGeoLocation, parseDeviceInfo } from '../services/geo.js';
import { sendSecurityAlertEmail } from '../services/mailer.js';
import { broadcastSecurityAlert, broadcastUserUpdate } from '../services/socket.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secure-exam-cyber-jwt-key-2026';

// Enterprise Rate Limiter: Protect against credential stuffing & automated brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication requests from this IP. Please wait 15 minutes before retrying.' }
});

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

// Helper: Decode Google JWT Token (JWT format: header.payload.signature)
function decodeGoogleJwt(credential) {
  try {
    const parts = credential.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

// 1. Standard Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, fullName, role = 'student', keystrokeMetrics } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long for enterprise security.' });
    }

    if (db.findUserByUsername(username)) {
      return res.status(409).json({ error: 'Username is already taken. Please choose another.' });
    }

    if (db.findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email is already registered. Please sign in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const safeRole = ['admin', 'faculty', 'student'].includes(role) ? role : 'student';

    const newUser = db.createUser({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
      fullName: fullName || username,
      role: safeRole,
      keystrokeProfile: keystrokeMetrics || null
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '48h' }
    );

    broadcastUserUpdate(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({
      message: 'Account created successfully! You are now logged in.',
      user: safeUser,
      token,
      promptFaceEnrollment: safeRole === 'student'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. Standard Login (Email or Username + Password)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { identifier, password, keystrokeMetrics } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Enterprise Web Browser';

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and Password are required.' });
    }

    const user = db.findUserByUsername(identifier) || db.findUserByEmail(identifier);
    const targetUsername = user ? user.username : identifier;

    let isMatch = false;
    if (user && user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    const location = await getGeoLocation(ip);
    const device = parseDeviceInfo(userAgent);

    if (!isMatch) {
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

      db.addLoginAttempt(attemptRecord);

      // Enterprise Brute Force Alert (after > 3 failed attempts)
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
          console.error('Security alert email dispatch error:', emailErr);
        }

        broadcastSecurityAlert({
          type: 'BRUTE_FORCE_THRESHOLD_EXCEEDED',
          title: '🚨 Enterprise Intrusion Alert: Multiple Failed Attempts',
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
          ? `⚠️ Critical Security Alert: ${failedCount} failed attempts recorded! Security alert email dispatched to ${user?.email || 'account owner'} and logged in SOC dashboard.`
          : `Invalid credentials. (${failedCount}/3 attempts before security alert is dispatched).`
      });
    }

    // Success - reset failed counter
    db.resetFailedAttempts(targetUsername);

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
      { expiresIn: '48h' }
    );

    const { passwordHash, ...safeUser } = user;
    return res.json({
      message: 'Authentication successful.',
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 3. Google OAuth & SSO Authentication
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential, googleProfile, requestedRole } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Enterprise Web Browser';

    let email = null;
    let name = null;
    let picture = null;
    let googleId = null;

    if (credential) {
      const decoded = decodeGoogleJwt(credential);
      if (decoded) {
        email = decoded.email;
        name = decoded.name;
        picture = decoded.picture;
        googleId = decoded.sub;
      }
    } else if (googleProfile) {
      email = googleProfile.email;
      name = googleProfile.name || googleProfile.fullName;
      picture = googleProfile.picture || googleProfile.avatarUrl;
      googleId = googleProfile.googleId || googleProfile.sub || `goog_${Date.now()}`;
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Google authentication token or profile required.' });
    }

    const location = await getGeoLocation(ip);
    const device = parseDeviceInfo(userAgent);

    // Check if user exists by email or googleId
    let user = db.findUserByEmail(email) || (googleId ? db.findUserByGoogleId(googleId) : null);

    if (!user) {
      // Create new enterprise user linked to Google SSO
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (db.findUserByUsername(uniqueUsername)) {
        uniqueUsername = `${baseUsername}${counter++}`;
      }

      const role = requestedRole && ['admin', 'faculty', 'student'].includes(requestedRole)
        ? requestedRole
        : (email.includes('faculty') || email.includes('admin') || email.includes('prof') ? 'faculty' : 'student');

      user = db.createUser({
        username: uniqueUsername,
        email: email.toLowerCase(),
        fullName: name || uniqueUsername,
        role,
        googleId,
        avatarUrl: picture,
        faceEnrolled: false
      });

      broadcastUserUpdate(user);
    } else {
      // Update Google profile info if not present
      if (!user.googleId && googleId) {
        user = db.updateUser(user.id, { googleId, avatarUrl: picture || user.avatarUrl });
      }
    }

    db.addLoginAttempt({
      username: user.username,
      success: true,
      reason: `Google SSO Authentication (${user.email})`,
      ip: location.ip || ip,
      location,
      device,
      attemptCount: 1
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '48h' }
    );

    const { passwordHash, ...safeUser } = user;
    return res.json({
      message: 'Authenticated successfully with Google SSO.',
      user: safeUser,
      token,
      isGoogleAuth: true
    });
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.status(500).json({ error: 'Google SSO authentication failed.' });
  }
});

// 4. Face Enrollment
router.post('/enroll-face', authenticateToken, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    const userId = req.user.id;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ error: '128-d face descriptor vector is required.' });
    }

    const updatedUser = db.updateUser(userId, {
      faceEnrolled: true,
      faceDescriptor: faceDescriptor.slice(0, 128)
    });

    broadcastUserUpdate(updatedUser);

    const { passwordHash, ...safeUser } = updatedUser;
    return res.json({
      message: 'Face biometric template successfully enrolled!',
      user: safeUser
    });
  } catch (err) {
    console.error('Face enrollment error:', err);
    return res.status(500).json({ error: 'Failed to enroll face descriptor.' });
  }
});

// 5. Face Only Login (with verified dynamic liveness)
router.post('/face-login', authLimiter, async (req, res) => {
  try {
    const { username, faceDescriptor, livenessVerified, livenessAction } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Enterprise Web Browser';

    if (!username || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ error: 'Username and face descriptor are required.' });
    }

    const user = db.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User does not exist.' });
    }

    if (!user.faceEnrolled || !user.faceDescriptor) {
      return res.status(400).json({
        error: 'Face login is not enabled for this account. Please sign in with password first to enroll your face.'
      });
    }

    const location = await getGeoLocation(ip);
    const device = parseDeviceInfo(userAgent);

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
        error: 'Liveness verification failed! Static photo or video spoof detected.',
        spoofDetected: true
      });
    }

    const distance = calculateEuclideanDistance(user.faceDescriptor, faceDescriptor);
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
        error: `Face does not match registered biometric profile. Distance: ${distance.toFixed(3)} (Threshold: ${STRICT_THRESHOLD})`,
        distance
      });
    }

    db.addLoginAttempt({
      username: user.username,
      success: true,
      reason: `Face login authenticated with active liveness (${livenessAction})`,
      ip: location.ip || ip,
      location,
      device,
      attemptCount: 1
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '48h' }
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

// 6. User Profile / Session Check
router.get('/me', authenticateToken, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// 7. Security Alert Trigger (Audit / Testing)
router.post('/simulate-alert', authenticateToken, async (req, res) => {
  try {
    const { targetUsername = 'student1' } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Enterprise Web Browser';

    const user = db.findUserByUsername(targetUsername);
    if (!user) {
      return res.status(404).json({ error: `User ${targetUsername} not found.` });
    }

    const location = await getGeoLocation(ip);
    const device = parseDeviceInfo(userAgent);

    let finalAttemptRecord = null;
    for (let i = 1; i <= 4; i++) {
      const count = db.incrementFailedAttempts(targetUsername);
      finalAttemptRecord = db.addLoginAttempt({
        username: targetUsername,
        success: false,
        reason: `Automated Intrusion Simulation #${i}`,
        ip: location.ip || ip,
        location: { ...location, city: i > 2 ? 'Pune' : 'Mumbai' },
        device,
        attemptCount: count,
        timestamp: new Date().toISOString()
      });
    }

    const emailRecord = await sendSecurityAlertEmail({
      user,
      attemptDetails: finalAttemptRecord,
      attemptCount: 4
    });

    broadcastSecurityAlert({
      type: 'BRUTE_FORCE_THRESHOLD_EXCEEDED',
      title: '🚨 Enterprise Intrusion Simulation Triggered',
      username: targetUsername,
      attemptCount: 4,
      location,
      device,
      timestamp: new Date().toISOString()
    });

    return res.json({
      message: `Intrusion test dispatched for ${targetUsername}!`,
      alertDispatched: true,
      emailSentTo: user.email,
      emailId: emailRecord.id,
      previewUrl: emailRecord.previewUrl
    });
  } catch (err) {
    console.error('Simulate alert error:', err);
    return res.status(500).json({ error: 'Failed to simulate alert.' });
  }
});

export default router;
