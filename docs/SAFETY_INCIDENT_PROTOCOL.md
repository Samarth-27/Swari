# Swari Safety, Incident Response & Anti-Theft Protocol (IRP)
**Document Version:** 1.0.0-PROD  
**Classification:** Critical Platform Safety Standard  
**Integrations:** National Emergency 112 (ERSS), DigiLocker KYC, Parivahan Sewa, Transit Insurance

---

## 1. Threat Modeling & Incident Classification

| Incident Type | Severity | Primary Risk | Automated Platform Response |
| :--- | :--- | :--- | :--- |
| **In-Cabin Theft / Robbery** | Critical (P0) | Stolen passenger belongings, luggage theft, extortion | Silent SOS, ERSS 112 Police dispatch, DigiLocker KYC police docket, Escrow freeze |
| **Route Deviation / Kidnapping Risk** | Critical (P0) | Car leaving corridor into isolated roads | Geofence anomaly alarm, automated check-in call, highway toll alert |
| **Highway Accident / Collision** | Critical (P0) | Bodily injury, medical trauma | Emergency ambulance dispatch (108), transit insurance claim initiation |
| **Harassment / Inappropriate Behavior** | High (P1) | Verbal abuse, unwanted advances | Women-Only override, masked call logs subpoena, immediate account ban |
| **Vehicle Breakdown on Expressway** | Medium (P2) | Stranded at night on highway | 24x7 Roadside Assistance (RSA), automated companion re-routing |

---

## 2. Anti-Theft Architecture: Why Thieves Cannot Hide on Swari

### A. Pre-Trip: Zero Anonymous Profiles
- **The Core Problem with Buses/Street Cabs:** Thieves buy cash tickets anonymously or use untraceable burner numbers.
- **Swari's Defense:**
  1. **Mandatory DigiLocker KYC:** Every passenger and driver must complete Government ID verification (Aadhaar / Voter ID).
  2. **Liveness Biometric Selfie:** Real-time facial scan matching the government photo. A thief cannot use a stolen ID card.
  3. **Verified Mobile Binding:** Registration requires SIM-bound OTP verification.

### B. During-Trip: Real-Time Detection
- **Luggage Photo Tagging:** Passengers upload a quick photo of their luggage when placing it in the car boot.
- **Silent In-App SOS (No Provocation):**
  - Pressing the SOS button does **not** make loud noises that could provoke a thief.
  - Silently streams high-frequency GPS coordinates to the Swari Safety Desk and Police.
  - Automatically initiates background encrypted ambient audio recording for courtroom evidence.

---

## 3. Step-by-Step Incident Action Plan: "Thief in the Car"

```
[Theft Occurs / Threat Detected]
                 │
                 ├──► [1. Silent SOS Activated by Victim]
                 │          │
                 │          ├──► National Police (ERSS 112): Instant dispatch with vehicle plate & GPS
                 │          ├──► Highway Toll Interception: Automated alert sent to next FASTag plaza
                 │          └──► Emergency Contacts: WhatsApp live tracking link & SOS SMS dispatched
                 │
                 ├──► [2. Financial Defense (SafePay Escrow)]
                 │          │
                 │          └──► Escrow Payout to Driver/Passenger instantly FROZEN
                 │
                 └──► [3. Legal & Law Enforcement Prosecution]
                            │
                            ├──► Generation of "Police Evidentiary Docket"
                            │    (DigiLocker Name, Verified Address, Selfie, GPS Breadcrumbs)
                            ├──► FIR Registration Assistance under BNS Section 303 (Theft)
                            └──► Permanent Device & Aadhaar Blacklisting across Swari Network
```

---

## 4. Mishaps & Accidents Protocol

### A. Complimentary Transit Insurance Cover
Every confirmed seat booked through Swari automatically includes transit insurance (via Acko / ICICI Lombard):
- **Accidental Medical Hospitalization:** Up to ₹2,00,000.
- **Accidental Death / Permanent Disability:** Up to ₹5,00,000.
- **Luggage Loss / Theft Protection:** Up to ₹25,000 (subject to police FIR and initial luggage tag photo).

### B. Highway Breakdown & Rescue
- Swari partners with national highway roadside assistance networks.
- If a vehicle breaks down on the highway:
  1. System sends a recovery tow truck and mechanics.
  2. System broadcasts an emergency "Rescue Pickup" to other verified Swari drivers heading down the same corridor to pick up the stranded passengers at zero extra fare.
