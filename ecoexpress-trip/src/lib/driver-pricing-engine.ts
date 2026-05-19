// ─── DRIVER TRIP PRICING ENGINE ─────────────────────────────────────────────
// Calculates fare based on actual trip data: GPS distance, duration, stops.

export interface StopRecord {
    index: number;
    timestamp: Date;
    lat: number;
    lng: number;
    label: string;
}

export interface TripRecord {
    startTime: Date;
    startLat: number;
    startLng: number;
    endTime: Date;
    endLat: number;
    endLng: number;
    stops: StopRecord[];
    distanceKm: number;         // calculated from GPS coords using haversine
    durationMinutes: number;    // derived from start/end timestamps
    numberOfStops: number;      // total delivery stops (including final)
}

export interface DriverFareBreakdown {
    category: string;           // e.g. "Base Town Trip", "Extended Town", etc.
    basePrice: number;
    extraTimeCharge: number;
    extraStopsCharge: number;
    minimumApplied: boolean;
    total: number;
    note: string;
    distanceKm: number;
    durationMinutes: number;
    numberOfStops: number;
}

// ── Haversine distance between two GPS coordinates (km) ─────────────────────
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Calculate total GPS distance across all waypoints ────────────────────────
export function calculateTotalDistance(trip: Pick<TripRecord, 'startLat' | 'startLng' | 'endLat' | 'endLng' | 'stops'>): number {
    const points: { lat: number; lng: number }[] = [
        { lat: trip.startLat, lng: trip.startLng },
        ...trip.stops.map(s => ({ lat: s.lat, lng: s.lng })),
        { lat: trip.endLat, lng: trip.endLng },
    ];

    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += haversineKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
    }
    return Math.round(total * 10) / 10; // round to 1 decimal
}

// ── Extra time charge helper ─────────────────────────────────────────────────
// For every 30 mins beyond the base window, add ₹100.
// If total trip > 1 hour, first extra block = ₹100 + base escalation (already encoded below per category)
function extraTimeCharge(durationMinutes: number, baseWindowMinutes: number): number {
    if (durationMinutes <= baseWindowMinutes) return 0;
    const overMinutes = durationMinutes - baseWindowMinutes;
    const extraBlocks = Math.ceil(overMinutes / 30); // each 30-min block
    return extraBlocks * 100;
}

// ── MASTER DRIVER FARE CALCULATOR ───────────────────────────────────────────
export function calculateDriverFare(
    distanceKm: number,
    durationMinutes: number,
    numberOfStops: number // total drops including final destination
): DriverFareBreakdown {
    const extraStops = Math.max(0, numberOfStops - 1);

    // ── A1: Base Town Trip (0–4 km, ≤ 30 min, single stop) ─────────────────
    if (distanceKm <= 4 && numberOfStops <= 1) {
        const base = 250;
        const timeCharge = extraTimeCharge(durationMinutes, 30);
        const total = base + timeCharge;
        return {
            category: 'Base Town Trip',
            basePrice: base,
            extraTimeCharge: timeCharge,
            extraStopsCharge: 0,
            minimumApplied: false,
            total,
            note: `Up to 4 km, single drop. Base ₹250.${timeCharge > 0 ? ` Extra time: +₹${timeCharge}.` : ''}`,
            distanceKm,
            durationMinutes,
            numberOfStops,
        };
    }

    // ── A2: Extended Town Trip (4–6 km OR 30–60 min, single stop) ──────────
    if (distanceKm <= 6 && numberOfStops <= 1) {
        const base = distanceKm <= 4.5 ? 300 : 350;
        const timeCharge = extraTimeCharge(durationMinutes, 30);
        const total = Math.max(base + timeCharge, base); // minimum = base
        return {
            category: 'Extended Town Trip',
            basePrice: base,
            extraTimeCharge: timeCharge,
            extraStopsCharge: 0,
            minimumApplied: false,
            total,
            note: `Extended town (up to 6 km). Base ₹${base}.${timeCharge > 0 ? ` Extra time: +₹${timeCharge}.` : ''}`,
            distanceKm,
            durationMinutes,
            numberOfStops,
        };
    }

    // ── A3a: Multiple Drops ≤ 4 km — ₹250 + ₹50 per extra stop, no minimum ──
    if (distanceKm <= 4 && numberOfStops > 1) {
        const base = 250;
        const stopsCharge = extraStops * 50;
        const timeCharge = extraTimeCharge(durationMinutes, 30);
        const total = base + stopsCharge + timeCharge;
        return {
            category: 'Town Multi-Drop',
            basePrice: base,
            extraTimeCharge: timeCharge,
            extraStopsCharge: stopsCharge,
            minimumApplied: false,
            total,
            note: `Multi-drop (≤4 km). ₹250 + ₹50 × ${extraStops} extra stop(s)${timeCharge > 0 ? ` + ₹${timeCharge} extra time` : ''}.`,
            distanceKm,
            durationMinutes,
            numberOfStops,
        };
    }

    // ── A3b: Multiple Drops 4–6 km — flat ₹350 ─────────────────────────────
    if (distanceKm <= 6 && numberOfStops > 1) {
        const base = 350;
        const timeCharge = extraTimeCharge(durationMinutes, 30);
        const total = base + timeCharge;
        return {
            category: 'Town Multi-Drop (Extended)',
            basePrice: base,
            extraTimeCharge: timeCharge,
            extraStopsCharge: 0,
            minimumApplied: false,
            total,
            note: `Multi-drop (4–6 km). Flat ₹350${timeCharge > 0 ? ` + ₹${timeCharge} extra time` : ''}.`,
            distanceKm,
            durationMinutes,
            numberOfStops,
        };
    }

    // ── C: Long-Range Trip (> 6 km) ─────────────────────────────────────────
    // Formula: Total = 100 + (distanceKm * 2 * 15)
    // The * 2 accounts for the return journey (round trip)
    const base = 100;
    const roundTripKm = distanceKm * 2;
    const distCharge = Math.round(roundTripKm * 15);
    const total = base + distCharge;
    return {
        category: 'Long-Range Trip',
        basePrice: base,
        extraTimeCharge: 0,
        extraStopsCharge: 0,
        minimumApplied: false,
        total,
        note: `Long range. Base ₹100 + ${distanceKm} km × 2 × ₹15/km = ₹${distCharge}.`,
        distanceKm,
        durationMinutes,
        numberOfStops,
    };
}

// ── Format duration helper ───────────────────────────────────────────────────
export function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
