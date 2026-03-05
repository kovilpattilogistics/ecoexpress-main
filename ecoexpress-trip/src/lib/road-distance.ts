// Road distance calculation using OSRM (OpenStreetMap Routing Machine)
// Free, no API key required — uses actual road data

type LatLng = { lat: number; lng: number };

export const KOVILPATTI_CENTER: LatLng = { lat: 9.1714, lng: 77.8614 };

/**
 * Calculate road distance between an ordered list of waypoints
 * using the OSRM public API (route service).
 * Returns total distance in km.
 */
export async function getRoadDistance(waypoints: LatLng[]): Promise<number> {
    if (waypoints.length < 2) return 0;

    // OSRM expects coordinates as lng,lat (not lat,lng)
    const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&steps=false`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes?.[0]) {
            // OSRM returns distance in meters
            const meters = data.routes[0].distance;
            return Math.round(meters / 1000); // Convert to km
        }

        console.warn('OSRM routing failed, falling back to haversine:', data.code);
        return fallbackHaversine(waypoints);
    } catch (err) {
        console.warn('OSRM request failed, falling back to haversine:', err);
        return fallbackHaversine(waypoints);
    }
}

/** Haversine fallback for when OSRM is unavailable */
function fallbackHaversine(waypoints: LatLng[]): number {
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        total += haversine(waypoints[i], waypoints[i + 1]);
    }
    return Math.round(total);
}

function haversine(a: LatLng, b: LatLng): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
