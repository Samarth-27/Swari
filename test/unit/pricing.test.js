import { describe, it, expect } from 'vitest';
import { calculateLegalPriceCeiling, FUEL_RATES_PER_KM } from '../../server/services/legalGuardrail.js';

describe('Pricing Engine & Motor Vehicles Act Cost Guardrails', () => {
  it('calculates legal ceiling for Bengaluru -> Chennai EV corridor', () => {
    // 340 km on EV with BLR-MAA toll estimate ₹420
    const result = calculateLegalPriceCeiling('BLR-MAA', 340, 'ELECTRIC_EV');

    expect(result.distanceKm).toBe(340);
    expect(result.fuelRatePerKm).toBe(FUEL_RATES_PER_KM.ELECTRIC_EV);
    expect(result.estimatedTollsInr).toBe(420);
    // (340 * 3.5) + 420 = 1190 + 420 = 1610 / 4 = 402.5 -> ceil 403
    expect(result.legalCeilingPerSeatInr).toBe(403);
    expect(result.isCompliant(400)).toBe(true);
    expect(result.isCompliant(500)).toBe(false);
  });

  it('calculates legal ceiling for Delhi -> Chandigarh Petrol corridor', () => {
    // 250 km on Petrol with DEL-CHD toll estimate ₹380
    const result = calculateLegalPriceCeiling('DEL-CHD', 250, 'PETROL');

    expect(result.distanceKm).toBe(250);
    expect(result.fuelRatePerKm).toBe(FUEL_RATES_PER_KM.PETROL);
    // (250 * 7.8) + 380 = 1950 + 380 = 2330 / 4 = 582.5 -> ceil 583
    expect(result.legalCeilingPerSeatInr).toBe(583);
    expect(result.isCompliant(580)).toBe(true);
    expect(result.isCompliant(650)).toBe(false);
  });

  it('rejects commercial surge fares exceeding statutory ceiling', () => {
    const result = calculateLegalPriceCeiling('MUM-PUN', 150, 'DIESEL');
    // (150 * 6.9) + 320 = 1035 + 320 = 1355 / 4 = 338.75 -> ceil 339
    expect(result.isCompliant(339)).toBe(true);
    expect(result.isCompliant(340)).toBe(false);
    expect(result.isCompliant(1000)).toBe(false);
  });
});
