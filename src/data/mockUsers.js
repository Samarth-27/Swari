// Swari User Profiles & Personas

export const PERSONAS = {
  admin_hq: {
    id: 'USR-ADMIN-01',
    role: 'ADMIN',
    fullName: 'Swari Operations & Safety Command HQ',
    phone: '+91 80-2800-SWARI',
    email: 'ops-command@swari.in',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    title: 'Chief Safety & Highway Operations Officer',
    badge: 'HQ PLATFORM OPERATOR',
    accessLevel: 'TIER_1_SUPERVISOR',
    rating: 5.0,
    managedCorridors: 3
  },

  passenger_rahul: {
    id: 'USR-PASS-01',
    role: 'PASSENGER',
    fullName: 'Rahul Sharma',
    phone: '+91 97412-88412',
    email: 'rahul.sharma@infosys.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    company: 'Infosys Bangalore',
    rating: 4.92,
    totalTrips: 18,
    aadhaarMasked: 'XXXX-XXXX-4412',
    isAadhaarVerified: true,
    isCorporateVerified: true,
    emergencyContacts: [
      { name: 'Sanjay Sharma (Father)', phone: '+91 98450-XXXXX' },
      { name: 'Priya Sharma (Sister)', phone: '+91 94480-XXXXX' }
    ],
    safePayBalanceInr: 1250,
    activeBroadcasts: ['REQ-201'],
    activeBookings: ['SWARI-TRIP-98421']
  },

  driver_vikram: {
    id: 'USR-DRIV-01',
    role: 'DRIVER',
    fullName: 'Vikramaditya Rao',
    phone: '+91 98451-94921',
    email: 'vikram.rao@techcorp.in',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.96,
    totalHostedRides: 84,
    fuelOffsetTotalInr: 54800,
    aadhaarMasked: 'XXXX-XXXX-9182',
    isAadhaarVerified: true,
    isDlVerified: true,
    isRcVerified: true,
    chattiness: 'Friendly & Conversational',
    vehicle: {
      make: 'Tata',
      model: 'Nexon EV Empowered',
      plate: 'KA 05 MN 2819',
      color: 'Daytona Grey',
      fuelType: 'ELECTRIC_EV',
      insuranceValidTill: '2027-10-15',
      fastagId: '34161FA82910',
      fastagBalance: 1420
    },
    activeTrips: ['SWARI-TRIP-98421']
  },

  driver_ananya: {
    id: 'USR-DRIV-02',
    role: 'DRIVER',
    fullName: 'Dr. Ananya Subramanian',
    phone: '+91 94432-88312',
    email: 'ananya.s@apollohospitals.org',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    rating: 4.98,
    totalHostedRides: 42,
    fuelOffsetTotalInr: 32600,
    aadhaarMasked: 'XXXX-XXXX-7120',
    isAadhaarVerified: true,
    isDlVerified: true,
    isRcVerified: true,
    womenOnlyHost: true,
    chattiness: 'Quiet & Professional',
    vehicle: {
      make: 'Hyundai',
      model: 'Creta SX(O)',
      plate: 'TN 07 BQ 6190',
      color: 'Polar White',
      fuelType: 'PETROL',
      insuranceValidTill: '2026-12-30',
      fastagId: '88219BA44190',
      fastagBalance: 850
    },
    activeTrips: ['RIDE-102']
  }
};
