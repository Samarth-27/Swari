// Swari Geospatial Corridor & Waypoint Engine

export const HIGHWAYS = {
  'BLR-MAA': {
    id: 'BLR-MAA',
    name: 'NH 44 / NH 48: Bengaluru to Chennai',
    distanceKm: 345,
    waypoints: [
      { name: 'Bengaluru (Silk Board / Electronic City)', lat: 12.9172, lng: 77.6228, type: 'origin' },
      { name: 'Attibele Toll Plaza', lat: 12.7846, lng: 77.7719, type: 'toll' },
      { name: 'Hosur Bypass (Tamil Nadu Border)', lat: 12.7409, lng: 77.8253, type: 'stop' },
      { name: 'Krishnagiri Toll Plaza', lat: 12.5266, lng: 78.2144, type: 'toll' },
      { name: 'Vaniyambadi Bypass', lat: 12.6825, lng: 78.6200, type: 'stop' },
      { name: 'Vellore Golden Temple Bypass', lat: 12.9165, lng: 79.1325, type: 'stop' },
      { name: 'Ranipet Toll Plaza', lat: 12.9284, lng: 79.3331, type: 'toll' },
      { name: 'Sriperumbudur Industrial Hub', lat: 12.9675, lng: 79.9436, type: 'stop' },
      { name: 'Chennai (Koyambedu / Guindy)', lat: 13.0694, lng: 80.1948, type: 'destination' }
    ]
  },
  'DEL-CHD': {
    id: 'DEL-CHD',
    name: 'NH 44: Delhi NCR to Chandigarh',
    distanceKm: 245,
    waypoints: [
      { name: 'Delhi (Kashmere Gate / Mukarba Chowk)', lat: 28.7186, lng: 77.1611, type: 'origin' },
      { name: 'Murthal (Amrik Sukhdev)', lat: 29.0263, lng: 77.0722, type: 'stop' },
      { name: 'Panipat Toll Plaza', lat: 29.3909, lng: 76.9635, type: 'toll' },
      { name: 'Karnal Bypass', lat: 29.6857, lng: 76.9905, type: 'stop' },
      { name: 'Kurukshetra Toll Plaza', lat: 29.9695, lng: 76.8783, type: 'toll' },
      { name: 'Ambala Cantt Junction', lat: 30.3782, lng: 76.7767, type: 'stop' },
      { name: 'Chandigarh (Sector 17 / Tribune Chowk)', lat: 30.7333, lng: 76.7794, type: 'destination' }
    ]
  },
  'MUM-PUN': {
    id: 'MUM-PUN',
    name: 'Mumbai-Pune Yashwantrao Chavan Expressway',
    distanceKm: 148,
    waypoints: [
      { name: 'Navi Mumbai (Vashi / Kalamboli)', lat: 19.0330, lng: 73.0297, type: 'origin' },
      { name: 'Khalapur Toll Plaza', lat: 18.8252, lng: 73.2872, type: 'toll' },
      { name: 'Lonavala / Khandala Food Mall', lat: 18.7557, lng: 73.4091, type: 'stop' },
      { name: 'Talegaon Toll Plaza', lat: 18.7344, lng: 73.6766, type: 'toll' },
      { name: 'Pune (Wakad / Hinjewadi Bridge)', lat: 18.5993, lng: 73.7625, type: 'destination' }
    ]
  }
};

/**
 * Haversine distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
