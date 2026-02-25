import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import './config/supabase';

import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================================
// ALLOWED ORIGINS (CORS)
// =========================================================================
// Tell the backend exactly who is allowed to talk to it
const allowedOrigins = [
  "http://localhost:3000",
  "https://signflow-five-kappa.vercel.app" // Your live Vercel frontend
];

// =========================================================================
// WEBSOCKET SETUP
// =========================================================================
const server = http.createServer(app);

// Initialize Socket.IO and apply the CORS rules
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ WebSocket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`💤 WebSocket disconnected: ${socket.id}`);
  });
});

// =========================================================================
// MIDDLEWARE & ROUTES
// =========================================================================
// Apply the exact same CORS rules to standard API requests
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', documentRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Document Signature API is running with WebSockets!');
});

// =========================================================================
// START SERVER
// =========================================================================
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});