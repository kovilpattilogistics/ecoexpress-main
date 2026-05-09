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

    // --- WAITING JOBS (Vehicle parked mostly, e.g., at Dmart) ---
    // Triggered if the expected wait time is significant (>= 3 hours) and distance is local/medium (<= 10km)
    // Rule: First block up to 3 hours = ₹800. After 3 hours = ₹250/hr (ceiling).
    if (expectedWaitingHours >= 3 && oneWayDistance <= 10) {
        let price = 800;
        let note = `Waiting Job Flat Rate: Up to 3 hours = ₹800.`;
        let waitingCharge = 0;
        
        if (expectedWaitingHours > 3) {
            const extraHours = Math.ceil(expectedWaitingHours - 3);
            waitingCharge = extraHours * 250;
            price += waitingCharge;
            note += ` Extra ${extraHours} hour(s) × ₹250/hr.`;
        }

        return {
            base: 800,
            stopsCharge: 0,
            weightCharge: 0,
            distanceCharge: 0,
            waitingCharge,
            total: price,
            model: 'Dedicated - Waiting Job',
            note,
        };
    }

    // --- TOWN TRIPS (<= 6 km) ---
    if (oneWayDistance <= 6) {
        if (!isSingleShop) {
            // 3) Multiple drops inside town
            const extraStops = Math.max(0, stops - 1);
            const totalTownPrice = 250 + (extraStops * 25);
            const finalTownPrice = Math.max(totalTownPrice, 275);
            
            return {
                base: 250,
                stopsCharge: extraStops * 25,
                weightCharge: 0,
                distanceCharge: 0,
                waitingCharge: finalTownPrice - totalTownPrice, // Minimum adjustment
                total: finalTownPrice,
                model: 'Dedicated - Town (Multiple Drops)',
                note: `Town multi-drop. Base ₹250 + ₹25/extra stop. Minimum ₹275 applied.`,
            };
        } else {
            // 1) Base town trip (0-4 km / up to 30 min)
            // 2) Extended town trip (4-6 km OR 30-60 min)
            // Treating <= 1 hour as "no extra waiting" since 1h is the default/free time
            const isBaseTown = oneWayDistance <= 4 && expectedWaitingHours <= 1;
            
            if (isBaseTown) {
                return {
                    base: 250,
                    stopsCharge: 0,
                    weightCharge: 0,
                    distanceCharge: 0,
                    waitingCharge: 0,
                    total: 250,
                    model: 'Dedicated - Base Town',
                    note: `Up to 4 km. Fixed ₹250.`,
                };
            } else {
                const price = oneWayDistance <= 4.5 ? 300 : 350;
                return {
                    base: price,
                    stopsCharge: 0,
                    weightCharge: 0,
                    distanceCharge: 0,
                    waitingCharge: 0,
                    total: price,
                    model: 'Dedicated - Extended Town',
                    note: `Extended town trip (up to 6 km or >30 min). Fixed ₹${price}.`,
                };
            }
        }
    }

    // --- MEDIUM TRIPS (6-10 km) ---
    if (oneWayDistance > 6 && oneWayDistance <= 10) {
        if (isSingleShop) {
            const extraWaitHrs = Math.max(0, expectedWaitingHours - 1);
            const waitingCharge = extraWaitHrs * 200;
            const distanceCharge = totalDistance * 15;
            return {
                base: SINGLE_DROP_BASE,
                stopsCharge: 0,
                weightCharge: 0,
                distanceCharge,
                waitingCharge,
                total: SINGLE_DROP_BASE + distanceCharge + waitingCharge,
                model: 'Dedicated - Medium (Single Drop)',
                note: `${distLabel} × ₹15/km.` +
                    (waitingCharge > 0 ? ` Waiting: ${extraWaitHrs}h × ₹200/hr.` : ' First 1 hour free, ₹200/hr extra.'),
            };
        } else {
            const extraStops = Math.max(0, stops - 1);
            const stopsCharge = extraStops * DED_MED_EXTRA_STOP;
            const distanceCharge = totalDistance * DED_MED_PER_KM;
            const extraWaitHrs = Math.max(0, expectedWaitingHours - 1);
            const waitingCharge = extraWaitHrs * 200;
            const base = DED_MED_BASE;
            const total = base + stopsCharge + distanceCharge + waitingCharge;
            return {
                base,
                stopsCharge,
                weightCharge: 0,
                distanceCharge,
                waitingCharge,
                total,
                model: 'Dedicated - Medium (Multiple Drops)',
                note: `${distLabel} × ₹${DED_MED_PER_KM}/km.` +
                    (waitingCharge > 0 ? ` Waiting: ${extraWaitHrs}h × ₹200/hr.` : ' First 1 hour free.'),
            };
        }
    }

    // --- LONG-RANGE TRIPS (>10 km) ---
    // Base rules:
    // 1) Per km rate = ₹15 per km
    // 2) Base charge = ₹100
    // 3) Total = Base + (km * 15)
    // 4) For jobs > 4 hours, minimum is ₹1200
    // 5) Waiting: First 3 hours free, then ₹250 per extra hour
    const estimatedDriveHours = totalDistance / 30; // Assuming ~30 km/h average speed
    const estimatedTotalHours = estimatedDriveHours + expectedWaitingHours;
    
    const baseCharge = 100;
    const perKmRate = 15;
    const distanceCharge = totalDistance * perKmRate;
    
    const extraWaitHrs = Math.ceil(Math.max(0, expectedWaitingHours - 3));
    const explicitWaitingCharge = extraWaitHrs * 250;
    
    let calculatedTotal = baseCharge + distanceCharge + explicitWaitingCharge;
    
    // Apply Minimums
    const minTicket = estimatedTotalHours > 4 ? 1200 : 0;
    let finalTotal = Math.max(calculatedTotal, minTicket);
    
    // Distribute any minimum ticket adjustment into waitingCharge (or just add as base adjustment)
    const minAdjustment = Math.max(0, finalTotal - calculatedTotal);
    const totalWaitingCharge = explicitWaitingCharge + minAdjustment; 

    return {
        base: baseCharge,
        stopsCharge: 0,
        weightCharge: 0,
        distanceCharge,
        waitingCharge: totalWaitingCharge,
        total: finalTotal,
        model: 'Dedicated - Long Range',
        note: `${distLabel} × ₹${perKmRate}/km. Base ₹100.` + 
            (explicitWaitingCharge > 0 ? ` Waiting: ${extraWaitHrs}h × ₹250/hr.` : '') +
            (minAdjustment > 0 ? ` Minimum ₹1200 applied (~${estimatedTotalHours.toFixed(1)}h total time).` : ''),
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
