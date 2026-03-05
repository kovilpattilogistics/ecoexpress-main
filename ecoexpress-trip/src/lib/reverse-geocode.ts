// Reverse geocode lat/lng to a human-readable area name
// Uses BigDataCloud (free, no key, precise for rural India) with Nominatim fallback

type LatLng = { lat: number; lng: number };

/**
 * Try BigDataCloud first (very accurate for India, returns locality + city).
 * Falls back to Nominatim if BigDataCloud fails.
 */
export async function reverseGeocode(point: LatLng): Promise<string> {
    // Try BigDataCloud first
    const bdcResult = await tryBigDataCloud(point);
    if (bdcResult) return bdcResult;

    // Fallback to Nominatim
    const nomResult = await tryNominatim(point);
    if (nomResult) return nomResult;

    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

async function tryBigDataCloud(point: LatLng): Promise<string | null> {
    try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${point.lat}&longitude=${point.lng}&localityLanguage=en`;
        const res = await fetch(url);
        const data = await res.json();

        const parts: string[] = [];

        // Most specific: locality (village/town name)
        if (data.locality) {
            parts.push(data.locality);
        }

        // Next: city or principalSubdivision
        if (data.city && data.city !== data.locality) {
            parts.push(data.city);
        } else if (data.localityInfo?.administrative) {
            // Find the most specific administrative area that isn't already added
            const admins = data.localityInfo.administrative
                .filter((a: { name: string; order: number }) => a.name && a.order >= 6)
                .sort((a: { order: number }, b: { order: number }) => b.order - a.order);

            for (const admin of admins) {
                if (!parts.includes(admin.name)) {
                    parts.push(admin.name);
                    break;
                }
            }
        }

        if (parts.length > 0) return parts.join(', ');
        return null;
    } catch (err) {
        console.warn('BigDataCloud reverse geocode failed:', err);
        return null;
    }
}

async function tryNominatim(point: LatLng): Promise<string | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${point.lat}&lon=${point.lng}&format=json&zoom=18&addressdetails=1`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();

        if (data?.address) {
            const a = data.address;
            // Build from most specific to least specific
            const specific = a.hamlet || a.village || a.neighbourhood || a.suburb || '';
            const broader = a.town || a.city || a.county || '';

            if (specific && broader && specific !== broader) return `${specific}, ${broader}`;
            if (specific) return specific;
            if (broader) return broader;
        }

        if (data?.display_name) {
            return data.display_name.split(',').slice(0, 2).join(',').trim();
        }

        return null;
    } catch (err) {
        console.warn('Nominatim reverse geocode failed:', err);
        return null;
    }
}

/**
 * Forward geocode: convert a place name to lat/lng coordinates.
 * Uses Nominatim search API, biased towards Tamil Nadu, India.
 * Returns { lat, lng } or null if not found.
 */
export async function forwardGeocode(placeName: string): Promise<LatLng | null> {
    if (!placeName || placeName.trim().length < 2) return null;

    try {
        const query = encodeURIComponent(`${placeName.trim()}, Tamil Nadu, India`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();

        if (data?.[0]?.lat && data?.[0]?.lon) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }

        return null;
    } catch (err) {
        console.warn('Forward geocode failed:', err);
        return null;
    }
}

