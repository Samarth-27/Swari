// Swari Sanitization & Privacy Security Engine
// Neutralizes XSS, strips malicious tags, and enforces co-traveler phone number privacy

export function sanitizeChatText(text) {
  if (!text || typeof text !== 'string') return '';

  // 1. Strip all HTML/XML tags
  let sanitized = text.replace(/<[^>]*>?/gm, '');

  // 2. Escape dangerous script characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/javascript:/gi, '')
    .trim();

  // 3. Truncate to 500 character limit
  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500);
  }

  return sanitized;
}

export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '+91 98XXX-X0000';
  const clean = phone.trim();

  // Pattern: +91 98451-94921 -> +91 98XXX-X4921
  if (clean.length >= 10) {
    const last4 = clean.slice(-4);
    const first4 = clean.slice(0, 6);
    return `${first4}XXX-X${last4}`;
  }
  return '+91 98XXX-X0000';
}

/**
 * Filter trip payload based on viewer's relationship:
 * Confirmed co-travelers (driver or booked passenger) receive real contact details.
 * Non-participants receive strictly masked phones and zero passenger PII.
 */
export function filterTripForViewer(trip, viewerUser) {
  if (!trip) return null;
  const cloned = JSON.parse(JSON.stringify(trip));

  if (!viewerUser) {
    // Completely unauthenticated / public stranger
    if (cloned.driver) {
      cloned.driver.phone = maskPhoneNumber(cloned.driver.phone || cloned.driver.phoneMasked);
      cloned.driver.phoneMasked = maskPhoneNumber(cloned.driver.phoneMasked);
    }
    // Redact passenger phone numbers and names
    if (cloned.bookedPassengers) {
      cloned.bookedPassengers = cloned.bookedPassengers.map((p, idx) => ({
        bookingId: `BK-CONF-${idx + 1}`,
        name: 'Verified Co-Traveler',
        seats: p.seats || 1,
        rating: p.rating || 5.0
      }));
    }
    cloned.passengers = [];
    return cloned;
  }

  // Check if viewer is an authorized co-traveler
  const isDriver = (cloned.driverId && cloned.driverId === viewerUser.id) ||
    (cloned.driver?.name && viewerUser.fullName && cloned.driver.name.trim().toLowerCase() === viewerUser.fullName.trim().toLowerCase());

  const isBookedPassenger = (cloned.bookedPassengers || []).some(p => 
    (p.id && p.id === viewerUser.id) ||
    (p.passengerId && p.passengerId === viewerUser.id) ||
    (p.name && viewerUser.fullName && p.name.trim().toLowerCase() === viewerUser.fullName.trim().toLowerCase())
  );

  const isAdmin = viewerUser.role === 'ADMIN';
  const isConfirmedCoTraveler = isDriver || isBookedPassenger || isAdmin;

  if (!isConfirmedCoTraveler) {
    // Stranger logged in as unrelated passenger
    if (cloned.driver) {
      cloned.driver.phone = maskPhoneNumber(cloned.driver.phone || cloned.driver.phoneMasked);
      cloned.driver.phoneMasked = maskPhoneNumber(cloned.driver.phoneMasked);
    }
    if (cloned.bookedPassengers) {
      cloned.bookedPassengers = cloned.bookedPassengers.map((p, idx) => ({
        bookingId: `BK-CONF-${idx + 1}`,
        name: 'Verified Co-Traveler',
        seats: p.seats || 1,
        rating: p.rating || 5.0
      }));
    }
    cloned.passengers = [];
  }

  return cloned;
}
