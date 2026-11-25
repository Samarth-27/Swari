// Swari Legal Cost-Ceiling Engine
// Compliance: Motor Vehicles Act 1988 (Section 66/192A Non-Commercial Expense Pooling)

export const FUEL_RATES_PER_KM = {
  ELECTRIC_EV: 3.50, // Electricity cost + battery wear
  PETROL: 7.80,      // Indian standard petrol consumption @ ~13-15 km/l
  DIESEL: 6.90,      // Diesel consumption @ ~17-19 km/l
  CNG: 4.50,         // CNG rate
  HYBRID: 5.20       // Hybrid electric/petrol
};

export const HIGHWAY_TOLLS_ESTIMATE = {
  'BLR-MAA': 420, // Attibele, Krishnagiri, Ranipet tolls
  'DEL-CHD': 380, // Panipat, Karnal, Kurukshetra tolls
  'MUM-PUN': 320  // Khalapur, Talegaon expressway tolls
};

/**
 * Calculates statutory price ceiling per seat.
 * Formula: ((Distance * Fuel Rate) + Highway Tolls) / Max Occupants (4)
 */
export function calculateLegalPriceCeiling(corridorId, distanceKm, fuelType = 'PETROL') {
  const fuelRate = FUEL_RATES_PER_KM[fuelType] || FUEL_RATES_PER_KM.PETROL;
  const tollCost = HIGHWAY_TOLLS_ESTIMATE[corridorId] || 350;
  
  const totalJourneyCost = (distanceKm * fuelRate) + tollCost;
  const standardOccupancy = 4; // Driver + 3 passengers
  const allowableCeilingPerSeat = Math.ceil(totalJourneyCost / standardOccupancy);

  return {
    distanceKm,
    fuelRatePerKm: fuelRate,
    estimatedTollsInr: tollCost,
    totalTripCostInr: Math.round(totalJourneyCost),
    legalCeilingPerSeatInr: allowableCeilingPerSeat,
    isCompliant: (requestedFare) => requestedFare <= allowableCeilingPerSeat
  };
}
