# Product Requirements Document (PRD)
## Project: Swari (सवारी) — Next-Generation Intercity Carpooling & Ride-Sharing Platform
**Document Version:** 1.0.0-PROD  
**Author:** Principal Architect & Lead Product Manager  
**Status:** Approved for Implementation  
**Target Release:** v1.0 Production  

---

## 1. Executive Summary & Vision

### 1.1 The Market Problem
Intercity travel in India across high-density economic corridors (e.g., Bengaluru–Chennai, Delhi–Chandigarh, Mumbai–Pune, Hyderabad–Vijayawada) is characterized by:
1. **Excessive Cost:** Private commercial cabs (Uber Intercity, MakeMyTrip) charge ₹3,500 to ₹7,000 for a 300 km trip due to round-trip commercial permit taxes and fuel surcharges.
2. **Transit Rigidity:** Intercity trains suffer from multi-week waitlists (Tatkal quota congestion), and state buses have rigid pickup schedules with zero door-to-corridor flexibility.
3. **Empty Highway Capacity:** Over 70% of private cars driving along National Expressways carry only 1 or 2 passengers, burning fossil fuels inefficiently.
4. **Existing Platform Gaps (BlaBlaCar Limitations):**
   - **No Live GPS Tracking:** Passengers are blind to driver location prior to pickup and during transit.
   - **One-Sided Marketplace:** Only drivers post rides. If a passenger has a specific schedule and budget, they cannot broadcast their need to find drivers already on that route.
   - **Regulatory Vulnerability:** Clashes with state taxi unions due to lack of transparent non-commercial cost-sharing compliance under the Motor Vehicles Act 1988.

### 1.2 The Swari Solution
**Swari** is India's first legal-by-design, reverse-market intercity carpooling platform built around:
1. **End-to-End Live Satellite GPS Tracking:** Real-time telemetry, live highway milestone progress, and dynamic ETA calculation.
2. **Reverse Marketplace (Passenger Request Radar & Driver Bidding):** Passengers broadcast origin, destination, and **their personal travel budget (₹)**; car owners send ride invites matching or countering that budget.
3. **Swari Shield™ Trust & Safety:** DigiLocker Aadhaar biometric OCR, Parivahan Driving License & Vehicle RC validation, Women-Only Travel Mode, Masked Calling, and 1-tap Emergency SOS.
4. **Algorithmic Legal Guardrails:** Automated fuel and toll cost-ceiling calculations that guarantee compliance under **Sections 66 & 192A of the Motor Vehicles Act, 1988**.

---

## 2. User Personas

| Persona | Role | Primary Needs | Critical Pain Points |
| :--- | :--- | :--- | :--- |
| **P1: Daily/Weekly Tech Commuter** *(e.g., Bengaluru $\to$ Chennai)* | Passenger | Economical, predictable weekend travel; pickup near highway junction; live tracking so family stays calm. | Last-minute bus cancellations, train waitlists, fear of shady co-passengers. |
| **P2: Private Car Owner / Highway Driver** | Driver | Offset fuel and toll expenses (₹1,500–₹2,500 per trip); avoid boring solo highway driving. | Getting harassed by taxi unions, passengers bringing excessive commercial luggage, cancellations. |
| **P3: Solo Female Traveler** | Passenger | Absolute personal safety, verified companions, emergency responsiveness. | Hesitation traveling with unverified male strangers on long highway stretches at night. |

---

## 3. Product Features & Epics

### Epic 1: Corridor Matching & Geospatial Routing Engine
- **FR-1.1:** System shall ingest driver trip route polylines and decompose journeys into intermediate sub-segments (waypoint slicing).
- **FR-1.2:** System shall use spatial indexing (**Uber H3 / PostGIS `ST_DWithin`**) to match passengers with drivers within a configurable detour corridor ($\le 3.5\text{ km}$ from the highway line).
- **FR-1.3:** System shall dynamically generate **"Boost Stopovers"** at safe highway infrastructure points (toll plazas, flyover underpasses, metro terminal parking) to avoid congested city center detours.

### Epic 2: Live GPS Telemetry & Tracking Engine
- **FR-2.1:** From the moment a ride is confirmed, the passenger client shall receive real-time vehicle GPS coordinates via WebSocket / MQTT stream.
- **FR-2.2:** Real-time HUD shall display current speed ($\text{km/h}$), distance remaining ($\text{km}$), dynamic ETA, next highway FASTag toll plaza, and vehicle status.
- **FR-2.3:** System shall support a 1-tap **WhatsApp Live Tracking Share** link allowing designated family members to view real-time trip progress without downloading the app.
- **FR-2.4:** 1-tap **Emergency SOS** that immediately dispatches vehicle plate, current coordinates, and driver profile to Dial 112 and Swari 24x7 Safety Desk.

### Epic 3: Reverse Marketplace & Passenger Broadcasts
- **FR-3.1:** Passengers can create a **"Ride Request Broadcast"** specifying: Origin, Destination, Travel Window, Seats Needed, Luggage Volume, and **Proposed Budget in ₹**.
- **FR-3.2:** Registered car owners driving that corridor shall receive push alerts and see the request on their **"Passenger Request Radar"**.
- **FR-3.3:** Drivers can submit a **"Car Offer / Invite"** selecting their registered vehicle, proposed pickup time, and accepting or countering the budget.
- **FR-3.4:** Passenger acceptance instantly locks the seat in the trip inventory and initiates the live GPS tracking session.

### Epic 4: Swari Shield™ Trust & Safety Architecture
- **FR-4.1:** **DigiLocker Govt ID Verification:** Instant Aadhaar / Voter ID verification via DigiLocker API with face-match selfie OCR; stores zero raw Aadhaar numbers (only tokenized hash + masked `XXXX-XXXX-1234`).
- **FR-4.2:** **Parivahan Sewa Driver Verification:** Automated API check validating Driving License validity and Vehicle RC status (confirms non-commercial white-plate status, active insurance, and zero impound notices).
- **FR-4.3:** **Masked Proxy Calling:** Calls between passenger and driver routed via virtual proxy numbers (Exotel / Twilio); real phone numbers remain masked.
- **FR-4.4:** **Women-Only Travel Mode:** Strict cryptographic filter ensuring only verified female drivers and female passengers can match.

### Epic 5: Payments, Escrow & Legal Compliance
- **FR-5.1 (SafePay Escrow):** Passenger fare is held in virtual escrow and disbursed to the driver only after both parties confirm safe trip completion or drop-off GPS geo-fence trigger.
- **FR-5.2 (Legal Non-Commercial Price Cap):** Algorithmic formula enforcing:
  $$\text{Max Seat Fare} = \frac{(\text{Distance} \times \text{Fuel Rate per km}) + \text{Highway FASTag Tolls}}{\text{Vehicle Capacity (Seats)}}$$
  This legally guarantees zero commercial profit, satisfying Section 66 of Motor Vehicles Act 1988.

---

## 4. Non-Functional Requirements (NFRs)

| Category | Requirement | Metric / Benchmark |
| :--- | :--- | :--- |
| **Performance** | Geospatial corridor search response time | $P_{95} \le 250\text{ ms}$ under 50,000 concurrent requests |
| **Telemetry Latency** | GPS coordinate transmission from driver to passenger | End-to-end latency $\le 1.2\text{ seconds}$ |
| **Availability** | Core API & Telemetry Gateway uptime | $99.95\%$ SLA |
| **Security & Privacy** | Compliance with Digital Personal Data Protection Act (DPDP Act, 2023) | Zero unencrypted PII at rest; AES-256 for credentials; masked phone numbers |
| **Scalability** | Distributed seat inventory locking | Redis Redlock cluster capable of 10,000 writes/sec with zero race-condition double bookings |

---

## 5. Success Metrics & KPIs
1. **Match Conversion Rate:** $\ge 65\%$ of broadcast passenger requests receive at least 1 verified driver offer within 2 hours.
2. **Safety Incident Rate:** $0.00\%$ critical safety incidents through mandatory DigiLocker/Parivahan identity gating.
3. **Disintermediation Rate:** $< 8\%$ platform leakage via built-in SafePay escrow convenience and automated tracking benefits.
4. **Highway Corridor Density:** $\ge 500$ daily active seats per major 300 km highway corridor.
