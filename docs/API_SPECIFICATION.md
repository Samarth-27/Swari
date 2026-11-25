# Swari API Specification & Real-Time Event Contracts
**Protocol:** REST (JSON) + WebSockets (Socket.IO / WSS)  
**Authentication:** Bearer JWT in `Authorization` header

---

## 1. REST Endpoints

### 1.1 Authentication & Swari Shield™ Identity
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/otp/send` | Dispatches phone OTP via SMS gateway |
| `POST` | `/api/v1/auth/otp/verify` | Verifies OTP, returns session JWT |
| `POST` | `/api/v1/shield/digilocker/init` | Initiates DigiLocker OAuth KYC flow |
| `POST` | `/api/v1/shield/digilocker/callback` | Ingests verified Aadhaar token & verifies face match |
| `POST` | `/api/v1/shield/parivahan/verify-dl` | Validates Driving License against Parivahan Sewa |
| `POST` | `/api/v1/shield/parivahan/verify-rc` | Validates Vehicle Registration (white-board check) |

### 1.2 Trips & Corridor Engine
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/trips/publish` | Car owner publishes planned highway trip |
| `GET` | `/api/v1/trips/search` | Spatial corridor search (`origin_lat`, `origin_lng`, `dest_lat`, `dest_lng`) |
| `GET` | `/api/v1/trips/:id` | Returns complete trip details and waypoint schedule |
| `POST` | `/api/v1/trips/:id/book` | Reserves seat, locks segment, triggers SafePay escrow |

### 1.3 Reverse Marketplace: Passenger Broadcasts & Driver Offers
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/broadcasts/publish` | Passenger broadcasts ride request with **budget in ₹** |
| `GET` | `/api/v1/broadcasts/radar` | Drivers query nearby passenger requests along their route corridor |
| `POST` | `/api/v1/broadcasts/:id/offer` | Driver submits car offer / invite with vehicle and price |
| `POST` | `/api/v1/broadcasts/offers/:offerId/accept` | Passenger accepts offer, creates active booking |

### 1.4 Safety, Proxy Calling & SOS
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/safety/masked-call/initiate` | Connects driver & passenger via Exotel proxy without revealing numbers |
| `POST` | `/api/v1/safety/sos/trigger` | Triggers national emergency (112), alert to contacts, and safety dispatch |
| `GET` | `/api/v1/safety/track/:trackingToken` | Public read-only live GPS telemetry for family WhatsApp links |

---

## 2. Real-Time WebSocket Event Contract (`/ws/telemetry`)

### Driver Ingestion Stream (Driver $\to$ Server)
```json
// Event: "telemetry:ping"
{
  "tripId": "SWARI-TRIP-98421",
  "lat": 12.6310,
  "lng": 78.0120,
  "speedKmph": 84.5,
  "bearing": 85.0,
  "accuracyMeters": 4.2,
  "batteryPercent": 78,
  "timestamp": 1732310400000
}
```

### Passenger Broadcast Stream (Server $\to$ Passenger)
```json
// Event: "telemetry:update"
{
  "tripId": "SWARI-TRIP-98421",
  "currentLocation": {
    "lat": 12.6310,
    "lng": 78.0120
  },
  "speedKmph": 84,
  "distanceRemainingKm": 218,
  "etaMinutes": 205,
  "nextMilestone": "Krishnagiri Toll Plaza (18 km ahead)",
  "milestoneStatus": "IN_TRANSIT"
}
```

### Offer Notification Stream (Server $\to$ Passenger)
```json
// Event: "offer:received"
{
  "broadcastId": "REQ-201",
  "offerId": "OFFER-9912",
  "driver": {
    "name": "Vikramaditya Rao",
    "avatar": "https://...",
    "rating": 4.92,
    "isAadhaarVerified": true
  },
  "vehicle": "Tata Nexon EV (KA 05 MN 2819)",
  "offeredFare": 550,
  "pickupEstimate": "04:45 PM"
}
```
