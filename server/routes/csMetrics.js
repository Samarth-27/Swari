import express from 'express';
import { 
  seatSemaphore, 
  bankersEscrow, 
  lruWaypointCache, 
  rideDfa, 
  slidingWindow, 
  tokenBucket, 
  SepmMetricsEngine,
  RouteGrammarLexer
} from '../services/csCoreEngines.js';

const router = express.Router();

function getMetricsSnapshot() {
  return {
    operatingSystems: {
      domain: 'OS (Concurrency, Deadlock Prevention, Memory Caching)',
      seatSemaphoreMutex: seatSemaphore.getStatus(),
      bankersAlgorithm: bankersEscrow.getStatus(),
      lruPagingCache: lruWaypointCache.getMetrics()
    },
    automataTheory: {
      domain: 'FLAT (DFA State Machine, Formal Grammars & Lexers)',
      lifecycleDfa: rideDfa.getDfaSpecification(),
      grammarSyntaxValidation: RouteGrammarLexer.validateSyntax('Bengaluru ➔ Chennai via NH 44')
    },
    computerNetworks: {
      domain: 'CN (Sliding Window Flow Control, Jacobson RTT, Token Bucket)',
      slidingWindowFlowControl: slidingWindow.getNetworkMetrics(),
      trafficShaperTokenBucket: tokenBucket.getMetrics()
    },
    softwareEngineering: {
      domain: 'SEPM (COCOMO II, Function Points, Cyclomatic Complexity, ISO/IEC 25010)',
      ...SepmMetricsEngine.getMetrics()
    }
  };
}

// GET /api/v1/cs-metrics/overview - Returns live state across all 4 CS domains
router.get('/overview', (req, res) => {
  lruWaypointCache.get('Bengaluru-Attibele');
  slidingWindow.receiveAck(slidingWindow.base, 34.5);
  tokenBucket.consume(1);

  res.json({
    success: true,
    platform: 'Swari Computer Science Core Architecture Engine',
    timestamp: new Date().toISOString(),
    domains: getMetricsSnapshot()
  });
});

// POST /api/v1/cs-metrics/dfa/transition - Fire DFA state transition
router.post('/dfa/transition', (req, res) => {
  const { symbol } = req.body;
  const result = rideDfa.transition(symbol);

  // Synchronize over WebSocket across all open tabs
  const io = req.app.get('io');
  if (io) {
    io.emit('cs:metrics:update', getMetricsSnapshot());
  }

  res.json({ success: result.success, transitionResult: result });
});

// POST /api/v1/cs-metrics/semaphore/acquire - Test OS Semaphore permit acquisition
router.post('/semaphore/acquire', async (req, res) => {
  const { processId = 'test_passenger' } = req.body;
  const acquired = await seatSemaphore.acquire(processId);

  // Synchronize over WebSocket across all open tabs
  const io = req.app.get('io');
  if (io) {
    io.emit('cs:metrics:update', getMetricsSnapshot());
  }

  res.json({ success: true, acquired, semaphoreStatus: seatSemaphore.getStatus() });
});

// POST /api/v1/cs-metrics/semaphore/release - Release OS Semaphore permit
router.post('/semaphore/release', (req, res) => {
  seatSemaphore.release();

  // Synchronize over WebSocket across all open tabs
  const io = req.app.get('io');
  if (io) {
    io.emit('cs:metrics:update', getMetricsSnapshot());
  }

  res.json({ success: true, semaphoreStatus: seatSemaphore.getStatus() });
});

export default router;
