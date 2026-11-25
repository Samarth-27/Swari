import express from 'express';
import { dbStore } from '../db/store.js';
import { validateBody } from '../middleware/validate.js';
import { sosSchema, luggageTagSchema } from '../validators/schemas.js';
import { sosLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Simulated Emergency Services Provider Interface (MOCK Provider Contract)
class MockErss112DispatchProvider {
  dispatchEmergency(alertData) {
    return {
      success: true,
      provider: 'MOCK_ERSS_112',
      dispatchReference: `ERSS-MOCK-${Date.now()}`,
      dispatched: true,
      message: 'SIMULATED: ERSS 112 emergency response dispatch flagged'
    };
  }
}

class RealErss112DispatchStub {
  dispatchEmergency() {
    throw new Error('Real Police ERSS 112 API not configured in MOCK mode.');
  }
}

const mockErssProvider = new MockErss112DispatchProvider();

// POST /api/v1/safety/sos - Trigger Silent Emergency SOS (MOCK Provider)
router.post('/sos', sosLimiter, validateBody(sosSchema), (req, res) => {
  try {
    const { tripId, currentLocation, vehiclePlate, driverName } = req.body;

    const mockDispatch = mockErssProvider.dispatchEmergency({ tripId, currentLocation, vehiclePlate });

    const emergencyPayload = {
      alertId: `SOS-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tripId: tripId || 'SWARI-TRIP-98421',
      vehiclePlate: vehiclePlate || 'KA 05 MN 2819',
      driverName: driverName || 'Vikramaditya Rao',
      coordinates: currentLocation || { lat: 12.6310, lng: 78.0120 },
      erss112Dispatched: true,
      swariEmergencyDeskAlerted: true,
      provider: 'MOCK_ERSS_112',
      audioRecordingStreamUrl: `https://vault.swari.in/audio/enc-${Date.now()}.mp3`,
      status: 'ACTIVE_POLICE_RESPONSE'
    };

    dbStore.logSos(emergencyPayload);

    // Audit Log: Emergency SOS activation
    dbStore.logAudit('SOS_TRIGGERED', 'SAFETY', emergencyPayload.tripId, req.user?.id || 'ANONYMOUS', req.user?.role || 'PASSENGER', {
      vehiclePlate: emergencyPayload.vehiclePlate,
      coordinates: emergencyPayload.coordinates,
      provider: mockDispatch.provider
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('sos:alert', emergencyPayload);
    }

    res.status(200).json({
      success: true,
      message: 'Emergency SOS activated. Police ERSS 112 (MOCK) and Swari Safety Desk dispatched.',
      data: emergencyPayload
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/safety/luggage/tag - Register & Insure Luggage (MOCK Provider)
router.post('/luggage/tag', validateBody(luggageTagSchema), (req, res) => {
  try {
    const { tripId, bagCount, description, photoVerified } = req.body;

    const tagRecord = {
      tagId: `TAG-${Date.now().toString().slice(-5)}`,
      tripId: tripId || 'SWARI-TRIP-98421',
      bagCount: bagCount || 1,
      description: description || 'Cabin Trolley',
      photoVerified: photoVerified ?? true,
      insuranceProvider: 'MOCK_TRANSIT_SHIELD_UNDERWRITER',
      insuranceCoverInr: 25000,
      timestamp: new Date().toISOString()
    };

    dbStore.saveLuggageTag(tagRecord);
    res.json({ success: true, message: 'Luggage tagged & insured up to ₹25,000 (MOCK Insurance)', data: tagRecord });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/safety/manifest/:tripId - Generate In-App Legal Manifest for Police/RTO Checks
router.get('/manifest/:tripId', (req, res) => {
  const { tripId } = req.params;

  res.json({
    success: true,
    manifest: {
      tripId,
      documentType: 'NON_COMMERCIAL_CARPOOL_EXPENSE_SHARING_MANIFEST',
      governingLaw: 'Indian Motor Vehicles Act, 1988 (Section 66/192A Exemption)',
      issuingPlatform: 'Swari Community Technologies Pvt. Ltd.',
      generatedAt: new Date().toISOString(),
      driver: {
        name: 'Vikramaditya Rao',
        aadhaarMasked: 'XXXX-XXXX-9182',
        drivingLicenseNo: 'KA05-2018-0094120',
        parivahanStatus: 'VERIFIED_PRIVATE_NON_COMMERCIAL'
      },
      vehicle: {
        plate: 'KA 05 MN 2819',
        makeModel: 'Tata Nexon EV Empowered',
        registrationType: 'PRIVATE_WHITE_BOARD',
        insuranceActive: true,
        fastagId: '34161FA82910'
      },
      passengers: [
        {
          name: 'Rahul Sharma',
          aadhaarMasked: 'XXXX-XXXX-4412',
          pickup: 'Bengaluru (Electronic City Toll)',
          dropoff: 'Chennai (Koyambedu Metro)',
          fuelContributionInr: 550
        }
      ],
      legalDeclaration: 'This journey is a cost-sharing model designed to align with Motor Vehicles Act rules; needs legal review per state. Money paid strictly offsets fuel, electricity, and highway FASTag tolls. The driver earns zero commercial revenue.'
    }
  });
});

export default router;
