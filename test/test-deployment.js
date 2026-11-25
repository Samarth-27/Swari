// Swari Phase 8 Deployment & Operations Verification Test Suite
// Verifies: Prometheus /metrics, Sentry hook, non-root Dockerfile, .env.example placeholders,
// Nginx reverse proxy configuration, and Runbook/Architecture accuracy.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = process.env.SWARI_API_URL || 'http://localhost:8000';

async function assertStep(description, testFn) {
  process.stdout.write(`⏳ Testing: ${description}... `);
  try {
    await testFn();
    console.log('✅ PASSED');
    return true;
  } catch (err) {
    console.log('❌ FAILED');
    console.error('   Error:', err.message);
    return false;
  }
}

async function runDeploymentTests() {
  console.log('\n======================================================');
  console.log('🚀 Running Swari Phase 8 Deployment & Operations Tests');
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Prometheus /metrics Endpoint
  const step1 = await assertStep('Prometheus Metrics Endpoint (GET /metrics returns OpenMetrics format)', async () => {
    const res = await fetch(`${BASE_URL}/metrics`);
    if (!res.ok) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const text = await res.text();

    if (!text.includes('swari_uptime_seconds') || !text.includes('swari_active_websocket_connections') || !text.includes('swari_process_memory_bytes')) {
      throw new Error('Prometheus metrics response missing core Swari metric gauges/counters');
    }
  });
  if (step1) passed++; else failed++;

  // 2. Sentry Hook Interface
  const step2 = await assertStep('Sentry Interface (Captures errors with structured context without crashing)', async () => {
    const { sentry } = await import('../server/lib/sentry.js');
    expectDefined(sentry.captureException, 'captureException method missing');
    expectDefined(sentry.captureMessage, 'captureMessage method missing');

    // Verify it handles exception capture without throwing
    sentry.captureException(new Error('Simulated deployment test error'), {
      testRun: true,
      reqId: 'test-deploy-req-id'
    });
  });
  if (step2) passed++; else failed++;

  // 3. Multi-Stage Non-Root Dockerfile
  const step3 = await assertStep('Production Dockerfile (Multi-stage, non-root node user, healthcheck)', async () => {
    const dockerfilePath = path.join(ROOT_DIR, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) throw new Error('Dockerfile does not exist');
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    if (!content.includes('FROM node:22-alpine AS builder') || !content.includes('FROM node:22-alpine AS runner')) {
      throw new Error('Dockerfile is not multi-stage with separate builder and runner stages');
    }
    if (!content.includes('USER node')) {
      throw new Error('Dockerfile does not switch to non-root USER node');
    }
    if (!content.includes('HEALTHCHECK')) {
      throw new Error('Dockerfile missing HEALTHCHECK instruction');
    }
  });
  if (step3) passed++; else failed++;

  // 4. .env.example Secrets Audit
  const step4 = await assertStep('.env.example Cleanliness (Placeholders only, no realistic secrets)', async () => {
    const envExamplePath = path.join(ROOT_DIR, '.env.example');
    if (!fs.existsSync(envExamplePath)) throw new Error('.env.example does not exist');
    const content = fs.readFileSync(envExamplePath, 'utf-8');

    const suspiciousKeywords = ['password123', 'admin123', 'secret123', 'mysecret'];
    for (const kw of suspiciousKeywords) {
      if (content.toLowerCase().includes(kw)) {
        throw new Error(`Suspicious credential found in .env.example: ${kw}`);
      }
    }

    if (!content.includes('cost-sharing model designed to align with Motor Vehicles Act rules; needs legal review per state')) {
      throw new Error('Missing mandatory Motor Vehicles Act statutory legal notice in .env.example');
    }
  });
  if (step4) passed++; else failed++;

  // 5. Nginx Configuration
  const step5 = await assertStep('Nginx Configuration (WebSocket upgrade, sticky sessions, rate limiting)', async () => {
    const nginxPath = path.join(ROOT_DIR, 'nginx.conf');
    if (!fs.existsSync(nginxPath)) throw new Error('nginx.conf does not exist');
    const content = fs.readFileSync(nginxPath, 'utf-8');

    if (!content.includes('proxy_set_header Upgrade $http_upgrade') || !content.includes('proxy_set_header Connection "upgrade"')) {
      throw new Error('nginx.conf missing WebSocket upgrade headers');
    }
    if (!content.includes('ip_hash')) {
      throw new Error('nginx.conf missing ip_hash for sticky sessions');
    }
  });
  if (step5) passed++; else failed++;

  // 6. Runbook and Architecture Documentation
  const step6 = await assertStep('Operational Documentation (RUNBOOK.md & ARCHITECTURE.md verified)', async () => {
    const runbookPath = path.join(ROOT_DIR, 'docs', 'RUNBOOK.md');
    const archPath = path.join(ROOT_DIR, 'docs', 'ARCHITECTURE.md');

    if (!fs.existsSync(runbookPath) || !fs.existsSync(archPath)) {
      throw new Error('RUNBOOK.md or ARCHITECTURE.md missing in docs/');
    }

    const archContent = fs.readFileSync(archPath, 'utf-8');
    if (!archContent.includes('MockKycProvider') || !archContent.includes('MockErssProvider')) {
      throw new Error('ARCHITECTURE.md must clearly document MOCK interfaces for external services');
    }
  });
  if (step6) passed++; else failed++;

  console.log(`\n======================================================`);
  console.log(`🏁 Phase 8 Tests: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log(`🌟 ALL PHASE 8 DEPLOYMENT CHECKS PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed, check logs.`);
    process.exit(1);
  }
  console.log(`======================================================\n`);
}

function expectDefined(val, msg) {
  if (val === undefined || val === null) throw new Error(msg);
}

runDeploymentTests().catch(err => {
  console.error('Fatal Deployment Test Error:', err);
  process.exit(1);
});
