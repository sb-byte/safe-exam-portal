import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import examRoutes from './routes/exam.js';
import adminRoutes from './routes/admin.js';
import mlRoutes from './routes/ml.js';
import { initializeSocket } from './services/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io with permissive CORS for local dev
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

initializeSocket(io);

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[HTTP ${req.method}] ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SecureExam Autonomous Proctoring Backend',
    timestamp: new Date().toISOString(),
    features: ['Face Login', 'Liveness Check', 'Proctoring Siren', 'Ensemble ML', 'SMOTE', 'FGSM Defense']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]', err);
  res.status(500).json({ error: 'Internal server error occurred.', message: err.message });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  SecureExam Backend Running on http://localhost:${PORT}`);
  console.log(`🔌  WebSocket (Socket.io) Active for Real-Time Alerts`);
  console.log(`🧠  ML Services & Biometrics Module Loaded`);
  console.log(`====================================================`);
});
