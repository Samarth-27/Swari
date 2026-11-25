# 🚗 Swari (सवारी) • Enterprise Production Platform

> **Next-Generation Intercity Carpooling & Ride-Sharing Platform**  
> Built with Live Satellite GPS Tracking, Reverse Bidding Marketplace, and Swari Shield™ Identity & Legal Protection.

---

## ⚡ Quick Start

### 1. Unified Single-Port Production Mode (Recommended)
Runs Frontend + REST API + WebSockets on a single port (**8000**):
```bash
# Build production bundle and start unified server
npm run build
npm start
```
* **Unified Web App & API:** `http://localhost:8000`
* **Health Check Probe:** `http://localhost:8000/health`
* **Real-time Telemetry:** `ws://localhost:8000`

### 2. Development Mode (Vite HMR + Backend Server)
```bash
# Terminal 1: Start Backend & WebSocket Gateway
npm run server

# Terminal 2: Start Vite Frontend
npm run dev
```

### 3. Automated Production Smoke Tests
Verifies all 9 system subsystems (Health, Trips, MV Act 1988 Legal Price Ceiling, Broadcasts, Bidding, Silent SOS, Luggage Tagging, Manifests):
```bash
npm run test:smoke
```

---

## 🏛️ Architecture & Specifications Index

* **Product Requirements Document (PRD):** [`docs/PRD.md`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/swari/docs/PRD.md)
* **System Architecture Blueprint:** [`docs/ARCHITECTURE.md`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/swari/docs/ARCHITECTURE.md)
* **REST & WebSocket API Contracts:** [`docs/API_SPECIFICATION.md`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/swari/docs/API_SPECIFICATION.md)
* **Motor Vehicles Act 1988 Compliance:** [`docs/LEGAL_COMPLIANCE.md`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/swari/docs/LEGAL_COMPLIANCE.md)
* **Incident Response & Anti-Theft Protocol:** [`docs/SAFETY_INCIDENT_PROTOCOL.md`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/swari/docs/SAFETY_INCIDENT_PROTOCOL.md)
* **PostGIS Spatial Database Schema:** [`database/schema.sql`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/swari/database/schema.sql)
* **Production Docker Stack:** [`docker-compose.yml`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/swari/docker-compose.yml)
