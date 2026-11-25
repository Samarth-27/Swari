import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import tripsRouter from './routes/trips.js';
import broadcastsRouter from './routes/broadcasts.js';
import shieldRouter from './routes/shield.js';
import safetyRouter from './routes/safety.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import csMetricsRouter from './routes/csMetrics.js';
import syncRouter from './routes/sync.js';
import metricsRouter from './routes/metrics.js';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { telemetryStore } from './services/telemetryStore.js';
import { dbStore } from './db/store.js';
import { verifyAccessToken } from './services/authService.js';
import { authenticate } from './middleware/auth.js';
import { globalLimiter, authLimiter } from './middleware/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../dist');

const app = express();
const server = http.createServer(app);

// Socket.IO Server Configuration with Connection State Recovery
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map(s => s.trim()),
    methods: ['GET', 'POST']
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Redis Adapter Integration for Real-Time Scaling across clusters
if (env.REDIS_URL) {
  try {
    const pubClient = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info({ redisUrl: env.REDIS_URL }, 'Socket.IO Redis Adapter configured successfully');
      })
      .catch((err) => {
        logger.warn({ err: err.message }, 'Redis server unreachable, using in-memory Socket.IO adapter');
      });
  } catch (err) {
    logger.warn({ err: err.message }, 'Error initializing Redis adapter, using in-memory Socket.IO adapter');
  }
}

// Socket.IO Handshake Authentication Middleware (JWT)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || 
    (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.slice(7).trim()
      : null);

  if (token) {
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      logger.warn({ socketId: socket.id }, 'Socket.IO handshake authentication failed: invalid token');
      return next(new Error('Authentication error: Invalid or expired token'));
    }
    socket.user = decoded;
    logger.debug({ socketId: socket.id, userId: decoded.id }, 'Socket.IO authenticated via JWT handshake');
  } else {
    // Guest connection allowed for backward compatibility
    socket.user = { id: 'ANONYMOUS', role: 'GUEST' };
  }
  next();
});

app.set('io', io);

// 1. Request ID and Structured Logging Middleware (Early)
app.use(requestIdMiddleware);

// 2. Security & Production Middleware
// Strict Content Security Policy (Removed 'unsafe-eval' for production security)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.basemaps.cartocdn.com", "https://*.tile.openstreetmap.org", "https://images.unsplash.com"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

// Strict CORS Allowlist parsing from env.CORS_ORIGIN
const corsAllowedList = env.CORS_ORIGIN === '*'
  ? '*'
  : env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsAllowedList === '*' || corsAllowedList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(authenticate);

// Global traffic rate limiter
app.use(globalLimiter);

// 3. API Subsystems
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/trips', tripsRouter);
app.use('/api/v1/broadcasts', broadcastsRouter);
app.use('/api/v1/shield', shieldRouter);
app.use('/api/v1/safety', safetyRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/cs-metrics', csMetricsRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/metrics', metricsRouter);

// 4. Production Health Check Probe (Liveness)
app.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ONLINE',
    platform: 'Swari Enterprise Production Service',
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    system: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      activeSockets: io.engine.clientsCount
    },
    database: {
      persistedTripsCount: dbStore.getTrips().length,
      activeBroadcastsCount: dbStore.getBroadcasts().length,
      storageStatus: 'HEALTHY'
    }
  });
});

// 5. Readiness Probe (/ready)
app.get('/ready', (req, res) => {
  try {
    const trips = dbStore.getTrips();
    res.json({
      status: 'READY',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'HEALTHY',
        storage: 'ACCESSIBLE',
        tripsLoaded: Array.isArray(trips) ? trips.length : 0
      }
    });
  } catch (err) {
    logger.error({ err }, 'Readiness check failed');
    res.status(503).json({
      status: 'NOT_READY',
      error: 'STORAGE_UNAVAILABLE',
      message: err.message
    });
  }
});

// 6. Production Static Frontend Serving (SPA Single-Port Mode)
if (fs.existsSync(DIST_DIR)) {
  logger.info({ distDir: DIST_DIR }, 'Serving production frontend assets');
  app.use(express.static(DIST_DIR, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Client-Side Routing Fallback (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/health') && !req.url.startsWith('/ready') && !req.url.startsWith('/socket.io')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

// 7. API 404 handler for unmatched API routes
app.use('/api', notFoundHandler);

// 8. Global Error Handler Middleware
app.use(errorHandler);

// 9. Real-Time WebSocket Telemetry Gateway
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id, user: socket.user?.id, activeClients: io.engine.clientsCount }, 'WebSocket client connected');

  // Automatically join personal user room if authenticated (user:<userId>)
  if (socket.user && socket.user.id !== 'ANONYMOUS') {
    socket.join(`user:${socket.user.id}`);
    logger.info({ socketId: socket.id, room: `user:${socket.user.id}` }, 'Joined user-scoped personal room');
  }

  // Pushes current state immediately
  const currentTrip = telemetryStore.getTrip('SWARI-TRIP-98421');
  if (currentTrip) {
    socket.emit('telemetry:update', currentTrip);
  }

  // Driver telemetry ingestion
  socket.on('telemetry:ping', (rawPing) => {
    const updated = telemetryStore.updateTelemetry(rawPing.tripId || 'SWARI-TRIP-98421', rawPing);
    if (updated) {
      io.emit('telemetry:update', updated);
    }
  });

  // Trip Room Scoping: joins trip:<tripId>
  socket.on('trip:join', ({ tripId }) => {
    if (tripId) {
      socket.join(`trip:${tripId}`);
      socket.join(tripId);
      logger.info({ socketId: socket.id, tripId, room: `trip:${tripId}` }, 'Socket joined trip room');
    }
  });

  socket.on('trip:leave', ({ tripId }) => {
    if (tripId) {
      socket.leave(`trip:${tripId}`);
      socket.leave(tripId);
    }
  });

  // Real-time Multi-Client Chat Room Support with Persistent Database Storage
  socket.on('chat:join', ({ tripId, userName }) => {
    if (tripId) {
      socket.join(`trip:${tripId}`);
      socket.join(tripId);
      logger.info({ tripId, userName, socketId: socket.id, room: `trip:${tripId}` }, 'User joined live trip chat room');
      // Push existing message history to the joining client immediately
      const history = dbStore.getChatMessages(tripId);
      if (history && history.length > 0) {
        socket.emit('chat:history', history);
      }
    }
  });

  socket.on('chat:send_message', ({ tripId, message }) => {
    if (tripId && message) {
      const msgObj = {
        ...message,
        senderId: socket.user?.id !== 'ANONYMOUS' ? socket.user?.id : (message.senderId || undefined)
      };
      const saved = dbStore.addChatMessage(tripId, msgObj);
      logger.info({ tripId, sender: saved.senderName }, 'Chat message persisted & broadcasted');
      io.to(`trip:${tripId}`).emit('chat:new_message', saved);
      io.to(tripId).emit('chat:new_message', saved);
      io.emit('chat:new_message', saved);
    }
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'WebSocket client disconnected');
  });
});

// Continuous Simulated GPS Telemetry Ping
const telemetryIntervalId = setInterval(() => {
  const current = telemetryStore.getTrip('SWARI-TRIP-98421');
  if (current) {
    const speedVariation = Math.floor(78 + Math.random() * 12);
    const nextLat = current.currentTelemetry.lat + 0.00015;
    const nextLng = current.currentTelemetry.lng + 0.00025;
    
    const updated = telemetryStore.updateTelemetry('SWARI-TRIP-98421', {
      lat: nextLat,
      lng: nextLng,
      speedKmph: speedVariation
    });
    io.emit('telemetry:update', updated);
  }
}, 2000);

// 10. Start Server & Graceful Shutdown
const PORT = env.PORT;
const HOST = env.HOST;

server.listen(PORT, HOST, () => {
  logger.info({
    port: PORT,
    host: HOST,
    env: env.NODE_ENV,
    legalModel: 'cost-sharing model designed to align with Motor Vehicles Act rules; needs legal review per state'
  }, '🚗 SWARI (सवारी) PRODUCTION PLATFORM READY');
});

let isShuttingDown = false;
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, `Received ${signal}. Draining active connections and shutting down gracefully...`);
  
  clearInterval(telemetryIntervalId);

  // Force shutdown timeout after 10s if connections refuse to drain
  const forceExitTimer = setTimeout(() => {
    logger.error('Forcefully terminating process after timeout');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  io.close(() => {
    logger.info('WebSocket connections closed');
    server.close(() => {
      logger.info('HTTP server closed cleanly');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server, io };
