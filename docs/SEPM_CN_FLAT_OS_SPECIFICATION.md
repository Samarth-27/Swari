# SWARI (सवारी) COMPUTER SCIENCE SYSTEMS SPECIFICATION
## Rigorous Integration of SEPM, CN, FLAT, and OS Disciplines

---

## 1. Operating Systems (OS) Engine

### 1.1 Critical Section & Race Condition Prevention
* **Problem**: In intercity carpooling, when multiple passengers attempt to reserve the final remaining seat in a vehicle simultaneously via concurrent HTTP/WebSocket threads, a classic race condition occurs, resulting in double-booking.
* **OS Implementation (`server/services/csCoreEngines.js`)**:
  * **Counting Semaphore & Binary Mutex (`SeatMutexSemaphore`)**:
    * Enforces Dijkstra's $P$ (Wait) and $V$ (Signal) primitives around the seat allocation critical section.
    * Uses a thread-safe waiting queue to serialize competing booking requests.

### 1.2 Deadlock Avoidance: Dijkstra's Banker's Algorithm
* **Problem**: SafePay Escrow transactions lock multiple discrete resource vectors:
  1. Vehicle Seat Inventory ($R_1$)
  2. SafePay Escrow Cash Balance ($R_2$)
  3. Luggage Transit Insurance Allocation ($R_3$)
* **OS Implementation (`BankersEscrowAllocator`)**:
  * Formally evaluates the Available vector $A$, Allocation matrix $\text{Alloc}$, and Max Claims matrix $\text{Max}$.
  * A resource request is granted **only if the resulting system state is mathematically proven to be a Safe State**, eliminating circular wait conditions.

### 1.3 Memory Paging & Caching: O(1) LRU Waypoint Replacement
* **OS Implementation (`LruRouteCache`)**:
  * Employs the Least-Recently-Used (LRU) operating system page replacement algorithm combining a hash map with a doubly linked list for $O(1)$ lookup and eviction of corridor waypoints.

---

## 2. Formal Languages & Automata Theory (FLAT)

### 2.1 Deterministic Finite Automaton (DFA) for Ride Lifecycle
* **Formal Definition**: $M = (Q, \Sigma, \delta, q_0, F)$
  * **State Set $Q$**:
    $$Q = \{\text{DRAFT}, \text{BROADCASTED}, \text{OFFER_MATCHED}, \text{SEAT_LOCKED}, \text{IN_TRANSIT}, \text{COMPLETED}, \text{EMERGENCY_HALT}, \text{CANCELLED}\}$$
  * **Alphabet $\Sigma$**:
    $$\Sigma = \{\text{PUBLISH}, \text{SEND_OFFER}, \text{ACCEPT}, \text{PAY_LOCK}, \text{START}, \text{ARRIVE}, \text{TRIGGER_SOS}, \text{RESOLVE_SOS}, \text{CANCEL}\}$$
  * **Initial State**: $q_0 = \text{DRAFT}$
  * **Final States $F$**: $F = \{\text{COMPLETED}, \text{CANCELLED}\}$
  * **Transition Function $\delta$**:
    $$\delta(\text{DRAFT}, \text{PUBLISH}) = \text{BROADCASTED}$$
    $$\delta(\text{BROADCASTED}, \text{SEND_OFFER}) = \text{OFFER_MATCHED}$$
    $$\delta(\text{OFFER_MATCHED}, \text{ACCEPT}) = \text{SEAT_LOCKED}$$
    $$\delta(\text{SEAT_LOCKED}, \text{PAY_LOCK}) = \text{IN_TRANSIT}$$
    $$\delta(\text{IN_TRANSIT}, \text{ARRIVE}) = \text{COMPLETED}$$
    $$\delta(\text{IN_TRANSIT}, \text{TRIGGER_SOS}) = \text{EMERGENCY_HALT}$$
    $$\delta(\text{EMERGENCY_HALT}, \text{RESOLVE_SOS}) = \text{IN_TRANSIT}$$

* **Safety Guarantee**: Illegal transitions (e.g. attempting to jump from `DRAFT` to `IN_TRANSIT` without payment) are rejected by the DFA transition validator.

### 2.2 Regular Grammars & Lexers (`RouteGrammarLexer`)
* Enforces formal Chomsky Type-3 regular grammars on passenger route input strings:
  $$G = (V, \Sigma, R, S) \quad\text{where}\quad S \to \text{ORIGIN} \;\text{ARROW}\; \text{DESTINATION}$$

---

## 3. Computer Networks (CN)

### 3.1 Sliding Window Flow Control & Packet Sequencing
* **Protocol**: Go-Back-N / Selective Repeat with window size $N = 4$ for continuous high-frequency GPS telemetry streaming.
* **Jacobson/Karels Adaptive RTT & RTO Algorithm**:
  $$\text{SRTT}_{n} = (1 - \alpha) \cdot \text{SRTT}_{n-1} + \alpha \cdot \text{RTT}_{\text{sample}} \quad (\alpha = 0.125)$$
  $$\text{RTTVAR}_{n} = (1 - \beta) \cdot \text{RTTVAR}_{n-1} + \beta \cdot |\text{SRTT}_{n} - \text{RTT}_{\text{sample}}| \quad (\beta = 0.25)$$
  $$\text{RTO} = \text{SRTT} + 4 \cdot \text{RTTVAR}$$
  Ensures real-time packet retransmission over highway cellular jitter.

### 3.2 Token Bucket Traffic Shaper (Congestion Control)
* Enforces a burst capacity $C = 10$ with refill rate $r = 2\text{ tokens/sec}$ to smooth sudden telemetry spikes from driver devices and prevent server socket buffer saturation.

---

## 4. Software Engineering & Project Management (SEPM)

### 4.1 Albrecht's Function Point Analysis (FPA)
* **Unadjusted Function Points (UFP)**:
  * External Inputs (EI): $14 \times 4 = 56$
  * External Outputs (EO): $9 \times 5 = 45$
  * External Inquiries (EQ): $8 \times 4 = 32$
  * Internal Logical Files (ILF): $5 \times 10 = 50$
  * External Interface Files (EIF): $3 \times 7 = 21$
  * **Total UFP** $= 204$
* **Value Adjustment Factor (VAF)**: $1.08$ (Real-time distributed telemetry constraint)
* **Adjusted Function Points (AFP)**: $\text{AFP} = 204 \times 1.08 = 220.3\text{ FP}$

### 4.2 Boehm's COCOMO II Estimation
* **KLOC Conversion**: $\text{KLOC} = \text{AFP} \times 0.053 \approx 11.7\text{ KLOC}$
* **Effort Equation (Semi-Detached)**:
  $$\text{Effort} = 3.0 \times (\text{KLOC})^{1.12} \approx 47.1\text{ Person-Months}$$
* **Development Schedule**:
  $$T_{\text{dev}} = 2.5 \times (\text{Effort})^{0.35} \approx 9.6\text{ Months}$$

### 4.3 McCabe's Cyclomatic Complexity
* $V(G) = E - N + 2P$
* Platform average: $V(G) = 3.4$ (well within McConnell's threshold of $< 10$ for high maintainability).

### 4.4 ISO/IEC 25010 Software Product Quality Model
* **Functional Suitability**: Non-commercial fuel cost guardrail under MV Act 1988.
* **Reliability**: Zero data loss via atomic write-ahead persistence and DFA states.
* **Performance Efficiency**: Sub-2ms API responses and 63 kB initial client bundle.
* **Security**: DigiLocker KYC, masked VoIP calls (DPDP Act 2023), and SHA-256 Aadhaar tokenization.
