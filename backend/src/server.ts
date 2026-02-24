import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'; // <-- NEW IMPORT
import { Server } from 'socket.io';
import './config/supabase';

import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================================
// WEBSOCKET SETUP
// =========================================================================
// We wrap the Express app in a standard HTTP server so Socket.IO can attach to it
const server = http.createServer(app);

// Initialize Socket.IO and allow your frontend to connect
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Next.js frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Listen for connections to prove it's working!
io.on('connection', (socket) => {
  console.log(`⚡ WebSocket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`💤 WebSocket disconnected: ${socket.id}`);
  });
});

// =========================================================================
// MIDDLEWARE & ROUTES
// =========================================================================
app.use(cors());
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
// IMPORTANT: We must use server.listen() instead of app.listen() to start both HTTP and WebSockets!
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});