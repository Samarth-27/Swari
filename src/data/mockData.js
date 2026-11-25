// Swari Platform Data Layer
// Supports Intercity Corridors, GPS Waypoints, Passenger Broadcasts, and Verified Driver Fleets

export const HIGHWAY_ROUTES = {
  'BLR-MAA': {
    id: 'BLR-MAA',
    name: 'NH 44 / NH 48: Bengaluru to Chennai',
    distanceKm: 345,
    approxDuration: '5h 45m',
    waypoints: [
      { name: 'Bengaluru (Silk Board / Electronic City)', lat: 12.9172, lng: 77.6228, type: 'origin' },
      { name: 'Attibele Toll Plaza', lat: 12.7846, lng: 77.7719, type: 'toll' },
      { name: 'Hosur Bypass (Tamil Nadu Border)', lat: 12.7409, lng: 77.8253, type: 'stop' },
      { name: 'Krishnagiri Toll Plaza', lat: 12.5266, lng: 78.2144, type: 'toll' },
      { name: 'Vaniyambadi Bypass', lat: 12.6825, lng: 78.6200, type: 'stop' },
      { name: 'Vellore Golden Temple Bypass', lat: 12.9165, lng: 79.1325, type: 'stop' },
      { name: 'Ranipet Toll', lat: 12.9284, lng: 79.3331, type: 'toll' },
      { name: 'Sriperumbudur Industrial Hub', lat: 12.9675, lng: 79.9436, type: 'stop' },
      { name: 'Chennai (Koyambedu / Guindy)', lat: 13.0694, lng: 80.1948, type: 'destination' }
    ]
  },
  'DEL-CHD': {
    id: 'DEL-CHD',
    name: 'NH 44: Delhi NCR to Chandigarh',
    distanceKm: 245,
    approxDuration: '4h 15m',
    waypoints: [
      { name: 'Delhi (Kashmere Gate / Mukarba Chowk)', lat: 28.7186, lng: 77.1611, type: 'origin' },
      { name: 'Murthal (Amrik Sukhdev)', lat: 29.0263, lng: 77.0722, type: 'stop' },
      { name: 'Panipat Toll Plaza', lat: 29.3909, lng: 76.9635, type: 'toll' },
      { name: 'Karnal Bypass', lat: 29.6857, lng: 76.9905, type: 'stop' },
      { name: 'Kurukshetra Toll', lat: 29.9695, lng: 76.8783, type: 'toll' },
      { name: 'Ambala Cantt Junction', lat: 30.3782, lng: 76.7767, type: 'stop' },
      { name: 'Chandigarh (Tribune Chowk / Sector 17)', lat: 30.7333, lng: 76.7794, type: 'destination' }
    ]
  },
  'MUM-PUN': {
    id: 'MUM-PUN',
    name: 'Mumbai-Pune Yashwantrao Chavan Expressway',
    distanceKm: 148,
    approxDuration: '2h 50m',
    waypoints: [
      { name: 'Navi Mumbai (Vashi / Kalamboli)', lat: 19.0330, lng: 73.0297, type: 'origin' },
      { name: 'Khalapur Toll Plaza', lat: 18.8252, lng: 73.2872, type: 'toll' },
      { name: 'Lonavala / Khandala Food Mall', lat: 18.7557, lng: 73.4091, type: 'stop' },
      { name: 'Talegaon Toll Plaza', lat: 18.7344, lng: 73.6766, type: 'toll' },
      { name: 'Pune (Wakad / Hinjewadi Bridge)', lat: 18.5993, lng: 73.7625, type: 'destination' }
    ]
  }
};

// Available Driver Trips (Rides posted by Car Owners)
export const INITIAL_DRIVER_RIDES = [
  {
    id: 'RIDE-101',
    routeId: 'BLR-MAA',
    driver: {
      name: 'Vikramaditya Rao',
      rating: 4.92,
      totalRides: 84,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isAadhaarVerified: true,
      isDlVerified: true,
      isPoliceVerified: true,
      chattiness: 'Friendly & Conversational',
      phoneMasked: '+91 98XXX-X4921'
    },
    vehicle: {
      make: 'Tata',
      model: 'Nexon EV Empowered',
      plate: 'KA 05 MN 2819',
      color: 'Daytona Grey',
      ac: true,
      music: 'Spotify curated playlist'
    },
    origin: 'Bengaluru (Electronic City Toll)',
    destination: 'Chennai (Koyambedu Metro)',
    departureTime: 'Today, 04:30 PM',
    seatsAvailable: 2,
    totalSeats: 3,
    pricePerSeat: 620,
    allowSmoking: false,
    allowPets: false,
    womenOnly: false,
    bookingMode: 'INSTANT',
    status: 'ACTIVE_AVAILABLE'
  },
  {
    id: 'RIDE-102',
    routeId: 'BLR-MAA',
    driver: {
      name: 'Dr. Ananya Subramanian',
      rating: 4.98,
      totalRides: 42,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      isAadhaarVerified: true,
      isDlVerified: true,
      isPoliceVerified: false,
      chattiness: 'Quiet & Professional',
      phoneMasked: '+91 94XXX-X8312'
    },
    vehicle: {
      make: 'Hyundai',
      model: 'Creta SX(O)',
      plate: 'TN 07 BQ 6190',
      color: 'Polar White',
      ac: true,
      music: 'Soft Instrumental'
    },
    origin: 'Bengaluru (Silk Board Junction)',
    destination: 'Chennai (Guindy Kathipara)',
    departureTime: 'Tomorrow, 07:00 AM',
    seatsAvailable: 3,
    totalSeats: 3,
    pricePerSeat: 590,
    allowSmoking: false,
    allowPets: false,
    womenOnly: true, // Special Safety Feature
    bookingMode: 'ON_REQUEST',
    status: 'ACTIVE_AVAILABLE'
  },
  {
    id: 'RIDE-103',
    routeId: 'DEL-CHD',
    driver: {
      name: 'Harpreet Singh Dhillon',
      rating: 4.88,
      totalRides: 112,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      isAadhaarVerified: true,
      isDlVerified: true,
      isPoliceVerified: true,
      chattiness: 'Love Punjabi Music & Travel',
      phoneMasked: '+91 98XXX-X1290'
    },
    vehicle: {
      make: 'Mahindra',
      model: 'XUV700 AX7 Luxury',
      plate: 'CH 01 BW 7700',
      color: 'Midnight Black',
      ac: true,
      music: 'Bhangra & Bollywood'
    },
    origin: 'Delhi (Kashmere Gate ISBT)',
    destination: 'Chandigarh (Sector 17 Plaza)',
    departureTime: 'Today, 06:00 PM',
    seatsAvailable: 1,
    totalSeats: 4,
    pricePerSeat: 480,
    allowSmoking: false,
    allowPets: true,
    womenOnly: false,
    status: 'ACTIVE_AVAILABLE'
  },
  {
    id: 'RIDE-104',
    routeId: 'MUM-PUN',
    driver: {
      name: 'Ketan Deshmukh',
      rating: 4.95,
      totalRides: 63,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      isAadhaarVerified: true,
      isDlVerified: true,
      isPoliceVerified: true,
      chattiness: 'Tech Talk & Startups',
      phoneMasked: '+91 99XXX-X5512'
    },
    vehicle: {
      make: 'Honda',
      model: 'City ZX Hybrid',
      plate: 'MH 12 QX 4501',
      color: 'Meteoroid Grey',
      ac: true,
      music: 'Classic Rock / Podcasts'
    },
    origin: 'Navi Mumbai (Vashi Plaza)',
    destination: 'Pune (Hinjewadi Phase 1)',
    departureTime: 'Today, 05:15 PM',
    seatsAvailable: 2,
    totalSeats: 3,
    pricePerSeat: 350,
    allowSmoking: false,
    allowPets: false,
    womenOnly: false,
    status: 'ACTIVE_AVAILABLE'
  }
];

// Passenger Broadcast Requests (Feature Requested: Passengers posting requests with budgets)
export const INITIAL_PASSENGER_REQUESTS = [
  {
    id: 'REQ-201',
    routeId: 'BLR-MAA',
    passenger: {
      name: 'Rahul Sharma',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      completedTrips: 18,
      isAadhaarVerified: true,
      isCorporateVerified: true,
      company: 'Infosys Bangalore'
    },
    origin: 'Bengaluru (Electronic City Toll Gate)',
    destination: 'Chennai (Vellore Bypass or Koyambedu)',
    desiredTime: 'Today between 4:00 PM – 5:30 PM',
    seatsNeeded: 1,
    budgetInRupees: 550, // User's explicit budget
    luggage: '1 Laptop Backpack + 1 Cabin Trolley',
    notes: 'Going home for weekend. Flexible on exact drop location along highway.',
    driverOffers: [
      {
        driverName: 'Vikramaditya Rao',
        car: 'Tata Nexon EV',
        offeredFare: 550,
        pickupEstimate: '04:45 PM',
        status: 'PENDING'
      }
    ]
  },
  {
    id: 'REQ-202',
    routeId: 'BLR-MAA',
    passenger: {
      name: 'Pooja Venkatesh',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      completedTrips: 9,
      isAadhaarVerified: true,
      isCorporateVerified: true,
      company: 'Wipro Sarjapur'
    },
    origin: 'Bengaluru (HSR Layout / Silk Board)',
    destination: 'Chennai (Guindy Kathipara)',
    desiredTime: 'Tomorrow morning, 07:00 AM – 08:00 AM',
    seatsNeeded: 1,
    budgetInRupees: 600,
    luggage: '1 Medium Suitcase',
    notes: 'Prefers non-smoking & women driver if available. Sedate driving.',
    driverOffers: []
  },
  {
    id: 'REQ-203',
    routeId: 'DEL-CHD',
    passenger: {
      name: 'Manish Verma',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      rating: 4.85,
      completedTrips: 31,
      isAadhaarVerified: true,
      isCorporateVerified: false,
      company: 'Freelance Architect'
    },
    origin: 'Delhi (Majnu Ka Tilla / Mukarba Chowk)',
    destination: 'Chandigarh (Sector 35 or 43 ISBT)',
    desiredTime: 'Today around 06:30 PM',
    seatsNeeded: 2,
    budgetInRupees: 950, // For 2 seats
    luggage: '2 Backpacks',
    notes: 'Travelling with brother. Can meet anywhere on GT Karnal Road.',
    driverOffers: []
  },
  {
    id: 'REQ-204',
    routeId: 'MUM-PUN',
    passenger: {
      name: 'Sneha Kulkarni',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      rating: 4.96,
      completedTrips: 14,
      isAadhaarVerified: true,
      isCorporateVerified: true,
      company: 'TCS Mumbai'
    },
    origin: 'Navi Mumbai (Kharghar Three Star)',
    destination: 'Pune (Bavdhan / Kothrud)',
    desiredTime: 'Today, 05:30 PM',
    seatsNeeded: 1,
    budgetInRupees: 350,
    luggage: '1 Laptop Bag',
    notes: 'Daily/weekly commuter. Timely pickup appreciated.',
    driverOffers: []
  }
];

// Current Active Tracked Ride (For Requirement #1: Live GPS tracking)
export const ACTIVE_MOCK_TRIP = {
  tripId: 'SWARI-TRIP-98421',
  routeId: 'BLR-MAA',
  passengerName: 'Rahul Sharma',
  passengerPhone: '+91 97XXX-X1142',
  bookingTime: 'Today at 03:15 PM',
  status: 'IN_TRANSIT', // 'PICKUP_APPROACHING' | 'IN_TRANSIT' | 'ARRIVED'
  driver: {
    name: 'Vikramaditya Rao',
    rating: 4.92,
    totalRides: 84,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phoneMasked: '+91 98XXX-X4921',
    isAadhaarVerified: true,
    isDlVerified: true
  },
  vehicle: {
    make: 'Tata',
    model: 'Nexon EV Empowered',
    plate: 'KA 05 MN 2819',
    color: 'Daytona Grey',
    fuelType: 'Electric (EV)',
    batteryPercent: 78
  },
  currentTelemetry: {
    speedKmph: 84,
    headingDeg: 85,
    currentHighway: 'NH 44 (Hosur-Krishnagiri Expressway)',
    lat: 12.6310,
    lng: 78.0120,
    nextToll: 'Krishnagiri Toll Plaza (18 km ahead)',
    distanceRemainingKm: 218,
    etaMinutes: 205,
    etaFormatted: '08:45 PM'
  },
  pickupPoint: {
    name: 'Bengaluru (Electronic City Elevated Toll)',
    timeCompleted: '04:32 PM',
    status: 'COMPLETED'
  },
  dropoffPoint: {
    name: 'Chennai (Koyambedu Metro Station, Gate 2)',
    expectedTime: '08:45 PM',
    status: 'IN_PROGRESS'
  },
  fareTotal: 550,
  paymentStatus: 'SECURED_ESCROW' // Swari SafePay
};
