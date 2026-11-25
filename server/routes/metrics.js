// Swari Prometheus OpenMetrics Exporter
// Endpoint: GET /metrics
// Compliance: OpenMetrics / Prometheus Exposition Format

import express from 'express';
import { dbStore } from '../db/store.js';
import { eventLog } from '../services/eventLog.js';

const router = express.Router();

router.get('/', (req, res) => {
  const io = req.app.get('io');
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const cpu = process.cpuUsage();
  const trips = dbStore.getTrips();
  const activeTrips = trips.filter(t => t.status === 'ACTIVE_AVAILABLE').length;
  const broadcasts = dbStore.getBroadcasts();
  const activeSockets = io?.engine?.clientsCount || 0;
  const seqWatermark = eventLog.getLatestSeq ? eventLog.getLatestSeq() : (eventLog.currentSeq || 0);

  const metrics = [
    '# HELP swari_uptime_seconds Total runtime of the Swari node process in seconds.',
    '# TYPE swari_uptime_seconds counter',
    `swari_uptime_seconds ${uptime.toFixed(2)}`,
    '',
    '# HELP swari_active_websocket_connections Active real-time Socket.IO client connections.',
    '# TYPE swari_active_websocket_connections gauge',
    `swari_active_websocket_connections ${activeSockets}`,
    '',
    '# HELP swari_corridor_trips_total Total trips stored in database store.',
    '# TYPE swari_corridor_trips_total gauge',
    `swari_corridor_trips_total{status="all"} ${trips.length}`,
    `swari_corridor_trips_total{status="active"} ${activeTrips}`,
    '',
    '# HELP swari_broadcast_requests_total Total passenger broadcast budget requests.',
    '# TYPE swari_broadcast_requests_total gauge',
    `swari_broadcast_requests_total ${broadcasts.length}`,
    '',
    '# HELP swari_event_log_sequence_watermark Latest monotonic event sequence number.',
    '# TYPE swari_event_log_sequence_watermark counter',
    `swari_event_log_sequence_watermark ${seqWatermark}`,
    '',
    '# HELP swari_process_memory_bytes Memory usage breakdown of the Node.js runtime in bytes.',
    '# TYPE swari_process_memory_bytes gauge',
    `swari_process_memory_bytes{type="heap_used"} ${mem.heapUsed}`,
    `swari_process_memory_bytes{type="heap_total"} ${mem.heapTotal}`,
    `swari_process_memory_bytes{type="rss"} ${mem.rss}`,
    `swari_process_memory_bytes{type="external"} ${mem.external}`,
    '',
    '# HELP swari_process_cpu_user_seconds_total Total user CPU time spent in seconds.',
    '# TYPE swari_process_cpu_user_seconds_total counter',
    `swari_process_cpu_user_seconds_total ${(cpu.user / 1e6).toFixed(4)}`,
    '',
    '# HELP swari_process_cpu_system_seconds_total Total system CPU time spent in seconds.',
    '# TYPE swari_process_cpu_system_seconds_total counter',
    `swari_process_cpu_system_seconds_total ${(cpu.system / 1e6).toFixed(4)}`
  ];

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metrics.join('\n') + '\n');
});

export default router;
