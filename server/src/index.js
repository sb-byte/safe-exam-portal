import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import examRoutes from './routes/exam.js';
import adminRoutes from './routes/admin.js';
import mlRoutes from './routes/ml.js';
import { initializeSocket } from './services/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io for Real-Time Security Operations Center (SOC)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

initializeSocket(io);

// Enterprise Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow client camera models & inline canvas
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Audit Request Logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[AUDIT ${req.method}] ${req.path} - ${new Date().toISOString()}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ml', mlRoutes);

// Health check & System Forensics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SecureExam Enterprise™ Autonomous Proctoring & Integrity Engine',
    database: 'SQLite 3 (WAL mode persistent)',
    timestamp: new Date().toISOString(),
    securityFeatures: [
      'JWT Authentication & RBAC',
      'Face Login with Liveness Challenge',
      'Google Workspace SSO Integration',
      'Rate-Limiting & Brute Force Lockout',
      'Server-Side Question Encryption & Sanitization',
      'Persistent SQLite Database Engine',
      'Admin Question Upload & Examination Studio',
      'Real-Time Web Audio Siren & Video Lockout'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER EXCEPTION]', err);
  res.status(500).json({ error: 'Internal enterprise service error occurred.', message: err.message });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🛡️  SecureExam Enterprise™ Backend Running on http://localhost:${PORT}`);
  console.log(`💾  Database: Persistent SQLite (data/secure_exam.db)`);
  console.log(`🔌  WebSocket SOC Real-Time Telemetry: Active`);
  console.log(`🔒  Enterprise Security & Google SSO Gateway: Initialized`);
  console.log(`================================================================`);
});
