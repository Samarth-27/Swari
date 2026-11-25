# Swari Legal & Regulatory Defense Blueprint
**Compliance Focus:** Indian Motor Vehicles Act, 1988 & Digital Personal Data Protection Act, 2023 (DPDP)

---

## 1. Compliance Under Motor Vehicles Act, 1988 (MV Act)

### The Legal Problem: Sections 66 & 192A
- **Section 66:** Prohibits any vehicle from being used as a "transport vehicle" (commercial carriage) in any public place without an official commercial permit.
- **Section 192A:** Imposes fines up to ₹10,000 and vehicle impoundment for driving without a permit.
- **Taxi Union Grievance:** Commercial taxi unions argue that private ("white-board") car owners carrying paying passengers are running unlicensed, unmetered taxis.

### The Swari Defense: Cost-Sharing is Non-Commercial
Under Indian and international jurisprudence, genuine **carpooling is legally distinguished from a taxi service** by the absence of commercial profit:
1. **The Trip Pre-Existence Test:** The driver has an independent personal reason for traveling to that destination (work, home, vacation). The driver does not operate on passenger demand or loop continuously.
2. **The Algorithmic Cost Ceiling:** Swari enforces hard programmatic caps on price-per-seat.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Cost-Cap Calculation Formula                      │
├────────────────────────────────────────────────────────────────────────┤
│ Max Seat Price = ((Distance in km × Cost/km) + FASTag Tolls) / Capacity│
│                                                                        │
│ Example (Bengaluru to Chennai, 345 km):                                │
│ • Fuel/wear cost (Hatchback/Sedan @ ₹7.50/km) = ₹2,587.50              │
│ • Highway FASTag Tolls (Attibele + Krishnagiri + Ranipet) = ₹420.00    │
│ • Total Journey Cost = ₹3,007.50                                       │
│ • Divided across 4 occupants = ₹751.87 max allowable seat price        │
└────────────────────────────────────────────────────────────────────────┘
```
Any driver attempting to post a seat above the statutory formula threshold is blocked by the platform.

### Digital Trip Manifest (In-App Legal Shield)
In the event an RTO inspector or police officer stops a Swari vehicle:
- Both driver and passengers can display the **"Swari Digital Trip Manifest"**.
- The manifest displays:
  - Driver Aadhaar & DL verification status.
  - Vehicle private registration confirmation.
  - Explicit declaration of fuel expense splitting pursuant to non-commercial community travel.
  - Absence of corporate or commercial taxi commission.

---

## 2. Compliance with Digital Personal Data Protection Act, 2023 (DPDP)

1. **Aadhaar Protection:**
   - Raw 12-digit Aadhaar numbers are never stored in any database column.
   - Digilocker API returns a one-way irreversible hash (`SHA-256 + Salt`) used exclusively to detect duplicate accounts.
   - Only masked IDs (`XXXX-XXXX-1234`) are presented in the UI.
2. **Phone Number Masking:**
   - Passengers and drivers communicate via temporary virtual proxy DID numbers (Exotel / Twilio).
   - Calling records expire immediately after trip completion.
3. **Right to Erasure:**
   - Users can delete their account, permanently purging telemetry history, chat logs, and facial verification vectors.
