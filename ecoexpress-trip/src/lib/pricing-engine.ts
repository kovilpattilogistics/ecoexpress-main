// ─── TYPES ──────────────────────────────────────────
export interface PriceBreakdown {
    base: number;
    stopsCharge: number;
    weightCharge: number;
    distanceCharge: number;
    waitingCharge: number;
    total: number;
    model: string;
    note: string;
}

export interface QuoteResult {
    scheduled: PriceBreakdown;
    dedicated: PriceBreakdown;
    express: PriceBreakdown;
    distance: number;        // one-way km
    pickupRadius: number;    // km from Kovilpatti center
    stops: number;
    weight: number;
}

// ─── CONSTANTS ──────────────────────────────────────
const KOVILPATTI_CENTER = { lat: 9.1714, lng: 77.8614 };

// Scheduled
const SCHED_BASE = 100;           // Base charge per customer booking
const SCHED_PER_STOP = 25;        // Charge per delivery stop/shop
const SCHED_PER_KG = 1.20;        // Charge per kilogram
const SCHED_MIN = 180;            // Minimum price per booking
// Service parameters (info only — used in notes)
const SCHED_ROUTE_DAYS = 'Mon/Wed/Fri/Sat';
const SCHED_CUTOFF = 'previous day 8 PM';
const SCHED_DELIVERY_WINDOW = '11 AM – 3 PM';
const SCHED_MAX_ZONE_KM = 60;

// Dedicated - Local (<3 km)
const DED_LOCAL_BASE = 200;
const DED_LOCAL_EXTRA_STOP = 25;

// Dedicated - Medium (3-10 km)
const DED_MED_BASE = 200;
const DED_MED_EXTRA_STOP = 25;
const DED_MED_PER_KM = 15;      // ₹15/km for all dedicated trips

// Dedicated - Outside (>10 km)
const DED_OUT_BASE = 150;
const DED_OUT_PER_KM = 15;      // Round trip
const DED_OUT_FREE_WAIT_HRS = 1;
const DED_OUT_WAIT_PER_HR = 200;

// Express
const EXPRESS_MULTIPLIER = 1.7;

// ─── HAVERSINE DISTANCE ─────────────────────────────
export function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

// ─── TIER A: SCHEDULED LINE ROUTE ───────────────────
function calculateScheduled(stops: number, weight: number, distance: number): PriceBreakdown {
    // Under 3 km: fixed ₹100 + ₹0.50/kg weight charge
    if (distance < 3) {
        const weightCharge = weight * 0.50;
        const total = Math.round((100 + weightCharge) / 10) * 10;
        return {
            base: 100,
            stopsCharge: 0,
            weightCharge: Math.round(weightCharge),
            distanceCharge: 0,
            waitingCharge: 0,
            total,
            model: 'Scheduled Line Route',
            note: `Local delivery (under 3 km) flat rate. ${SCHED_ROUTE_DAYS}, book by ${SCHED_CUTOFF}. Delivery ${SCHED_DELIVERY_WINDOW}.`,
        };
    }

    // 3 km and above: standard scheduled pricing
    const weightCharge = weight * SCHED_PER_KG;
    const stopsCharge = stops * SCHED_PER_STOP;
    let total = SCHED_BASE + stopsCharge + weightCharge;
    const minApplied = total < SCHED_MIN;
    total = Math.max(total, SCHED_MIN);
    total = Math.round(total / 10) * 10; // Round to nearest ₹10

    return {
        base: SCHED_BASE,
        stopsCharge,
        weightCharge: Math.round(weightCharge),
        distanceCharge: 0,
        waitingCharge: 0,
        total,
        model: 'Scheduled Line Route',
        note: minApplied
            ? `Minimum ₹${SCHED_MIN} applied. ${SCHED_ROUTE_DAYS}, book by ${SCHED_CUTOFF}. Delivery ${SCHED_DELIVERY_WINDOW}. Max ${SCHED_MAX_ZONE_KM} km zone.`
            : `${SCHED_ROUTE_DAYS} schedule. Book by ${SCHED_CUTOFF}. Delivery ${SCHED_DELIVERY_WINDOW}. Max ${SCHED_MAX_ZONE_KM} km zone.`,
    };
}

// ─── TIER B: DEDICATED TRIP ─────────────────────────
function calculateDedicated(
    oneWayDistance: number,
    pickupRadius: number,
    stops: number,
    expectedWaitingHours: number,
    deliveryType: 'single' | 'multiple' | null
): PriceBreakdown {
    // For single shop: driver goes and comes back, so double the distance
    const isSingleShop = deliveryType === 'single' || stops <= 1;
    const totalDistance = isSingleShop ? oneWayDistance * 2 : oneWayDistance;
    const distLabel = isSingleShop ? `${oneWayDistance} km × 2 (round trip) = ${totalDistance} km` : `${oneWayDistance} km (total route)`;
    // Single drop base charge is ₹100
    const SINGLE_DROP_BASE = 100;

    // DEDICATED SINGLE DROP pricing
    if (isSingleShop) {
        const extraWaitHrs = Math.max(0, expectedWaitingHours - 1);
        const waitingCharge = extraWaitHrs * 200;

        if (oneWayDistance <= 5) {
            // ≤ 5 km one-way: flat ₹200 + waiting
            const flatRate = 200;
            return {
                base: flatRate,
                stopsCharge: 0,
                weightCharge: 0,
                distanceCharge: 0,
                waitingCharge,
                total: flatRate + waitingCharge,
                model: 'Dedicated - Single Drop',
                note: `Within 5 km — standard ₹${flatRate}.` +
                    (waitingCharge > 0 ? ` Waiting: ${extraWaitHrs}h × ₹200/hr.` : ' First 1 hour free, ₹200/hr extra.'),
            };
        } else {
            // > 5 km one-way: ₹100 base + round-trip km × ₹15/km + waiting
            const distanceCharge = totalDistance * 15;
            return {
                base: SINGLE_DROP_BASE,
                stopsCharge: 0,
                weightCharge: 0,
                distanceCharge,
                waitingCharge,
                total: SINGLE_DROP_BASE + distanceCharge + waitingCharge,
                model: 'Dedicated - Single Drop',
                note: `${distLabel} × ₹15/km.` +
                    (waitingCharge > 0 ? ` Waiting: ${extraWaitHrs}h × ₹200/hr.` : ' First 1 hour free, ₹200/hr extra.'),
            };
        }
    }

    // MODEL 1: Local (<3 km from Kovilpatti center)
    if (pickupRadius < 3 && oneWayDistance < 3) {
        const extraStops = Math.max(0, stops - 1);
        const stopsCharge = extraStops * DED_LOCAL_EXTRA_STOP;
        const extraWaitHrs = Math.max(0, expectedWaitingHours - 1);
        const waitingCharge = extraWaitHrs * 200; // ₹200/hour after first free hour
        const base = isSingleShop ? SINGLE_DROP_BASE : DED_LOCAL_BASE;
        const total = base + stopsCharge + waitingCharge;
        return {
            base,
            stopsCharge,
            weightCharge: 0,
            distanceCharge: 0,
            waitingCharge,
            total,
            model: 'Dedicated - Local',
            note: waitingCharge > 0
                ? `Within 3 km. Waiting: ${extraWaitHrs}h × ₹200/hr.`
                : `Within 3 km. First 1 hour free, ₹200/hour extra.`,
        };
    }

    // MODEL 2: Medium (3-10 km)
    if (oneWayDistance >= 3 && oneWayDistance <= 10) {
        const extraStops = Math.max(0, stops - 1);
        const stopsCharge = extraStops * DED_MED_EXTRA_STOP;
        const distanceCharge = totalDistance * DED_MED_PER_KM;
        const extraWaitHrs = Math.max(0, expectedWaitingHours - 1);
        const waitingCharge = extraWaitHrs * 200; // ₹200/hour after first free hour
        const base = isSingleShop ? SINGLE_DROP_BASE : DED_MED_BASE;
        const total = base + stopsCharge + distanceCharge + waitingCharge;
        return {
            base,
            stopsCharge,
            weightCharge: 0,
            distanceCharge,
            waitingCharge,
            total,
            model: 'Dedicated - Medium',
            note: `${distLabel} × ₹${DED_MED_PER_KM}/km.` +
                (waitingCharge > 0 ? ` Waiting: ${extraWaitHrs}h × ₹200/hr.` : ' First 1 hour free.'),
        };
    }

    // MODEL 3: Outside (>10 km)
    const distanceCharge = totalDistance * DED_OUT_PER_KM;
    const extraWaitHrs = Math.max(0, expectedWaitingHours - DED_OUT_FREE_WAIT_HRS);
    const waitingCharge = extraWaitHrs * DED_OUT_WAIT_PER_HR;
    const base = isSingleShop ? SINGLE_DROP_BASE : DED_OUT_BASE;
    const total = base + distanceCharge + waitingCharge;

    return {
        base,
        stopsCharge: 0,
        weightCharge: 0,
        distanceCharge,
        waitingCharge,
        total,
        model: 'Dedicated - Outside',
        note: `${distLabel} × ₹${DED_OUT_PER_KM}/km. ` +
            (waitingCharge > 0 ? `Waiting: ${extraWaitHrs}h × ₹${DED_OUT_WAIT_PER_HR}.` : 'First 1 hour free.'),
    };
}

// ─── TIER C: EXPRESS ────────────────────────────────
function calculateExpress(scheduled: PriceBreakdown): PriceBreakdown {
    const total = Math.round(scheduled.total * EXPRESS_MULTIPLIER / 10) * 10;
    return {
        ...scheduled,
        total,
        model: 'Express (Priority)',
        note: `${EXPRESS_MULTIPLIER}× scheduled rate. Same-day priority delivery.`,
    };
}

// ─── MASTER CALCULATOR ──────────────────────────────

export function calculateQuote(
    totalRouteDistance: number,        // pre-calculated road distance in km
    pickupRadius: number,             // pre-calculated road distance from pickup to Kovilpatti center
    stops: number,
    weight: number,
    expectedWaitingHours: number,
    deliveryType: 'single' | 'multiple' | null = null
): QuoteResult {

    // Ensure minimum 1 km
    totalRouteDistance = Math.max(totalRouteDistance, 1);

    const scheduled = calculateScheduled(stops, weight, totalRouteDistance);
    const dedicated = calculateDedicated(totalRouteDistance, pickupRadius, stops, expectedWaitingHours, deliveryType);
    const express = calculateExpress(scheduled);

    return {
        scheduled,
        dedicated,
        express,
        distance: totalRouteDistance,
        pickupRadius,
        stops,
        weight,
    };
}
